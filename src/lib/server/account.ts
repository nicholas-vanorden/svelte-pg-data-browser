import type { IAccount } from "$lib/common/types"

export const Account = () => {

    const api = {
        generateObject: (row: any): IAccount => {
            const object: IAccount = {
                customerid: row.customerid,
                accountid: row.account,
                service_number: row.service_number,
                service_type: row.service_type,
                internal_service_type: row.internal_service_type,
            }
            return object
        },
    }
    return api
}
