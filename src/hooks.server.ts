import type { ServerInit } from '@sveltejs/kit'
import { ensureSchema } from '$lib/server/schema'

// Runs once when the server starts, before the first request is handled.
export const init: ServerInit = async () => {
	try {
		await ensureSchema()
	} catch (err) {
		// Log and keep the app up; pages that don't need invoices still work.
		console.error(
			{
				errorMessage: err instanceof Error ? err.message : String(err),
				errorStack: err instanceof Error ? err.stack : undefined
			},
			'ensureSchema failed'
		)
	}
}
