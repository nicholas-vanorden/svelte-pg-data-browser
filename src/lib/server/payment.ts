import PostgreSQL from "$lib/server/db_postgresql"
import type { IPayment } from "$lib/common/types"

export const Payment = () => {

    type PaymentRow = {
        amount: number | string
        description: string
        journal: string
        period: string
        user: string
        date: Date
    }

    const api = {
        generateObject: (row: PaymentRow): IPayment => {
            const object: IPayment = {
                amount: Number(row.amount),
                description: row.description,
                journal: row.journal,
                period: row.period,
                user: row.user,
                date: row.date,
            }
            return object
        },
        getAll: async (accountid: string): Promise<Array<IPayment>> => {
            const results: IPayment[] = []
            const sql = `
select
      amount
    , bill_desc as description
    , journal
    , period
    , p."user" as user
    , post_date as date
from public.pay_hist p
where accountid = $1
order by post_date desc`
            let response: { rows: PaymentRow[] }
            try {
                response = await PostgreSQL().query(sql, [accountid])
            } catch (err) {
                console.error(
                    {
                        errorMessage: err instanceof Error ? err.message : String(err),
                        errorStack: err instanceof Error ? err.stack : undefined
                    },
                    "Payment.getAll failed"
                )
                throw new Error("Payment.getAll failed", {
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
