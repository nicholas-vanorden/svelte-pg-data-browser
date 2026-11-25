<script lang="ts">
	// Client-side pager for a table. pageSize 0 means "All".
	// page is 1-based; the parent slices its rows with pageSlice() from $lib/common/functions.
	let {
		total,
		page = $bindable(1),
		pageSize = $bindable(10),
		pageSizes = [10, 25, 50],
		label = 'rows'
	} = $props<{
		total: number;
		page?: number;
		pageSize?: number;
		pageSizes?: number[];
		label?: string;
	}>();

	let pageCount = $derived(pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1);
	let first = $derived(total === 0 ? 0 : pageSize > 0 ? (page - 1) * pageSize + 1 : 1);
	let last = $derived(pageSize > 0 ? Math.min(page * pageSize, total) : total);

	// Keep page in range when the data or page size changes.
	$effect(() => {
		if (page > pageCount) page = pageCount;
		if (page < 1) page = 1;
	});

	function changeSize(event: Event) {
		pageSize = Number((event.currentTarget as HTMLSelectElement).value);
		page = 1;
	}
</script>

{#if total > 0}
	<div class="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
		<span>Showing {first}–{last} of {total} {label}</span>
		<div class="flex items-center gap-3">
			<label class="flex items-center gap-2">
				<span>Show</span>
				<select
					class="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
					value={pageSize}
					onchange={changeSize}
				>
					{#each pageSizes as size (size)}
						<option value={size}>{size}</option>
					{/each}
					<option value={0}>All</option>
				</select>
			</label>
			{#if pageSize > 0 && pageCount > 1}
				<div class="flex items-center gap-1">
					<button
						type="button"
						class="rounded-md border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
						disabled={page <= 1}
						onclick={() => (page = 1)}
						aria-label="First page">«</button
					>
					<button
						type="button"
						class="rounded-md border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
						disabled={page <= 1}
						onclick={() => (page -= 1)}
						aria-label="Previous page">‹</button
					>
					<span class="px-2">Page {page} of {pageCount}</span>
					<button
						type="button"
						class="rounded-md border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
						disabled={page >= pageCount}
						onclick={() => (page += 1)}
						aria-label="Next page">›</button
					>
					<button
						type="button"
						class="rounded-md border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
						disabled={page >= pageCount}
						onclick={() => (page = pageCount)}
						aria-label="Last page">»</button
					>
				</div>
			{/if}
		</div>
	</div>
{/if}
