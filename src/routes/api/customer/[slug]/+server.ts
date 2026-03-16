import { Customer } from '$lib/server/customer.js'
import { json } from '@sveltejs/kit'

export async function GET({params}) {
    const customer_id = params.slug

    let customer = await Customer().getSingle(customer_id)

    if(!customer){
        customer = {
            customerid: '',
            display_name: ''
        }
    }

    return json({customer})
}