<script lang="ts">
    import { page } from "$app/state";
    import type { IAccountInvoice, ICustomerDetails, IPayment } from "$lib/common/types";
    import { formatPhoneNumber, formatTimePeriod, pageSlice } from "$lib/common/functions";
    import TablePager from "$lib/components/TablePager.svelte";
    import { onMount } from "svelte";
    import { showError } from '$lib/stores/error';

    let customerDetails: ICustomerDetails | null = $state(null)
    let loading = $state(true)
    let selectedAccountId = $state<string | null>(null)
    let payments = $state<IPayment[]>([])
    let paymentsLoading = $state(false)
    let paymentError = $state<string | null>(null)
    let paymentRequest = 0
    let invoices = $state<IAccountInvoice[]>([])
    let invoicesLoading = $state(false)
    let invoiceError = $state<string | null>(null)
    let invoiceRequest = 0
    let paymentPage = $state(1)
    let paymentPageSize = $state(10)
    let invoicePage = $state(1)
    let invoicePageSize = $state(10)
    let pagedPayments = $derived(pageSlice(payments, paymentPage, paymentPageSize))
    let pagedInvoices = $derived(pageSlice(invoices, invoicePage, invoicePageSize))
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

    async function loadInvoices(accountid: string) {
        invoices = []
        invoicePage = 1
        invoiceError = null
        invoicesLoading = true
        const request = ++invoiceRequest

        try {
            const response = await fetch(`/api/account/${encodeURIComponent(accountid)}/invoices`)
            if (!response.ok) {
                throw new Error(`Failed to load invoices: ${response.status}`)
            }

            const json = await response.json()
            if (!Array.isArray(json.invoices)) {
                throw new Error('Invoice response missing invoices')
            }

            if (request === invoiceRequest) {
                invoices = json.invoices
            }
        } catch (error: unknown) {
            if (request === invoiceRequest) {
                invoiceError = error instanceof Error ? error.message : String(error)
                showError(invoiceError)
            }
        } finally {
            if (request === invoiceRequest) {
                invoicesLoading = false
            }
        }
    }

    async function selectAccount(accountid: string) {
        selectedAccountId = accountid
        // Invoices load alongside payments; each table has its own loading/error state.
        void loadInvoices(accountid)
        payments = []
        paymentPage = 1
        paymentError = null
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
                paymentError = error instanceof Error ? error.message : String(error)
                showError(paymentError)
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
            <table class="table-compact">
                <thead>
                    <tr>
                        <th>Period</th>
                        <th class="text-right">Amount</th>
                        <th>Posting Date</th>
                        <th>Description</th>
                        <th>Journal</th>
                        <th>User</th>
                        <th>Invoice</th>
                    </tr>
                </thead>
                <tbody>
                    {#if !selectedAccountId}
                        <tr>
                            <td colspan="7" class="py-10 text-center text-sm text-slate-500">Select an account to view its payments.</td>
                        </tr>
                    {:else if paymentsLoading}
                        <tr>
                            <td colspan="7" class="py-10 text-center text-sm text-slate-500">Loading payments...</td>
                        </tr>
                    {:else if paymentError}
                        <tr>
                            <td colspan="7" class="py-10 text-center text-sm text-rose-600">
                                <p>{paymentError}</p>
                                <button
                                    type="button"
                                    class="mt-2 font-medium text-brand-700 hover:text-brand-800"
                                    onclick={() => selectedAccountId && selectAccount(selectedAccountId)}
                                >
                                    Retry loading payments
                                </button>
                            </td>
                        </tr>
                    {:else if payments.length === 0}
                        <tr>
                            <td colspan="7" class="py-10 text-center text-sm text-slate-500">No payments found for this account.</td>
                        </tr>
                    {:else}
                        {#each pagedPayments as payment, index (`${payment.date}::${payment.journal}::${payment.description}::${index}`)}
                            <tr>
                                <td>{formatTimePeriod(payment.period)}</td>
                                <td class="text-right">{payment.amount.toFixed(2)}</td>
                                <td>{new Date(payment.date).toLocaleDateString()}</td>
                                <td>{payment.description}</td>
                                <td>{payment.journal}</td>
                                <td>{payment.user}</td>
                                <td>
                                    {#if payment.invoice}
                                        <a
                                            href={`/api/invoice/${encodeURIComponent(payment.invoice.fileid)}`}
                                            target="_blank"
                                            rel="noopener"
                                            class="font-medium text-brand-700 hover:text-brand-800"
                                            title={payment.invoice.file}
                                        >
                                            View PDF
                                        </a>
                                    {:else}
                                        <span class="text-slate-400">—</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
            <TablePager
                total={paymentsLoading || paymentError ? 0 : payments.length}
                bind:page={paymentPage}
                bind:pageSize={paymentPageSize}
                label="payments"
            />
        </div>

        <div class="space-y-3">
            <div class="flex items-baseline justify-between">
                <h3 class="text-xl font-semibold text-slate-900">Invoices</h3>
                {#if selectedAccountId && !invoicesLoading && !invoiceError}
                    <span class="text-sm text-slate-500">{invoices.length} on file</span>
                {/if}
            </div>
            <table class="table-compact">
                <thead>
                    <tr>
                        <th>Bill Date</th>
                        <th>Period</th>
                        <th class="text-right">Paid in Period</th>
                        <th>Invoice</th>
                    </tr>
                </thead>
                <tbody>
                    {#if !selectedAccountId}
                        <tr>
                            <td colspan="4" class="py-10 text-center text-sm text-slate-500">Select an account to view its invoices.</td>
                        </tr>
                    {:else if invoicesLoading}
                        <tr>
                            <td colspan="4" class="py-10 text-center text-sm text-slate-500">Loading invoices...</td>
                        </tr>
                    {:else if invoiceError}
                        <tr>
                            <td colspan="4" class="py-10 text-center text-sm text-rose-600">
                                <p>{invoiceError}</p>
                                <button
                                    type="button"
                                    class="mt-2 font-medium text-brand-700 hover:text-brand-800"
                                    onclick={() => selectedAccountId && loadInvoices(selectedAccountId)}
                                >
                                    Retry loading invoices
                                </button>
                            </td>
                        </tr>
                    {:else if invoices.length === 0}
                        <tr>
                            <td colspan="4" class="py-10 text-center text-sm text-slate-500">No invoices on file for this account.</td>
                        </tr>
                    {:else}
                        {#each pagedInvoices as invoice (invoice.fileid)}
                            <tr>
                                <td>{new Date(invoice.billDate).toLocaleDateString()}</td>
                                <td>{formatTimePeriod(invoice.period)}</td>
                                <td class="text-right">
                                    {#if invoice.paymentCount > 0}
                                        {invoice.amountPaid.toFixed(2)}
                                    {:else}
                                        <span class="text-slate-400">—</span>
                                    {/if}
                                </td>
                                <td>
                                    {#if invoice.hasPdf}
                                        <a
                                            href={`/api/invoice/${encodeURIComponent(invoice.fileid)}`}
                                            target="_blank"
                                            rel="noopener"
                                            class="font-medium text-brand-700 hover:text-brand-800"
                                            title={invoice.file}
                                        >
                                            View PDF
                                        </a>
                                    {:else}
                                        <span class="text-slate-400" title={invoice.file}>PDF not found</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
            <TablePager
                total={invoicesLoading || invoiceError ? 0 : invoices.length}
                bind:page={invoicePage}
                bind:pageSize={invoicePageSize}
                label="invoices"
            />
        </div>
    </section>
{:else}
    <p class="text-sm text-slate-500">Customer not found</p>
{/if}
