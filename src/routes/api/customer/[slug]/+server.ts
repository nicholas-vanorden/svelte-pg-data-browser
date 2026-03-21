import { Customer } from '$lib/server/customer.js'
import { json } from '@sveltejs/kit'

export async function GET({params}) {
    const customer_id = params.slug

    let customerDetails = await Customer().getSingle(customer_id)

    if(!customerDetails){
        customerDetails = {
            customer: {
                customerid: '',
                display_name: '',
                city: '',
                state: '',
                zip: '',
                accountsCount: 0
            },
            delivery_address: '',
            accountServices: []
        }
    }

    return json({customerDetails})
}