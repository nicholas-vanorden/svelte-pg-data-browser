import { Customer } from "$lib/server/customer";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    try {
        const customers = await Customer().getAll()
        return { customers }
    } catch (err) {
        console.error('Failed to load customers:', err);
        return { customers: [] }
    }
}