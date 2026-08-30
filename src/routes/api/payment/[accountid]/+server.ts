import type { RequestHandler } from './$types'
import { error, json } from '@sveltejs/kit'
import { Payment } from '$lib/server/payment'

export const GET: RequestHandler = async ({ params }) => {
	if (!params.accountid) {
		throw error(400, 'Account ID is required')
	}

	const payments = await Payment().getAll(params.accountid)

	return json({ payments })
}
