<script lang="ts">
    import type { ICustomer } from '$lib/common/types';
    import type { PageData } from './$types';
    import { onDestroy } from 'svelte';
    import { page } from '$app/state';
    import { showError } from '$lib/stores/error';
    
    let {data}: {data: PageData} = $props();
    let customers: ICustomer[] = $state([]);

    $effect(() => {
        customers = data.customers ?? [];
    });

    let searchTermValue = $state('');
    let timer: ReturnType<typeof setTimeout>;
    let lastSearchParam: string | null = $state(null);

    onDestroy(() => {
        clearTimeout(timer);
    });

    const runSearch = async (query: string) => {
        const response = await fetch(`/api/customer/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            customers = [];
            const message = `Search failed (${response.status})`;
            console.error(message);
            showError(message);
            return;
        }

        try {
            const json = await response.json();
            if (!json || !Array.isArray(json.customers)) {
                customers = [];
                const message = 'Search response missing customers.';
                console.error(message, json);
                showError(message);
                return;
            }
            customers = json.customers;
        } catch(error: unknown) {
            customers = [];
            showError(error instanceof Error ? error.message : String(error));
        }
    }

    $effect(() => {
        const param = page.url.searchParams.get('search');
        if (param === lastSearchParam) return;
        lastSearchParam = param;

        const trimmed = param?.trim() ?? '';
        if (trimmed.length > 2) {
            searchTermValue = trimmed;
            runSearch(trimmed);
        } else {
            searchTermValue = '';
            customers = data.customers ?? [];
        }
    });

    function handleSearchTermInput() {
        clearTimeout(timer);

        timer = setTimeout(async () => {
            if (searchTermValue.length > 2) {
                runSearch(searchTermValue);
            } else {
                customers = data.customers ?? [];
            }
        }, 500);
    }

</script>

<section class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 class="text-3xl font-semibold text-slate-900">Customers</h1>
            <p class="text-sm text-slate-500">Browse the full customer table or search for a specific record.</p>
        </div>
        <div class="w-full sm:max-w-sm">
            <label class="sr-only" for="customer-search">Search customers</label>
            <input
                id="customer-search"
                type="text"
                bind:value={searchTermValue}
                oninput={handleSearchTermInput}
                placeholder="Search customers..."
                class="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
        </div>
    </div>

    <table>
    <thead>
        <tr>
            <th scope="col">Id</th>
            <th scope="col">Name</th>
            <th scope="col">City</th>
            <th scope="col">State</th>
            <th scope="col">Zip</th>
            <th scope="col">Actions</th>
        </tr>
    </thead>
    <tbody>
        {#each customers as customer}
            <tr>
                <td>{customer.customerid}</td>
                <td>{customer.display_name}</td>
                <td>{customer.city}</td>
                <td>{customer.state}</td>
                <td>{customer.zip}</td>
                <td>
                    <a
                        class="font-medium text-brand-700 hover:text-brand-800"
                        href="/customer/{customer.customerid}"
                        aria-label={`View details for ${customer.display_name}`}
                    >
                        Details
                    </a>
                </td>
            </tr>
        {:else}
            <tr>
                <td colspan="6" class="py-10 text-center text-sm text-slate-500">No customers found.</td>
            </tr>
         {/each}
    </tbody>
    </table>
</section>
