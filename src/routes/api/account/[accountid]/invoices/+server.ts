import type { RequestHandler } from './$types'
import { error, json } from '@sveltejs/kit'
import { getInvoicesForAccount } from '$lib/server/invoice'

// All invoices on file for an account, whether or not a payment matches.
export const GET: RequestHandler = async ({ params }) => {
	if (!params.accountid) {
		throw error(400, 'Account ID is required')
	}

	try {
		const invoices = await getInvoicesForAccount(params.accountid)
		return json({ invoices })
	} catch (err) {
		console.error(
			{
				errorMessage: err instanceof Error ? err.message : String(err),
				errorStack: err instanceof Error ? err.stack : undefined
			},
			'getInvoicesForAccount failed'
		)
		throw error(500, 'Unable to load invoices')
	}
}
