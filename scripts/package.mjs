// Builds a self-contained deployment package in dist/:
//   dist/svelte-pg-data-browser-<version>-<yyyymmdd-hhmm>/   (folder)
//   dist/svelte-pg-data-browser-<version>-<yyyymmdd-hhmm>.zip
// Contents: build/, production node_modules, package.json, package-lock.json,
// .env.example, DEPLOY.md and, when packaged on Windows, node\node.exe + start.cmd
// (a copy of the Node that runs this script), so the server needs nothing installed.
// Run via `npm run package` (which runs `npm run build` first).
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))

if (!existsSync(path.join(root, 'build', 'index.js'))) {
	console.error('build/index.js not found. Run `npm run build` first (or use `npm run package`).')
	process.exit(1)
}

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
const name = `${pkg.name}-${pkg.version}-${stamp}`
const distDir = path.join(root, 'dist')
const outDir = path.join(distDir, name)
const zipPath = path.join(distDir, `${name}.zip`)

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

console.log(`Packaging ${name}`)
cpSync(path.join(root, 'build'), path.join(outDir, 'build'), { recursive: true })
for (const file of ['package.json', 'package-lock.json', '.env.example', 'DEPLOY.md']) {
	cpSync(path.join(root, file), path.join(outDir, file))
}

// Production dependencies only (pg). --ignore-scripts skips "prepare" (svelte-kit sync),
// which needs dev dependencies.
console.log('Installing production dependencies...')
execSync('npm ci --omit=dev --ignore-scripts --no-audit --no-fund', { cwd: outDir, stdio: 'inherit' })

// Bundle the Node runtime (Windows only: the prod server is Windows without Node installed).
if (process.platform === 'win32') {
	const [major, minor] = process.versions.node.split('.').map(Number)
	if (major < 20 || (major === 20 && minor < 6)) {
		console.error(`Node ${process.versions.node} is too old to bundle; need 20.6+ for --env-file.`)
		process.exit(1)
	}
	console.log(`Bundling Node ${process.version} from ${process.execPath}`)
	mkdirSync(path.join(outDir, 'node'))
	cpSync(process.execPath, path.join(outDir, 'node', 'node.exe'))
	writeFileSync(
		path.join(outDir, 'start.cmd'),
		[
			'@echo off',
			'rem Starts svelte-pg-data-browser with the bundled Node runtime.',
			'rem Settings are read from .env in this folder.',
			'cd /d "%~dp0"',
			'"%~dp0node\\node.exe" --env-file=.env build',
			''
		].join('\r\n')
	)
} else {
	console.warn('Not on Windows: skipping bundled node.exe and start.cmd (server must have Node 20.6+).')
}

console.log('Creating zip...')
rmSync(zipPath, { force: true })
if (process.platform === 'win32') {
	// Windows 10+ ships bsdtar; -a picks the format (zip) from the extension.
	execSync(`tar -a -c -f "${zipPath}" "${name}"`, { cwd: distDir, stdio: 'inherit' })
} else {
	execSync(`zip -qr "${zipPath}" "${name}"`, { cwd: distDir, stdio: 'inherit' })
}

console.log(`\nDone:\n  ${outDir}\n  ${zipPath}\nSee DEPLOY.md in the package for install steps.`)
