<script lang="ts">
	let { open, message, onClose } = $props<{
		open: boolean;
		message: string;
		onClose: () => void;
	}>();
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10"
		role="alertdialog"
		aria-live="assertive"
		aria-modal="true"
		aria-labelledby="error-dialog-title"
		aria-describedby="error-dialog-message"
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		tabindex="0"
	>
		<div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
			<h3 id="error-dialog-title" class="text-lg font-semibold text-slate-900">Something went wrong</h3>
			<p id="error-dialog-message" class="mt-2 text-sm text-slate-600">{message}</p>
			<div class="mt-6 flex justify-end">
				<button
					type="button"
					class="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
					onclick={onClose}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
