<script lang="ts">
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

		for (const segment of segments) {
			href += `/${segment}`;
			items.push({
				label: breadCrumbDisplay(decodeURIComponent(segment).replace(/-/g, ' ')),
				href
			});
		}

		crumbs = items;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="breadcrumbs" aria-label="Breadcrumb">
	{#each crumbs as crumb, i}
		{#if i < crumbs.length - 1}
			<a href={crumb.href}>{crumb.label}</a>
			<span class="sep" aria-hidden="true">/</span>
		{:else}
			<span aria-current="page">{crumb.label}</span>
		{/if}
	{/each}
</nav>

{@render children()}

<style>
	.breadcrumbs {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.95rem;
		margin-bottom: 1rem;
	}

	.breadcrumbs a {
		color: inherit;
		text-decoration: none;
	}

	.breadcrumbs a:hover {
		text-decoration: underline;
	}

	.sep {
		opacity: 0.5;
	}
</style>
