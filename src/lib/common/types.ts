interface ICustomer {
    customerid: string,
    display_name: string,
    city: string,
    state: string,
    zip: string
}
interface ICustomerDetails {
    customer: ICustomer,
    delivery_address: string,
    accountServices: IAccount[]
}
interface IAccount {
    customerid: string,
    display_name: string,
    accountid: string,
    service_number: string,
    service_type: string,
    internal_service_type: string
}
interface IPayment {
    amount: number,
    description: string,
    journal: string,
    period: string,
    user: string,
    date: Date,
    invoice: IInvoice | null
}
interface IInvoice {
    fileid: string,
    file: string,
    billDate: Date
}
interface ValidationError {
    error: string
}

export type {ICustomer, ICustomerDetails, IAccount, IPayment, IInvoice, ValidationError}