import type { RequestHandler } from './$types'
import { error } from '@sveltejs/kit'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { getInvoicePdfPath } from '$lib/server/invoice'

// Streams an invoice PDF so the browser can show it inline.
export const GET: RequestHandler = async ({ params }) => {
	if (!params.fileid) {
		throw error(400, 'Invoice ID is required')
	}

	let found
	try {
		found = await getInvoicePdfPath(params.fileid)
	} catch (err) {
		console.error(
			{ errorMessage: err instanceof Error ? err.message : String(err) },
			'Invoice lookup failed'
		)
		throw error(500, 'Unable to load invoice')
	}
	if (!found) {
		throw error(404, 'Invoice PDF not found')
	}

	const { size } = await stat(found.filePath)
	const body = Readable.toWeb(createReadStream(found.filePath)) as ReadableStream

	return new Response(body, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Length': String(size),
			'Content-Disposition': `inline; filename="${found.fileName}"`
		}
	})
}
