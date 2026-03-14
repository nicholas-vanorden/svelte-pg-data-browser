import { Customer } from "$lib/server/customer"
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    try {
        const customers = await Customer().getAll()
        return { customers }
    } catch {
        return { customers: [] }
    }
}