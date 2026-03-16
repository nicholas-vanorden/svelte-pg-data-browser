<script lang="ts">
    import { page } from "$app/state";
    import type { ICustomer } from "$lib/common/types";
    import { onMount } from "svelte";

    let customer: ICustomer = $state({
        customerid: '',
        display_name: '',
    })

    onMount(async () => {
        const response = await fetch(`/api/customer/${encodeURIComponent(page.params.slug as string)}`)
        if (!response.ok) {
            alert(`Failed to load customer: ${response.status}`)
            return
        }
        try {
            const json = await response.json()
            if (json.customer) {
                customer = json.customer
            } else {
                alert('Customer not found')
            }
        } catch(error:unknown) {
            alert(error instanceof Error ? error.message : String(error))
        }
    })

</script>
<h2>{customer.customerid}</h2>
<h3>{customer.display_name}</h3>