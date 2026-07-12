# PulseDeck

**Your Windows PC widget dashboard — as a real desktop app.**

Live CPU, RAM, GPU, disks, network, crypto, stocks, weather, and more in a beautiful drag-and-drop widget grid. Install once, launch from the Start menu. No browser. No terminal.

[![CI](https://github.com/nrzz/pulsedeck/actions/workflows/ci.yml/badge.svg)](https://github.com/nrzz/pulsedeck/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/nrzz/pulsedeck?include_prereleases)](https://github.com/nrzz/pulsedeck/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)

![PulseDeck dashboard](docs/screenshot-dashboard.png)

<p align="center"><img src="docs/screenshot-widget.png" alt="PulseDeck floating desktop widgets" width="720" /></p>

---

## Download & install (end users)

**This is the path for most people.** You do not need Node.js.

1. Open the latest release:  
   **https://github.com/nrzz/pulsedeck/releases/latest**
2. Download **`PulseDeck-Setup-x.x.x.exe`**
3. Run the installer
   - If Windows SmartScreen appears: click **More info** → **Run anyway**  
     (the installer is open-source but not code-signed — signing certificates cost money)
4. Launch **PulseDeck** from the Start menu or desktop shortcut
5. The floating widget board opens on your desktop (wallpaper shows between cards)

**That’s it.** Closing the board hides to the system tray. **Ctrl+Alt+P** toggles visibility. Tray click opens the menu (board stays pinned). Right-click the tray → **Quit** to fully exit.

The board pins to your **desktop wallpaper** by default (behind apps). Use tray → **Float over apps** only if you want it on top.

Full install help: [docs/INSTALL.md](docs/INSTALL.md)

### Local installer (if you built from source)

After `npm run dist`, the installer is at:

```
apps/desktop/release/PulseDeck-Setup-1.0.0.exe
```

---

## Features

| Area                | What you get                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| **Desktop pin**     | Board attaches to the wallpaper layer (WorkerW) — apps cover it; tray `^` no longer hides the board   |
| **Tray + hotkeys**  | Menu on click/right-click; **Ctrl+Alt+P** show/hide, **E** edit, **L** lock; optional float-over-apps |
| **Widget grid**     | Drag, resize, add/remove; search + category Add modal; layout packs (Minimal → Full monitor)          |
| **System**          | CPU, RAM, GPU, disks, I/O, temps, swap, freq, processes, sensors, alerts, battery, uptime             |
| **Network**         | Speeds, Wi‑Fi, IPs, ping, adapters, graph, ports, data usage / bandwidth cap                          |
| **Finance**         | Crypto, stocks, FX exchange, market strip, local portfolio                                            |
| **Extras**          | Clocks, weather (Bangalore default), AQI, news tray, calendar, todo, timer, notes, launcher, …        |
| **News tray**       | Topic chips + suggestion packs + custom RSS; titles/links only (low memory)                           |
| **Customization**   | Themes, accents, density, scale, grid cols, news defaults, export/import JSON                         |

---

## For developers

### Prerequisites

- **Windows 10/11** (x64)
- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- Git

### Clone & run (browser mode)

```bash
git clone https://github.com/nrzz/pulsedeck.git
cd pulsedeck
npm install
npm run dev
```

Open **http://localhost:5173** — hot reload for UI work.

| Process         | URL                   |
| --------------- | --------------------- |
| Web UI (Vite)   | http://localhost:5173 |
| API + WebSocket | http://127.0.0.1:8787 |

### Run as desktop app (dev)

```bash
npm run build          # builds UI + server + Electron main + server bundle
npm run dev -w @pulsedeck/desktop
```

Or one shot: `npm run dev:desktop`

### Build the Windows installer

```bash
npm run dist
```

Output: `apps/desktop/release/PulseDeck-Setup-1.0.0.exe` (~80 MB)

### Publish a GitHub Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions (`.github/workflows/release.yml`) builds the installer on `windows-latest` and attaches it to the release automatically.

---

## Project structure

```
pulsedeck/
├── apps/
│   ├── desktop/    # Electron shell (window, tray, installer)
│   ├── server/     # Fastify + WebSocket + systeminformation
│   └── web/        # React + Tailwind widget dashboard
├── packages/
│   └── shared/     # Shared types & default layout
├── docs/           # Install guide, widget authoring
└── .github/        # CI + release workflows
```

```mermaid
flowchart LR
  Desktop[Electron PulseDeck.exe] --> Server[Embedded Fastify server]
  Server --> UI[Built React UI]
  Server --> Metrics[systeminformation]
  Server --> Config["%APPDATA%/PulseDeck/config.json"]
```

- **Desktop mode:** Electron starts the server on a free localhost port and loads the UI in a `BrowserWindow`.
- **Browser mode:** `npm run dev` runs server + Vite separately (great for UI development).
- **Config** lives in `%APPDATA%\PulseDeck\` for the desktop app (not in the repo).

---

## Widget catalog

~**47** built-in types. Highlights:

| Category | Widgets                                                                 |
| -------- | ----------------------------------------------------------------------- |
| System   | CPU, RAM, GPU, Disks, Disk I/O, Temps, Swap, Fans, Processes, Alerts, … |
| Network  | Speed, Wi‑Fi, IPs, Ping, Adapters, Net graph, Ports, Data usage         |
| Finance  | Crypto, Stocks, Exchange, Market strip, Portfolio                       |
| Extras   | Clocks, Weather, AQI, **News tray**, Calendar, Todo, Timer, Notes, …    |

- Full reference (settings, data sources, sizes): [docs/WIDGETS.md](docs/WIDGETS.md)
- Add your own (SOP): [docs/CREATING_WIDGETS.md](docs/CREATING_WIDGETS.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Install from Releases or git: [docs/INSTALL.md](docs/INSTALL.md)

---

## Scripts

| Command                   | Description                                        |
| ------------------------- | -------------------------------------------------- |
| `npm run dev`             | Browser mode (server + Vite)                       |
| `npm run dev:desktop`     | Build then launch Electron                         |
| `npm run build`           | Build shared, server, web, desktop + server bundle |
| `npm run dist`            | Build Windows NSIS installer                       |
| `npm start`               | Run production Node server only                    |
| `npm run typecheck`       | Typecheck all packages                             |
| `npm run lint`            | ESLint                                             |
| `npm run test:e2e`        | Playwright UI smoke tests                          |
| `npm run test:e2e:dnd`    | Drag / resize E2E                                  |
| `npm run test:e2e:widget` | Widget-shell E2E                                   |
| `npm run test:e2e:full`   | Full catalog + tray/WorkerW contracts + APIs       |

---

## FAQ

**Do users need Node.js?**  
No — only the `.exe` installer from Releases.

**Why does SmartScreen warn me?**  
Unsigned installer. Open source apps often aren’t signed. Use **More info → Run anyway**. Details in [docs/INSTALL.md](docs/INSTALL.md).

**Where is my layout saved?**  
Desktop: `%APPDATA%\PulseDeck\config.json`  
Dev server: `apps/server/data/config.json`

**Can I still use it in a browser?**  
Yes — `npm run dev` or `npm run build && npm start`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
