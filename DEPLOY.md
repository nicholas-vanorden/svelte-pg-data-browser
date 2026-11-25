# Deploying svelte-pg-data-browser (Windows)

This package is a standalone Node server (SvelteKit `adapter-node`). It includes everything it
needs to run: the compiled app, its production dependencies and a copy of the Node.js runtime
(`node\node.exe`). Nothing has to be installed on the server and no internet access is needed.

## Contents

| Path | Purpose |
|---|---|
| `start.cmd` | Starts the app with the bundled Node, reading settings from `.env` |
| `node\node.exe` | Node.js runtime (the version the package was built with) |
| `build\` | The compiled app (server + client assets) |
| `node_modules\` | Production dependencies (`pg`) |
| `package.json`, `package-lock.json` | Package metadata |
| `.env.example` | Template for the runtime configuration |

## Install

1. Copy the zip to the server and extract it, e.g. to `C:\apps\svelte-pg-data-browser`.
2. Copy `.env.example` to `.env` in the same folder and fill it in:

   | Variable | Required | Notes |
   |---|---|---|
   | `SECRET_PGUSER`, `SECRET_PGPASSWORD`, `SECRET_PGHOST`, `SECRET_PGPORT`, `SECRET_PGDATABASE` | yes | PostgreSQL connection |
   | `INVOICE_PDF_DIR` | yes, for PDFs | Folder on the server that holds the invoice PDFs, e.g. `D:/invoices` |
   | `PORT` | no | Default `3000` |
   | `HOST` | no | Default `0.0.0.0` (all interfaces) |
   | `ORIGIN` | recommended | The URL users browse to, e.g. `http://prod-server:3000` |

   Keep `.env` private: it contains the database password.

3. Test it by double-clicking `start.cmd` (or running it from a command prompt). The console
   should show `ensureSchema: invoice column, index and view are in place`. If it says the
   tables don't exist yet, load them with go-csv2pg-migrator and restart the app.
4. Browse to `http://<server>:<PORT>`. If other machines can't reach it, allow the port in
   Windows Defender Firewall:

   ```
   netsh advfirewall firewall add rule name="svelte-pg-data-browser" dir=in action=allow protocol=TCP localport=3000
   ```

5. Close the console window (this stops the app) and set it up to run on its own (below).

## Run at startup

Windows' built-in Task Scheduler can start the app when the server boots, before anyone logs in.
From an **administrator** command prompt:

```
schtasks /create /tn "svelte-pg-data-browser" /tr "C:\apps\svelte-pg-data-browser\start.cmd" /sc onstart /ru SYSTEM /rl HIGHEST /f
schtasks /run /tn "svelte-pg-data-browser"
```

- Stop it: `schtasks /end /tn "svelte-pg-data-browser"`
- Start it: `schtasks /run /tn "svelte-pg-data-browser"`
- Remove it: `schtasks /delete /tn "svelte-pg-data-browser" /f`

In Task Scheduler (`taskschd.msc`), open the task's **Settings** tab and untick
"Stop the task if it runs longer than 3 days". Otherwise Windows stops the app after 3 days.

The task runs as `SYSTEM`. If `INVOICE_PDF_DIR` is on a network share, use a service account
that can read the share instead: replace `/ru SYSTEM` with `/ru DOMAIN\account /rp`.

## Upgrading

1. Stop the app: `schtasks /end /tn "svelte-pg-data-browser"`.
2. Rename the current folder, e.g. to `C:\apps\svelte-pg-data-browser.old`.
3. Extract the new package to `C:\apps\svelte-pg-data-browser` and copy `.env` over from the old folder.
4. Start it: `schtasks /run /tn "svelte-pg-data-browser"`.

Keep the old folder until the new version checks out. To roll back, swap the folders back.
