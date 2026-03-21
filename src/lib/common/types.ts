interface ICustomer {
    customerid: string,
    display_name: string,
    city: string,
    state: string,
    zip: string,
    accountsCount: number
}
interface ValidationError {
    error: string
}

export type {ICustomer, ValidationError}