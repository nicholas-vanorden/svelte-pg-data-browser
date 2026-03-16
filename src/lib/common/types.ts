interface ICustomer {
    customerid: string,
    display_name: string,
}
interface ValidationError {
    error: string
}

export type {ICustomer, ValidationError}