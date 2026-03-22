<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let searchTerm = $state('');
	let searchInput: HTMLInputElement | null = $state(null);

	onMount(() => {
		searchInput?.focus();
	});

	const handleSubmit = (e: SubmitEvent) => {
		e.preventDefault();
		const query = searchTerm.trim();
		if (query.length === 0) {
			goto('/customer');
			return;
		}
		goto(`/customer?search=${encodeURIComponent(query)}`);
	};
</script>

<section class="relative flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center gap-6 overflow-hidden">
	<div class="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
		<div class="h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"></div>
		<div class="-ml-24 h-64 w-64 rounded-full bg-sky-100/70 blur-3xl"></div>
	</div>
	<div class="w-full max-w-2xl text-center">
		<h1 class="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
			Search Customers
		</h1>
		<p class="mt-3 text-sm text-slate-500">
			Search the customer table and jump straight to the results.
		</p>
	</div>

	<form class="w-full max-w-2xl" onsubmit={handleSubmit}>
		<div
			class="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-lg shadow-slate-200/60 transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200"
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="h-5 w-5 text-slate-400"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="11" cy="11" r="8" />
				<line x1="21" y1="21" x2="16.65" y2="16.65" />
			</svg>
			<input
				type="text"
				bind:value={searchTerm}
				bind:this={searchInput}
				placeholder="Search by name or id..."
                aria-label="SearchTerm"
				class="w-full border-0 bg-transparent text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none"
			/>
			<button
				type="submit"
				class="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
			>
				Search
			</button>
		</div>
	</form>

	<div class="mt-10 flex items-center gap-6 text-sm text-slate-500">
		<h5 class="font-medium">
			<a class="hover:text-brand-700" href="/customer">Customers</a>
		</h5>
		<h5 class="font-medium">
			<a class="hover:text-brand-700" href="/account">Accounts</a>
		</h5>
	</div>
</section>
