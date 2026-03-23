<script lang="ts">
    import type { IAccount } from '$lib/common/types';
    import type { PageData } from './$types';
    import { onDestroy } from 'svelte';
    import { showError } from '$lib/stores/error';
    
    let {data}: {data: PageData} = $props();
    let accounts: IAccount[] = $state([]);
    let groupedAccounts = $state([] as Array<{
        key: string;
        accountid: string;
        customerid: string;
        display_name: string;
        services: IAccount[];
    }>);

    $effect(() => {
        accounts = data.accounts ?? [];
    });

    $effect(() => {
        groupedAccounts = groupAccounts(accounts);
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

    function groupAccounts(list: IAccount[]) {
        const groups = new Map<string, {
            key: string;
            accountid: string;
            customerid: string;
            display_name: string;
            services: IAccount[];
        }>();

        for (const account of list) {
            const key = `${account.accountid}::${account.customerid}::${account.display_name}`;
            const existing = groups.get(key);
            if (existing) {
                existing.services.push(account);
                continue;
            }
            groups.set(key, {
                key,
                accountid: account.accountid,
                customerid: account.customerid,
                display_name: account.display_name,
                services: [account]
            });
        }

        return Array.from(groups.values());
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
            <th scope="col">Account Id</th>
            <th scope="col">Customer</th>
            <th scope="col">Service Number</th>
            <th scope="col">Service Type</th>
            <th scope="col">Internal Service Type</th>
        </tr>
    </thead>
    <tbody>
        {#if groupedAccounts.length > 0}
            {#each groupedAccounts as group (group.key)}
                <tr class="!bg-white hover:!bg-white">
                    <td>{group.accountid}</td>
                    <td colspan="4">
                        <a class="font-medium text-brand-700 hover:text-brand-800" href="/customer/{group.customerid}">
                            {group.display_name}
                        </a>
                    </td>
                </tr>
                {#each group.services as service, index (`${group.key}::${service.service_number}::${service.internal_service_type}::${index}`)}
                    <tr class="!bg-slate-50 even:!bg-slate-100">
                        <td class="py-1"></td>
                        <td class="py-1"></td>
                        <td class="py-1">{service.service_number}</td>
                        <td class="py-1">{service.service_type}</td>
                        <td class="py-1">{service.internal_service_type}</td>
                    </tr>
                {/each}
            {/each}
        {:else}
            <tr>
                <td colspan="5" class="py-10 text-center text-sm text-slate-500">No accounts found.</td>
            </tr>
        {/if}
    </tbody>
    </table>
</section>
