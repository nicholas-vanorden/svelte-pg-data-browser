import type { RequestHandler } from './$types';
import { Customer } from '$lib/server/customer.js'
import { json, error } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ params }) => {
    const customer_id = params.slug

    let customerDetails = await Customer().getSingle(customer_id)

    if (!customerDetails) {
        throw error(404, 'Customer not found')
     }

    return json({customerDetails})
}