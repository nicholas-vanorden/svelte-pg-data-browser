import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Customer } from "$lib/server/customer"

export const GET: RequestHandler = async ({ url }) => {
    try {
        const query = url.searchParams.get('q') || '';
        const customers = await Customer().search(query)
        return json({ customers })
    } catch (err) {
        console.error('Customer search failed:', err);
        return json({ error: 'Search failed' }, { status: 500 });
    }
}
