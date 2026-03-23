<script lang="ts">
    import { page } from "$app/state";
    import type { ICustomerDetails } from "$lib/common/types";
    import { onMount } from "svelte";
    import { showError } from '$lib/stores/error';

    let customerDetails: ICustomerDetails | null = $state(null)
    let loading = $state(true)
    let groupedServices = $state([] as Array<{
        key: string;
        accountid: string;
        services: ICustomerDetails['accountServices'];
    }>)

    onMount(async () => {
        const response = await fetch(`/api/customer/${encodeURIComponent(page.params.slug as string)}`)
        if (!response.ok) {
            showError(`Failed to load customer: ${response.status}`)
            loading = false
            return
        }
        try {
            const json = await response.json()
            if (json.customerDetails) {
                customerDetails = json.customerDetails
            } else {
                showError('Customer not found')
            }
            loading = false
        } catch(error:unknown) {
            showError(error instanceof Error ? error.message : String(error))
            loading = false
        }
    })

    $effect(() => {
        groupedServices = groupAccountServices(customerDetails?.accountServices ?? [])
    })

    function groupAccountServices(list: ICustomerDetails['accountServices']) {
        const groups = new Map<string, {
            key: string;
            accountid: string;
            services: ICustomerDetails['accountServices'];
        }>()

        for (const service of list) {
            const key = service.accountid
            const existing = groups.get(key)
            if (existing) {
                existing.services.push(service)
                continue
            }
            groups.set(key, { key, accountid: service.accountid, services: [service] })
        }

        return Array.from(groups.values())
    }

</script>
{#if loading}
    <p class="text-sm text-slate-500">Loading...</p>
{:else if customerDetails}
    <section class="space-y-8">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Customer</p>
                    <h2 class="mt-2 text-3xl font-semibold text-slate-900">{customerDetails.customer.display_name}</h2>
                    <p class="mt-1 text-sm text-slate-500">ID: {customerDetails.customer.customerid}</p>
                </div>
                <div class="text-sm text-slate-600">
                    <p class="font-semibold text-slate-700">Location</p>
                    <p>{customerDetails.customer.city}, {customerDetails.customer.state} {customerDetails.customer.zip}</p>
                    <p class="mt-3 font-semibold text-slate-700">Delivery Address</p>
                    <p>{customerDetails.delivery_address}</p>
                </div>
            </div>
        </div>

        <div class="space-y-3">
            <div class="flex items-baseline justify-between">
                <h3 class="text-xl font-semibold text-slate-900">Account Services</h3>
                <span class="text-sm text-slate-500">
                    {customerDetails.accountServices.length} services
                </span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Account Id</th>
                        <th>Service Number</th>
                        <th>Service Type</th>
                        <th>Internal Service Type</th>
                    </tr>
                </thead>
                <tbody>
                    {#if groupedServices.length > 0}
                        {#each groupedServices as group (group.key)}
                            <tr class="!bg-white hover:!bg-white">
                                <td>{group.accountid}</td>
                                <td colspan="3"></td>
                            </tr>
                            {#each group.services as service, index (`${group.key}::${service.service_number}::${service.internal_service_type}::${index}`)}
                                <tr class="!bg-slate-50 even:!bg-slate-100">
                                    <td class="py-1"></td>
                                    <td class="py-1">{service.service_number}</td>
                                    <td class="py-1">{service.service_type}</td>
                                    <td class="py-1">{service.internal_service_type}</td>
                                </tr>
                            {/each}
                        {/each}
                    {:else}
                        <tr>
                            <td colspan="4" class="py-10 text-center text-sm text-slate-500">
                                No account services found.
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    </section>
{:else}
    <p class="text-sm text-slate-500">Customer not found</p>
{/if}
