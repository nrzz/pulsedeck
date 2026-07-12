# Contributing to PulseDeck

Thanks for helping make PulseDeck better!

End users should install from [GitHub Releases](https://github.com/nrzz/pulsedeck/releases/latest) — see [docs/INSTALL.md](docs/INSTALL.md). This page is for people changing the code or building the installer.

## Prerequisites

- Windows 10/11 x64
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Git

## Development setup

```bash
git clone https://github.com/nrzz/pulsedeck.git
cd pulsedeck
npm install
```

### Browser mode (fast UI work)

```bash
npm run dev
```

| Process       | URL                   |
| ------------- | --------------------- |
| Web UI (Vite) | http://localhost:5173 |
| API + WS      | http://127.0.0.1:8787 |

### Desktop shell (Electron)

```bash
npm run build
npm run dev -w @pulsedeck/desktop
```

Or one shot: `npm run dev:desktop`

### Production Node server only (debug)

After `npm run build`:

```bash
npm start
```

Serves the built UI from the server package. Default port is **8787** (`PORT` env overrides). The installed desktop app does **not** use this path — it embeds its own server on a free localhost port.

## Build the Windows installer

```bash
npm run dist
```

Output (gitignored): `apps/desktop/release/PulseDeck-Setup-*.exe`

If `electron-builder` fails extracting `winCodeSign` with “Cannot create symbolic link”:

1. Enable **Developer Mode** in Windows Settings, or
2. Run the build in a terminal with symlink privileges

GitHub Actions builds normally without this issue.

### Publish a GitHub Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

[`.github/workflows/release.yml`](.github/workflows/release.yml) builds the installer on `windows-latest` and attaches it to the release.

## Checks before a PR

```bash
npm run typecheck
npm run lint
npm run format:check
```

With `npm run dev` (or a built `npm start`) running:

```bash
npm run test:e2e:full
```

That is the main E2E entry (catalog, APIs, tray/WorkerW contracts). Other `test:e2e*` scripts are narrower helpers.

## Guidelines

- Prefer TypeScript; keep shared types in `packages/shared`
- New widgets: follow [docs/CREATING_WIDGETS.md](docs/CREATING_WIDGETS.md) and update [docs/WIDGETS.md](docs/WIDGETS.md)
- Do not commit `apps/server/data/config.json`, `%APPDATA%/PulseDeck`, or API keys
- Keep PRs focused; one feature or fix per PR when possible
- Be excellent: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## Project layout

| Path                        | Role                                                                       |
| --------------------------- | -------------------------------------------------------------------------- |
| `apps/web`                  | React dashboard UI                                                         |
| `apps/server`               | Fastify REST + WebSocket + metric collectors (`startServer` is embeddable) |
| `apps/desktop`              | Electron window, tray, NSIS installer                                      |
| `packages/shared`           | Types, defaults, widget catalog metadata                                   |
| `scripts/bundle-server.mjs` | Bundles the server for packaging inside Electron                           |

Deeper design notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Useful scripts

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Browser mode (server + Vite)                     |
| `npm run dev:desktop` | Build then launch Electron                       |
| `npm run build`       | Build all packages + server bundle               |
| `npm run dist`        | Build Windows NSIS installer                     |
| `npm start`           | Run production Node server only (contributor)    |
| `npm run typecheck`   | Typecheck all packages                           |
| `npm run lint`        | ESLint                                           |
| `npm run test:e2e:full` | Full E2E suite                                 |

## Reporting bugs

Open an issue with:

- OS / PulseDeck version (installer vs local build)
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (redact secrets)

## Code of conduct

Be respectful. Assume good intent. No harassment or discrimination.
