<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.png';
	import { page } from '$app/state';

	let { children } = $props();

	let crumbs = $state<{ label: string; href: string }[]>([]);

	$effect(() => {
		const segments = page.url.pathname.split('/').filter(Boolean);
		const items = [{ label: 'Home', href: '/' }];
		let href = '';

		const breadCrumbDisplay = (val: string): string => {
			switch (val) {
				case "customer": return "customers"
				case "account": return "accounts"
				default: return val
			}
		}
		const safeDecode = (value: string): string => {
			try {
				return decodeURIComponent(value);
			} catch {
				return value;
			}
		};

		for (const segment of segments) {
			href += `/${segment}`;
			items.push({
				label: breadCrumbDisplay(safeDecode(segment).replace(/-/g, ' ')),
				href
			});
		}

		crumbs = items;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<div class="mx-auto w-full max-w-6xl px-6 py-6">
		{#if page.url.pathname !== '/'}
			<nav class="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
				{#each crumbs as crumb, i}
					{#if i < crumbs.length - 1}
						<a class="font-medium text-slate-700 hover:text-slate-900" href={crumb.href}>
							{crumb.label}
						</a>
						<span class="text-slate-400" aria-hidden="true">/</span>
					{:else}
						<span aria-current="page" class="font-semibold text-slate-900">{crumb.label}</span>
					{/if}
				{/each}
			</nav>
		{/if}

		{@render children()}
	</div>
</div>
