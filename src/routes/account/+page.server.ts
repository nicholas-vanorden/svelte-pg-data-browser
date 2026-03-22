import { Account } from "$lib/server/account";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    try {
        const accounts = await Account().getAll()
        return { accounts }
    } catch (err) {
        console.error('Failed to load accounts:', err);
        return { accounts: [] }
    }
}