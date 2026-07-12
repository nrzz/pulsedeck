# Contributing to PulseDeck

Thanks for helping make PulseDeck better!

## Development setup

1. Fork and clone the repo
2. `npm install` from the repo root
3. Choose a mode:
   - **Browser (fast UI iteration):** `npm run dev` → http://localhost:5173
   - **Desktop shell:** `npm run build` then `npm run dev -w @pulsedeck/desktop`
4. Make changes on a feature branch

## Guidelines

- Prefer TypeScript; keep shared types in `packages/shared`
- New widgets: follow the SOP in [docs/CREATING_WIDGETS.md](docs/CREATING_WIDGETS.md) and update [docs/WIDGETS.md](docs/WIDGETS.md)
- Do not commit `apps/server/data/config.json`, `%APPDATA%/PulseDeck`, or API keys
- Run `npm run typecheck`, `npm run lint`, and `npm run format:check` before opening a PR
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

## Desktop packaging notes

- `npm run dist` produces `apps/desktop/release/PulseDeck-Setup-*.exe`
- Tag `v*` pushes trigger [`.github/workflows/release.yml`](.github/workflows/release.yml)
- Installer is unsigned by default — document SmartScreen for users (see [docs/INSTALL.md](docs/INSTALL.md))

## Reporting bugs

Open an issue with:

- OS / Node / PulseDeck version (installer vs `npm run dev`)
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (redact secrets)

## Code of conduct

Be respectful. Assume good intent. No harassment or discrimination.
