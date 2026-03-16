<script lang="ts">
    import { page } from "$app/state";
    import type { ICustomer } from "$lib/server/customer";
    import { onMount } from "svelte";

    let customer: ICustomer = $state({
        customerid: '',
        display_name: '',
    })

    onMount(async () => {
        const response = await fetch('/api/customer/'+page.params.slug)
        try {
            const json = await response.json()
            customer = json.customer
        } catch(error:any) {
            alert(error.toString())
        }
    })

</script>
<h2>{customer.customerid}</h2>
<h3>{customer.display_name}</h3>