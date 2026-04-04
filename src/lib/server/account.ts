import PostgreSQL from "$lib/server/db_postgresql"
import type { IAccount } from "$lib/common/types"

export const Account = () => {

    type AccountRow = {
        customerid: string
        display_name: string
        accountid: string
        service_number: string
        service_type: string
        internal_service_type: string
    }

    const api = {
        generateObject: (row: AccountRow): IAccount => {
            const object: IAccount = {
                customerid: row.customerid,
                display_name: row.display_name,
                accountid: row.accountid,
                service_number: row.service_number,
                service_type: row.service_type,
                internal_service_type: row.internal_service_type,
            }
            return object
        },
        getAll: async (): Promise<Array<IAccount>> => {
            const results: IAccount[] = []
            const sql = `
select
      customerid
    , display_name
    , accountid
    , service_number
    , service_type
    , internal_service_type
from public.customers
where accountid is not null and accountid <> ''
order by accountid limit 500`
            let response: { rows: AccountRow[] }
            try {
                response = await PostgreSQL().query(sql)
            } catch (err) {
                console.error(
                    {
                        errorMessage: err instanceof Error ? err.message : String(err),
                        errorStack: err instanceof Error ? err.stack : undefined
                    },
                    "Account.getAll failed"
                )
                throw new Error("Account.getAll failed", {
                    cause: err instanceof Error ? err : undefined
                })
            }
            for(const row of response.rows){
                const record = api.generateObject(row)
                results.push(record)
            }
            return results
        },
        search: async (term: string): Promise<Array<IAccount>> => {
            const results: IAccount[] = []
            const normalizedTerm = term.trim()
            if (!normalizedTerm) {
                return results;
            }
            // Escape LIKE special characters
            const escapedTerm = normalizedTerm.replace(/[%_\\]/g, '\\$&')
            const sql = `
select
      customerid
    , display_name
    , accountid
    , service_number
    , service_type
    , internal_service_type
from public.customers 
where accountid is not null and accountid <> ''
and (accountid ilike $1 escape '\\' or display_name ilike $1 escape '\\')
order by accountid limit 500`
            let response: { rows: AccountRow[] }
            try {
                response = await PostgreSQL().query(sql, [`%${escapedTerm}%`])
            } catch (err) {
                console.error(
                    {
                        errorMessage: err instanceof Error ? err.message : String(err),
                        errorStack: err instanceof Error ? err.stack : undefined
                    },
                    "Account.search failed"
                )
                throw new Error("Account.search failed", {
                    cause: err instanceof Error ? err : undefined
                })
            }
            for(const row of response.rows){
                const record = api.generateObject(row)
                results.push(record)
            }
            return results
        },
    }
    return api
}
