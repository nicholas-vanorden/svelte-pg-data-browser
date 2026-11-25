import path from 'node:path'
import { access } from 'node:fs/promises'
import { env } from '$env/dynamic/private'
import PostgreSQL from '$lib/server/db_postgresql'
import type { IAccountInvoice } from '$lib/common/types'

/**
 * Resolves an invoice (files.fileid) to the PDF on disk.
 * PDFs are read from INVOICE_PDF_DIR using the file name stored in files.file
 * (e.g. 000000003600-346353.pdf). Only names that come from the database are used,
 * and only the base name, so a request can't reach outside that folder.
 */
/** File name only: the migrator may store Windows-style paths. */
function pdfFileName(stored: string): string | null {
	const fileName = path.basename(stored.replace(/\\/g, '/'))
	return fileName.toLowerCase().endsWith('.pdf') ? fileName : null
}

async function pdfExists(baseDir: string | undefined, fileName: string | null): Promise<boolean> {
	if (!baseDir || !fileName) return false
	try {
		await access(path.join(baseDir, fileName))
		return true
	} catch {
		return false
	}
}

type AccountInvoiceRow = {
	fileid: string
	file: string | null
	billdt: Date
	period: string
	amount_paid: string | number | null
	payment_count: string | number
}

/**
 * Every invoice on file for an account (newest first), whether or not a payment matches.
 * amountPaid / paymentCount are the pay_hist rows in the invoice's billing period
 * (same account + period rule as the pay_hist_invoice view).
 * Returns [] if the files table hasn't been loaded yet.
 */
export async function getInvoicesForAccount(accountid: string): Promise<IAccountInvoice[]> {
	const db = PostgreSQL()
	const tables = await db.query(
		`select to_regclass('public.files') is not null as files, to_regclass('public.pay_hist') is not null as pay_hist`
	)
	if (!tables.rows[0]?.files) return []

	// YYYYMM computed inline so this works whether or not ensureSchema() added files.bill_period.
	const period = `(extract(year from f.billdt)::int * 100 + extract(month from f.billdt)::int)::text`
	const paid = tables.rows[0]?.pay_hist
		? `left join lateral (
			select sum(ph.amount) as amount_paid, count(*) as payment_count
			from public.pay_hist ph
			where ph.accountid = f.accountid and ph.period = ${period}
		) p on true`
		: `cross join (select null::numeric as amount_paid, 0 as payment_count) p`

	const res: { rows: AccountInvoiceRow[] } = await db.query(
		`select f.fileid, f.file, f.billdt, ${period} as period, p.amount_paid, p.payment_count
		 from public.files f
		 ${paid}
		 where f.accountid = $1
		 order by f.billdt desc, f.fileid desc`,
		[accountid]
	)

	const baseDir = env.INVOICE_PDF_DIR
	return Promise.all(
		res.rows.map(async (row) => {
			const fileName = row.file ? pdfFileName(row.file) : null
			return {
				fileid: row.fileid,
				file: fileName ?? row.file ?? '',
				billDate: row.billdt,
				period: row.period,
				amountPaid: Number(row.amount_paid ?? 0),
				paymentCount: Number(row.payment_count ?? 0),
				hasPdf: await pdfExists(baseDir, fileName)
			}
		})
	)
}

export async function getInvoicePdfPath(fileid: string): Promise<{ filePath: string; fileName: string } | null> {
	const baseDir = env.INVOICE_PDF_DIR
	if (!baseDir) {
		throw new Error('INVOICE_PDF_DIR is not set')
	}

	const res = await PostgreSQL().query(`select file from public.files where fileid = $1 limit 1`, [fileid])
	const stored: string | undefined = res.rows[0]?.file
	if (!stored) return null

	const fileName = pdfFileName(stored)
	if (!fileName || !(await pdfExists(baseDir, fileName))) return null
	return { filePath: path.join(baseDir, fileName), fileName }
}
