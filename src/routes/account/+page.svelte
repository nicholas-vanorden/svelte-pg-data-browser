<script lang="ts">
    import type { IAccount } from '$lib/common/types';
    import type { PageData } from './$types';
    import { onDestroy } from 'svelte';
    import { showError } from '$lib/stores/error';
    
    let {data}: {data: PageData} = $props();
    let accounts: IAccount[] = $state([]);

    $effect(() => {
        accounts = data.accounts ?? [];
    });

    let searchTermValue = $state('');
    let timer: ReturnType<typeof setTimeout>;

    onDestroy(() => {
        clearTimeout(timer);
    });

    const runSearch = async (query: string) => {
        const response = await fetch(`/api/account/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            accounts = [];
            const message = `Search failed (${response.status})`;
            console.error(message);
            showError(message);
            return;
        }

        try {
            const json = await response.json();
            if (!json || !Array.isArray(json.accounts)) {
                accounts = [];
                const message = 'Search response missing accounts.';
                console.error(message, json);
                showError(message);
                return;
            }
            accounts = json.accounts;
        } catch(error: unknown) {
            accounts = [];
            showError(error instanceof Error ? error.message : String(error));
        }
    }

    function handleSearchTermInput() {
        clearTimeout(timer);

        timer = setTimeout(async () => {
            if (searchTermValue.length > 2) {
                await runSearch(searchTermValue);
            } else {
                accounts = data.accounts ?? [];
            }
        }, 500);
    }

</script>

<section class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 class="text-3xl font-semibold text-slate-900">Accounts</h1>
            <p class="text-sm text-slate-500">Browse the full accounts table or search for a specific record.</p>
        </div>
        <div class="w-full sm:max-w-sm">
            <label class="sr-only" for="account-search">Search accounts</label>
            <input
                id="account-search"
                type="text"
                bind:value={searchTermValue}
                oninput={handleSearchTermInput}
                placeholder="Search accounts..."
                class="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
        </div>
    </div>

    <table>
    <thead>
        <tr>
            <th>Account Id</th>
            <th>Service Number</th>
            <th>Service Type</th>
            <th>Internal Service Type</th>
            <th>Customer</th>
        </tr>
    </thead>
    <tbody>
        {#each accounts as account}
            <tr>
                <td>{account.accountid}</td>
                <td>{account.service_number}</td>
                <td>{account.service_type}</td>
                <td>{account.internal_service_type}</td>
                <td><a class="font-medium text-brand-700 hover:text-brand-800" href="/customer/{account.customerid}">{account.customerid}</a></td>
            </tr>
        {:else}
            <tr>
                <td colspan="5" class="py-10 text-center text-sm text-slate-500">No accounts found.</td>
            </tr>
         {/each}
    </tbody>
    </table>
</section>
