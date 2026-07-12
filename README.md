# PulseDeck

**Your Windows PC widget dashboard — as a real desktop app.**

Live CPU, RAM, GPU, disks, network, crypto, stocks, weather, news, and more on a glass widget board. Install once, launch from the Start menu. No browser. No terminal.

[![CI](https://github.com/nrzz/pulsedeck/actions/workflows/ci.yml/badge.svg)](https://github.com/nrzz/pulsedeck/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/nrzz/pulsedeck)](https://github.com/nrzz/pulsedeck/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)

![PulseDeck dashboard](docs/screenshot-dashboard.png)

<p align="center">
  <img src="docs/screenshot-widget.png" alt="Desktop widget board pinned over the wallpaper" width="720" />
</p>

---

## Download (recommended)

**Most people only need the installer.** You do not need Node.js or this repository.

1. Open **[latest release](https://github.com/nrzz/pulsedeck/releases/latest)**
2. Download **`PulseDeck-Setup-1.0.6.exe`** (or the newest `PulseDeck-Setup-x.x.x.exe`)
3. Run it — if SmartScreen appears: **More info → Run anyway**
4. Launch **PulseDeck** from the Start menu

That’s it. The board pins to your **desktop wallpaper** (behind other apps). Closing the window hides to the tray — it does not quit.

Full guide: **[docs/INSTALL.md](docs/INSTALL.md)**

---

## What you get

| | |
| --- | --- |
| **Desktop pin** | Stays on the wallpaper layer; opening the tray `^` no longer hides the board |
| **47 widgets** | System, network, finance, clocks, weather, **News tray**, calendar, todo, timer, … |
| **One-click packs** | Minimal · System · Network · Finance · Focus · Full monitor |
| **Customize** | Themes, accents, density, scale, grid columns, news defaults, export/import |
| **Tray + hotkeys** | Click tray for menu · **Ctrl+Alt+P** show/hide · **E** edit · **L** lock |

<p align="center">
  <img src="docs/screenshot-customize.png" alt="Customize settings panel" width="700" />
  &nbsp;
  <img src="docs/screenshot-add-widget.png" alt="Add widget catalog" width="700" />
</p>

---

## Everyday use

| Action | How |
| ------ | --- |
| Show / hide board | **Ctrl+Alt+P** or tray → Show / Hide |
| Edit layout (drag / resize) | Toolbar **Edit** or **Ctrl+Alt+E** |
| Add a widget | Edit → **Add** (search + categories) |
| Themes & packs | Toolbar **Customize** or **Presets** |
| Lock (click-through) | **Ctrl+Alt+L** or tray → Lock |
| Float above apps | Tray → **Float over apps** (optional) |
| Quit fully | Tray → **Quit** |

Your layout is saved in `%APPDATA%\PulseDeck\config.json`.

---

## Widget highlights

~**47** built-in types:

- **System** — CPU, RAM, GPU, disks, I/O, temps, swap, frequency, processes, sensors, alerts
- **Network** — speed, Wi‑Fi, IPs, ping, adapters, graph, ports, data usage
- **Finance** — crypto, stocks, FX, market strip, portfolio
- **Extras** — clocks, weather (Bangalore default), AQI, **News tray** (topics + RSS), calendar, todo, timer, notes, launcher

Full list and settings: **[docs/WIDGETS.md](docs/WIDGETS.md)**

---

## Project structure

```
pulsedeck/
├── apps/
│   ├── desktop/    # Electron shell (window, tray, installer)
│   ├── server/     # Local metrics API + WebSocket
│   └── web/        # React widget dashboard
├── packages/shared # Types, defaults, catalog
└── docs/           # Install + widget reference
```

The installed `.exe` embeds the server and UI. Day-to-day you never need `npm`.

---

## Contributing / building from source

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for `npm install`, `npm run dist`, and tests.

Internals: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Authoring widgets: [docs/CREATING_WIDGETS.md](docs/CREATING_WIDGETS.md)

## License

MIT — see [LICENSE](LICENSE).



