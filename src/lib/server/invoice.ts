import path from 'node:path'
import { access } from 'node:fs/promises'
import { env } from '$env/dynamic/private'
import PostgreSQL from '$lib/server/db_postgresql'

/**
 * Resolves an invoice (files.fileid) to the PDF on disk.
 * PDFs are read from INVOICE_PDF_DIR using the file name stored in files.file
 * (e.g. 000000003600-346353.pdf). Only names that come from the database are used,
 * and only the base name, so a request can't reach outside that folder.
 */
export async function getInvoicePdfPath(fileid: string): Promise<{ filePath: string; fileName: string } | null> {
	const baseDir = env.INVOICE_PDF_DIR
	if (!baseDir) {
		throw new Error('INVOICE_PDF_DIR is not set')
	}

	const res = await PostgreSQL().query(`select file from public.files where fileid = $1 limit 1`, [fileid])
	const stored: string | undefined = res.rows[0]?.file
	if (!stored) return null

	// The migrator may store Windows-style paths; keep only the file name.
	const fileName = path.basename(stored.replace(/\\/g, '/'))
	if (!fileName.toLowerCase().endsWith('.pdf')) return null

	const filePath = path.join(baseDir, fileName)
	try {
		await access(filePath)
	} catch {
		return null
	}
	return { filePath, fileName }
}
