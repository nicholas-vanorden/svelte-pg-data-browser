<script lang="ts">
    import { page } from "$app/state";
    import type { ICustomerDetails, IPayment } from "$lib/common/types";
    import { formatPhoneNumber, formatTimePeriod } from "$lib/common/functions";
    import { onMount } from "svelte";
    import { showError } from '$lib/stores/error';

    let customerDetails: ICustomerDetails | null = $state(null)
    let loading = $state(true)
    let selectedAccountId = $state<string | null>(null)
    let payments = $state<IPayment[]>([])
    let paymentsLoading = $state(false)
    let paymentRequest = 0
    let groupedServices = $derived.by(() => {
        return groupAccountServices(customerDetails?.accountServices ?? [])
    })

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

    async function selectAccount(accountid: string) {
        selectedAccountId = accountid
        payments = []
        paymentsLoading = true
        const request = ++paymentRequest

        try {
            const response = await fetch(`/api/payment/${encodeURIComponent(accountid)}`)
            if (!response.ok) {
                throw new Error(`Failed to load payments: ${response.status}`)
            }

            const json = await response.json()
            if (!Array.isArray(json.payments)) {
                throw new Error('Payment response missing payments')
            }

            if (request === paymentRequest) {
                payments = json.payments
            }
        } catch (error: unknown) {
            if (request === paymentRequest) {
                showError(error instanceof Error ? error.message : String(error))
            }
        } finally {
            if (request === paymentRequest) {
                paymentsLoading = false
            }
        }
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
                <h3 class="text-xl font-semibold text-slate-900">Accounts</h3>
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
                    </tr>
                </thead>
                <tbody>
                    {#if groupedServices.length > 0}
                        {#each groupedServices as group (group.key)}
                            <tr class="!bg-white hover:!bg-slate-100">
                                <td>
                                    <button
                                        type="button"
                                        class={selectedAccountId === group.accountid
                                            ? 'text-base font-bold text-brand-700 hover:text-brand-800'
                                            : 'font-medium text-brand-700 hover:text-brand-800'}
                                        aria-pressed={selectedAccountId === group.accountid}
                                        onclick={() => selectAccount(group.accountid)}
                                    >
                                        {group.accountid}
                                    </button>
                                </td>
                                <td colspan="2"></td>
                            </tr>
                            {#each group.services as service, index (`${group.key}::${service.service_number}::${service.internal_service_type}::${index}`)}
                                <tr class="!bg-slate-50 even:!bg-slate-100">
                                    <td class="py-1"></td>
                                    <td class="py-1">{formatPhoneNumber(service.service_number)}</td>
                                    <td class="py-1">{service.internal_service_type}</td>
                                </tr>
                            {/each}
                        {/each}
                    {:else}
                        <tr>
                            <td colspan="4" class="py-10 text-center text-sm text-slate-500">
                                No accounts found.
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>

        <div class="space-y-3">
            <div class="flex items-baseline justify-between">
                <h3 class="text-xl font-semibold text-slate-900">Billing</h3>
                {#if selectedAccountId}
                    <span class="text-sm text-slate-500">Account: {selectedAccountId}</span>
                {/if}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Period</th>
                        <th class="text-right">Amount</th>
                        <th>Posting Date</th>
                        <th>Description</th>
                        <th>Journal</th>
                        <th>User</th>
                    </tr>
                </thead>
                <tbody>
                    {#if !selectedAccountId}
                        <tr>
                            <td colspan="6" class="py-10 text-center text-sm text-slate-500">Select an account to view its payments.</td>
                        </tr>
                    {:else if paymentsLoading}
                        <tr>
                            <td colspan="6" class="py-10 text-center text-sm text-slate-500">Loading payments...</td>
                        </tr>
                    {:else if payments.length === 0}
                        <tr>
                            <td colspan="6" class="py-10 text-center text-sm text-slate-500">No payments found for this account.</td>
                        </tr>
                    {:else}
                        {#each payments as payment, index (`${payment.date}::${payment.journal}::${payment.description}::${index}`)}
                            <tr>
                                <td>{formatTimePeriod(payment.period)}</td>
                                <td class="text-right">{payment.amount.toFixed(2)}</td>
                                <td>{new Date(payment.date).toLocaleDateString()}</td>
                                <td>{payment.description}</td>
                                <td>{payment.journal}</td>
                                <td>{payment.user}</td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    </section>
{:else}
    <p class="text-sm text-slate-500">Customer not found</p>
{/if}
