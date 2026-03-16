<script lang="ts">
    import type { ICustomer } from '$lib/server/customer';
    import type { PageData } from './$types';
    
    let {data}: {data: PageData} = $props();
    let customers: ICustomer[] = $state([]);

    $effect(() => {
        customers = data.customers ?? [];
    });

    let searchTermValue = $state('');
    let timer: NodeJS.Timeout;

    async function handleSearchTermInput(event: any) {
        clearTimeout(timer);

        searchTermValue = event.target.value;

        timer = setTimeout(async () => {
            if (searchTermValue.length > 2) {
                const response = await fetch(`/api/customer/search?q=${searchTermValue}`)
                try {
                    const json = await response.json()
                    customers = json.customers
                } catch(error:any) {
                    alert(error.toString())
                }
            }
        }, 500);
    }

</script>

<h1>Customers</h1>
<input type="text" value={searchTermValue} oninput={handleSearchTermInput} placeholder="Search..." />
<table>
    <thead><tr><th>Id</th><th>Name</th><th>Details</th></tr></thead>
    <tbody>
        {#each customers as customer}
            <tr>
                <td>{customer.customerid}</td>
                <td>{customer.display_name}</td>
                <td><a href="/customer/{customer.customerid}">details</a></td>
            </tr>
        {:else}
            <tr>
                <td colspan="3">No customers found.</td>
            </tr>
         {/each}
    </tbody>
</table>
