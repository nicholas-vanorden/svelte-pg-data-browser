import { DBInstance } from '$lib/server/db_postgresql'

// Set once the pay_hist_invoice view is known to exist. Only a positive result is cached,
// so if setup was skipped at startup, reads keep checking and pick the view up once it appears.
let invoiceViewReady = false

/**
 * True when public.pay_hist_invoice exists. Callers fall back to a payment-only read
 * when it doesn't (ensureSchema skipped or failed).
 */
export async function isInvoiceViewReady(): Promise<boolean> {
	if (invoiceViewReady) return true
	const pool = (await DBInstance.getInstance()).getPool()
	const { rows } = await pool.query<{ ok: boolean }>(
		`select to_regclass('public.pay_hist_invoice') is not null as ok`
	)
	invoiceViewReady = rows[0]?.ok === true
	return invoiceViewReady
}

/**
 * Idempotent schema additions the app relies on. Safe to run on every startup.
 *
 * Invoices (table `files`, loaded by go-csv2pg-migrator from the vault export CSV)
 * link to payments (table `pay_hist`) by account + billing period:
 *   files.accountid = pay_hist.accountid
 *   AND YYYYMM of files.billdt = pay_hist.period
 * A payment in period P pays the bill dated in month P.
 *
 * The migrator only TRUNCATEs these tables and inserts with explicit column lists,
 * so the generated column and the view survive reloads.
 */
export async function ensureSchema(): Promise<void> {
	const client = await (await DBInstance.getInstance()).getClient()
	try {
		await client.query('BEGIN')
		// Don't hang startup if the migrator is holding a lock on the tables.
		await client.query("SET LOCAL lock_timeout = '5s'")

		const { rows } = await client.query<{ files: string | null; pay_hist: string | null }>(
			`select to_regclass('public.files')::text as files, to_regclass('public.pay_hist')::text as pay_hist`
		)
		if (!rows[0].files || !rows[0].pay_hist) {
			await client.query('ROLLBACK')
			console.warn(
				'ensureSchema: tables "files" and/or "pay_hist" do not exist yet; skipping invoice setup. ' +
					'Load them with go-csv2pg-migrator and restart the app.'
			)
			return
		}

		// 1. files.bill_period (YYYYMM text, matches pay_hist.period).
		//    Checked first so a normal startup never takes a lock on the table.
		const col = await client.query(
			`select 1 from information_schema.columns
			 where table_schema = 'public' and table_name = 'files' and column_name = 'bill_period'`
		)
		if (col.rowCount === 0) {
			// to_char() isn't IMMUTABLE so it can't be used in a generated column; extract() is.
			await client.query(`
				alter table public.files add column if not exists bill_period text
				generated always as (
					(extract(year from billdt)::int * 100 + extract(month from billdt)::int)::text
				) stored`)
			console.info('ensureSchema: added column files.bill_period')
		}

		// 2. Lookup index for the join.
		await client.query(
			`create index if not exists files_accountid_bill_period_idx on public.files (accountid, bill_period)`
		)

		// 3. Payments with the invoice they paid (null when no invoice is on file).
		//    Columns may only be appended here: CREATE OR REPLACE VIEW can't drop or reorder them.
		await client.query(`
			create or replace view public.pay_hist_invoice as
			select
				  ph.customerid
				, ph.accountid
				, ph.period
				, ph.activity
				, ph.rev_type
				, ph.journal
				, ph.post_date
				, ph.amount
				, ph.bill_desc
				, ph.payment_mode
				, ph."user"
				, f.fileid as invoice_fileid
				, f.file   as invoice_file
				, f.billdt as invoice_bill_date
			from public.pay_hist ph
			-- lateral + limit 1: if an account has two bills in one month (e.g. a re-bill),
			-- don't duplicate the payment row; take the latest.
			left join lateral (
				select fileid, file, billdt
				from public.files
				where accountid = ph.accountid
				  and bill_period = ph.period
				order by billdt desc, fileid desc
				limit 1
			) f on true`)

		await client.query('COMMIT')
		invoiceViewReady = true
		console.info('ensureSchema: invoice column, index and view are in place')
	} catch (err) {
		await client.query('ROLLBACK').catch(() => {})
		throw err
	} finally {
		client.release()
	}
}
