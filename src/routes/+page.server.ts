import { Customer } from "$lib/server/customer"
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    const customers = await Customer().getAll()

    return { customers }
}