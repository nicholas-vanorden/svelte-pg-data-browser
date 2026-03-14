import PostgreSQL from "$lib/common/db_postgresql"

interface ICustomer {
    customerid: number,
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
            const sql = `select * from data.customers order by display_name`
            const response = await PostgreSQL().query(sql)
            for(const row of response.rows){
                const record = api.generateObject(row)
                results.push(record)
            }
            return results
        },
        getSingle: async (id: number): Promise<ICustomer | void> => {
            const sql = `select * from data.customers where customerid = $1 `
            const response = await PostgreSQL().query(sql, [id])
            for(const row of response.rows){
                const record = api.generateObject(row)
                return record
            }
        },
    }
    return api
}