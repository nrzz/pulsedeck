# Architecture

PulseDeck is an npm workspaces monorepo: a React widget UI, a local Fastify metrics server, and an Electron shell that packages them for Windows.

## Monorepo layout

```
pulsedeck/
├── apps/
│   ├── web/        # Vite + React + Tailwind + react-grid-layout + Zustand
│   ├── server/     # Fastify + WebSocket + systeminformation + external APIs
│   └── desktop/    # Electron main/preload, tray, NSIS installer
├── packages/
│   └── shared/     # Types, default config/presets, WIDGET_CATALOG
├── docs/           # Install, architecture, widget SOP
├── scripts/        # E2E (Playwright), server bundle for Electron
└── .github/        # CI + release workflows
```

## Runtime modes

| Mode              | How                                                                                      | Config path                       |
| ----------------- | ---------------------------------------------------------------------------------------- | --------------------------------- |
| **Browser / dev** | `npm run dev` → Vite `:5173` proxies to API `:8787`                                      | `apps/server/data/config.json`    |
| **Desktop**       | Electron boots embedded server on a free `127.0.0.1` port, loads UI with `?shell=widget` | `%APPDATA%\PulseDeck\config.json` |

## Data flow

```mermaid
flowchart LR
  Collectors[metrics + external collectors] --> Fastify
  Fastify -->|WS /ws| Zustand[Zustand dashboard store]
  Fastify -->|REST /api/*| Zustand
  Zustand --> Widgets[Widget components]
  Widgets -->|PUT /api/config| Fastify
  Fastify --> Disk[config.json]
```

1. **Collectors** (`apps/server/src/collectors/`) poll CPU/RAM/GPU/disks/network and fetch crypto/stocks/weather/ping.
2. **WebSocket** pushes `metrics`, `ping`, `crypto`, `stocks`, `weather`, `config` messages.
3. **Zustand** (`apps/web/src/store/dashboard.ts`) holds live state + layout presets.
4. **Widgets** subscribe to slices; layout edits call `persistConfig` → `PUT /api/config`.

## Widget plugin model

- Catalog: `WIDGET_CATALOG` in shared (docs + Add-widget modal metadata).
- Runtime registry: `widgetRegistry` maps `type` → React component + default size/settings.
- Layout: `react-grid-layout` (12 cols). **Never animate `transform` on grid items** — RGL positions via transform.

See [CREATING_WIDGETS.md](CREATING_WIDGETS.md) and [WIDGETS.md](WIDGETS.md).

## Desktop shell

`apps/desktop/src/main.ts`:

- Frameless, transparent, `skipTaskbar`
- Preload bridge (`window.pulsedeck`) for lock / edit IPC
- Pin to desktop via Win32 `SetWindowPos(HWND_BOTTOM)` (`koffi`)
- Tray: show/hide, edit, lock (click-through), autostart, quit
- Hotkey: **Ctrl+Alt+P**
- Widget UI: transparent stage, hover-only toolbar, compact `desktop` preset

## Packaging

```bash
npm run dist
```

Builds shared → server → web → desktop, bundles server with esbuild into `apps/desktop/dist-electron/server.bundle.cjs`, then electron-builder NSIS → `apps/desktop/release/PulseDeck-Setup-*.exe`.

Tag `v*` triggers `.github/workflows/release.yml` on Windows to attach the installer to a GitHub Release.

## Security notes

- Server binds **localhost only**.
- No secrets in the repo; optional Finnhub key lives in user config.
- Report vulnerabilities per [SECURITY.md](../SECURITY.md).
