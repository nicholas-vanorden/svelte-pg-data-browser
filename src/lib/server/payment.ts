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
        invoice_fileid: string | null
        invoice_file: string | null
        invoice_bill_date: Date | null
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
                invoice: row.invoice_fileid
                    ? {
                        fileid: row.invoice_fileid,
                        file: row.invoice_file ?? '',
                        billDate: row.invoice_bill_date as Date,
                    }
                    : null,
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
    , invoice_fileid
    , invoice_file
    , invoice_bill_date
from public.pay_hist_invoice p
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
