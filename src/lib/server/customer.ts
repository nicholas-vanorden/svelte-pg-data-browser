import PostgreSQL from "$lib/server/db_postgresql"
import type { ICustomer, ICustomerDetails } from "$lib/common/types"
import { Account } from "$lib/server/account"

export const Customer = () => {

    const api = {
        generateObject: (row: any): ICustomer => {
            const object: ICustomer = {
                customerid: row.customerid,
                display_name: row.display_name,
                city: row.city,
                state: row.state,
                zip: row.zip,
                accountsCount: row.accounts,
            }
            return object
        },
        generateDetailsObject: (rows: any[]): ICustomerDetails => {
            if (rows.length === 0) {
                throw new Error("Cannot generate details from empty rows")
            }
            const accountApi = Account()
            const object: ICustomerDetails = {
                customer: api.generateObject(rows[0]),
                delivery_address: rows[0].delivery_address,
                accountServices: rows.map(r => accountApi.generateObject(r))
            }
            return object
        },
        getAll: async (): Promise<Array<ICustomer>> => {
            const results: ICustomer[] = []
            const sql = `
select
      customerid
    , display_name
    , city
    , state
    , zip
    , count(*) as accounts
from public.customers group by (
      customerid
    , display_name
    , city
    , state
    , zip
)
order by display_name limit 500`
            let response: any
            try {
                response = await PostgreSQL().query(sql)
            } catch (err) {
                console.error(
                    {
                        errorMessage: err instanceof Error ? err.message : String(err),
                        errorStack: err instanceof Error ? err.stack : undefined
                    },
                    "Customer.getAll failed"
                )
                throw new Error("Customer.getAll failed", {
                    cause: err instanceof Error ? err : undefined
                })
            }
            for(const row of response.rows){
                const record = api.generateObject(row)
                results.push(record)
            }
            return results
        },
        search: async (term: string): Promise<Array<ICustomer>> => {
            const results: ICustomer[] = []
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
    , city
    , state
    , zip
    , count(*) as accounts
from public.customers 
where display_name ilike $1 escape '\\' or customerid ilike $1 escape '\\'
group by (
      customerid
    , display_name
    , city
    , state
    , zip
)
order by display_name limit 500`
            let response: any
            try {
                response = await PostgreSQL().query(sql, [`%${escapedTerm}%`])
            } catch (err) {
                console.error(
                    {
                        errorMessage: err instanceof Error ? err.message : String(err),
                        errorStack: err instanceof Error ? err.stack : undefined
                    },
                    "Customer.search failed"
                )
                throw new Error("Customer.search failed", {
                    cause: err instanceof Error ? err : undefined
                })
            }
            for(const row of response.rows){
                const record = api.generateObject(row)
                results.push(record)
            }
            return results
        },
        getSingle: async (id: string): Promise<ICustomerDetails | undefined> => {
            if (!id) {
                return undefined;
            }
            const sql = `
select 
    customerid
    , display_name
    , city
    , state
    , zip
    , delivery_address
    , account
    , service_number
    , service_type
    , internal_service_type
from public.customers
where customerid = $1 `
            let response: any
            try {
                response = await PostgreSQL().query(sql, [id])
            } catch (err) {
                console.error(
                    {
                        errorMessage: err instanceof Error ? err.message : String(err),
                        errorStack: err instanceof Error ? err.stack : undefined
                    },
                    "Customer.getSingle failed"
                )
                throw new Error("Customer.getSingle failed", {
                    cause: err instanceof Error ? err : undefined
                })
            }
            if (response.rows.length > 0) {
                return api.generateDetailsObject(response.rows)
            }
            return undefined
        },
    }
    return api
}
