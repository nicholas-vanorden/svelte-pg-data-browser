<script lang="ts">
    import type { ICustomer } from '$lib/common/types';
    import type { PageData } from './$types';
    import { onDestroy } from 'svelte';
    
    let {data}: {data: PageData} = $props();
    let customers: ICustomer[] = $state([]);

    $effect(() => {
        customers = data.customers ?? [];
    });

    let searchTermValue = $state('');
    let timer: ReturnType<typeof setTimeout>;

    onDestroy(() => {
        clearTimeout(timer);
    });

    async function handleSearchTermInput(event: any) {
        clearTimeout(timer);

        searchTermValue = event.target.value;

        timer = setTimeout(async () => {
            if (searchTermValue.length > 2) {
                const response = await fetch(`/api/customer/search?q=${encodeURIComponent(searchTermValue)}`);
                if (!response.ok) {
                    customers = [];
                    const message = `Search failed (${response.status})`;
                    console.error(message);
                    alert(message);
                    return;
                }

                try {
                    const json = await response.json();
                    if (!json || !Array.isArray(json.customers)) {
                        customers = [];
                        const message = 'Search response missing customers.';
                        console.error(message, json);
                        alert(message);
                        return;
                    }
                    customers = json.customers;
                } catch(error:any) {
                    customers = [];
                    alert(error.toString());
                }
            } else {
                customers = data.customers ?? [];
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
