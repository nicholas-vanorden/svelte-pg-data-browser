import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Account } from "$lib/server/account"

export const GET: RequestHandler = async ({ url }) => {
    try {
        const query = url.searchParams.get('q') || '';
        const accounts = await Account().search(query)
        return json({ accounts })
    } catch (err) {
        console.error('Account search failed:', err);
        return json({ error: 'Search failed' }, { status: 500 });
    }
}
