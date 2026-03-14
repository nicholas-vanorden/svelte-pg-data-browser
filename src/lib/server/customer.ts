import PostgreSQL from "$lib/common/db_postgresql"

interface ICustomer {
    customerid: string,
    display_name: string,
}
interface ValidationError {
    error: string
}

export type {ICustomer, ValidationError}

export const Customer = () => {

    const api = {
        generateObject: (row: any): ICustomer => {
            const object: ICustomer = {
                customerid: row.customerid,
                display_name: row.display_name
            }
            return object
        },
        getAll: async (): Promise<Array<ICustomer>> => {
            const results: ICustomer[] = []
            const sql = `select customerid, display_name from data.customers order by display_name`
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
        getSingle: async (id: number): Promise<ICustomer | undefined> => {
            if (!Number.isInteger(id) || id <= 0) {
                return undefined;
            }
            const sql = `select customerid, display_name from data.customers where customerid = $1 `
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
                return api.generateObject(response.rows[0])
            }
            return undefined
        },
    }
    return api
}
