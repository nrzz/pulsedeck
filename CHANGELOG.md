# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.3] — 2026-07-13

### Fixed

- **Desktop preset pollution** — e2e no longer overwrites Desktop with all widgets; polluted boards auto-heal on load
- **CPU** — vitals use cheap `os.cpus()` / `os.freemem()` instead of Windows WMI every tick; network/temp/swap only when those widgets are on

### Changed

- Metrics broadcast default **15s**; slow collectors **30s**

## [1.1.2] — 2026-07-13

### Fixed

- **High CPU** — expensive collectors (`processes`, GPU/`nvidia-smi`/PDH, wifi, battery, …) only run when matching widgets are on the board
- Metrics broadcast slowed to **10s** (override with `PULSEDECK_METRICS_MS`); slow collectors every **20s**
- Desktop window defaults to **opaque** (set `PULSEDECK_TRANSPARENT=1` for glass); skip needless Zustand re-renders

### Changed

- New installs default to the lighter **Desktop** preset instead of the full board

## [1.1.1] — 2026-07-12

### Fixed

- Metrics API always returns `gpu` as an array (empty on headless hosts) so Linux CI e2e no longer fails when no GPU is present

## [1.1.0] — 2026-07-12

### Added

- **Linux desktop packages** — AppImage + `.deb` (x64); dual-OS GitHub Release
- **Linux behind-windows** pin (wmctrl on X11) + tray label; float mode unchanged
- **Launcher apps** — URL or App buttons; presets (Cursor, Chrome, …); Browse dialog; legacy URL migration
- Media / Clipboard / Active App desktop bridges (MPRIS / clipboard poll / foreground window)
- Linux GPU util via DRM sysfs (AMD/Intel) alongside nvidia-smi; fan RPM via hwmon/`sensors`
- CI e2e matrix (ubuntu + windows) and Linux pack smoke

### Changed

- Docs and product copy cover Windows & Linux; INSTALL split by OS

## [1.0.7] — 2026-07-12

### Fixed

- GPU enrichment always prefers discrete GPU (nvidia-smi) even when the GPU widget is not yet on the board
- Prettier/format CI failures from prior patch bumps

### Changed

- Docs: GPU dual-adapter, gold/silver stocks, News scroll troubleshooting in INSTALL / WIDGETS / README
- E2E (`test:e2e:full`) covers commodities, news variety, GPU order, Stocks gold/silver chips, News scroll

## [1.0.6] — 2026-07-12

### Fixed

- **GPU util stuck at 0.0%** on Intel UHD while the discrete GPU was hidden as “+1 more”
- Reads NVIDIA util from **nvidia-smi** (including real 0%), Intel/other from Windows GPU Engine counters
- Discrete GPU (RTX/AMD) shown first; second GPU listed with its own util/temp

## [1.0.5] — 2026-07-12

### Added

- Stocks / Crypto / Portfolio gear: **tap-to-toggle presets** including **Gold ETF (GLD)**, **Silver ETF (SLV)**, gold/silver futures, indices, and more coins (PAXG, XAUT)
- Custom ticker / CoinGecko id field still works for anything else

### Fixed

- Stock quotes fall back to Yahoo when Finnhub misses a symbol (commodities / futures)
- Typing `gold` / `silver` maps to GLD / SLV; watchlists and portfolio show the full list (scrollable)

## [1.0.4] — 2026-07-12

### Changed

- **News tray** scrolls when headlines overflow (other widgets stay clipped)
- Defaults fetch **~20 mixed headlines** across more topics (not one item per topic)
- Up to **8 topics**, item count options **8–32**, richer suggestion packs; old trays with limit ≤6 auto-upgrade to 20

## [1.0.3] — 2026-07-12

### Fixed

- **Launcher** (and other settings-backed widgets) now have a gear panel to add/edit/remove items
- Widget settings persist automatically (no longer lost until Save)
- Exchange, Portfolio, Ports, World Clocks, Bandwidth Cap, AQI are configurable from the gear
- Crypto/Stocks no longer stuck on “Loading…” when watchlist does not match quotes
- Tighter widget titles so labels like Network Speed / Launcher truncate less

## [1.0.2] — 2026-07-12

### Fixed

- Packaged app crash on launch: `The 'path' argument must be of type string… Received undefined` from empty `import.meta.url` in the CJS server bundle

### Changed

- Public docs refreshed for **v1.0.1**: clearer install/usage copy and new screenshots (dashboard, widget shell, customize, add-widget catalog)

## [1.0.1] — 2026-07-12

### Added

- **WorkerW desktop pin** — board lives on the wallpaper layer; tray `^` / click no longer hide it
- Optional **Float over apps** mode; corner reset; multi-monitor display helpers
- Hotkeys: **Ctrl+Alt+P** show/hide, **Ctrl+Alt+E** edit, **Ctrl+Alt+L** lock
- **Customization studio** — scale, grid cols, density/spacious, corner radius, font size, reduce motion, layout packs (Minimal / System / Network / Finance / Focus / Full monitor)
- **~47 widget types** — temps, disk I/O, swap, cpu-freq, sensors, alerts, adapters, net graph, FX, portfolio, calendar, todo, timer, AQI, **News tray**, and more
- **News tray** — topic selection, suggestion packs, custom RSS; titles + links only; 12‑minute server cache
- Settings defaults for news; empty-board CTA; Presets toolbar shortcut; threshold alert tint on CPU/RAM/Disk
- Demand-gated expensive collectors (`disksIO`, `cpuCurrentSpeed`); SVG sparklines only (no recharts)
- Full E2E suite (`npm run test:e2e:full`) covering catalog, WorkerW/tray contracts, news API

### Changed

- Default weather city **Bangalore**; lighter memory defaults (shorter sparkline history)
- Tray always pops context menu (never toggles hide on single click)
- Always-visible Customize / Presets toolbar on the widget shell
- Docs are **installer-first** — end-user install lives in README / INSTALL; contributor npm workflows live in CONTRIBUTING only

### Fixed

- Board vanishing when opening the Windows tray overflow (`^`) due to `HWND_BOTTOM` / blur re-pin
- Widget fit/overflow edge cases: denser min heights, capped lists with “+N more”, gear-only scroll, Notes height fill
- Grid column changes proportionally reflow layouts; layout packs scale to 8/12/16 cols
- Corner radius theme applied to edit chrome / grid placeholder; dead `hide-widget-titles` CSS class toggle removed
- Settings/Add modal titles no longer hidden when widget titles are off
- Production `npm start` resolving the correct web UI dist (`index.html`)

### Removed

- Unused docs image assets (`app-icon.png`, `screenshot-desktop.png`, `screenshot-placeholder.svg`)

## [1.0.0] — 2026-07-12

### Added

- Windows desktop app (Electron) with NSIS installer and system tray
- Floating transparent widget shell (`?shell=widget`) with wallpaper between cards
- Desktop pin (behind apps), lock / click-through, Ctrl+Alt+P show/hide, autostart
- Compact **Desktop** preset (CPU, RAM, Network, Clock, Weather)
- Full browser dashboard with drag-and-drop / resize grid (Edit mode)
- 18 widgets across system, network, finance, and extras
- Themes, accents, density, notes, quick links, layout presets, export/import
- GitHub Actions CI + Windows release workflow

### Fixed

- Grid drag/resize broken by CSS `transform` entrance animation on grid items
- Packaged app crash from top-level `import.meta.url` in CJS server bundle

[Unreleased]: https://github.com/nrzz/pulsedeck/compare/v1.1.3...HEAD
[1.1.3]: https://github.com/nrzz/pulsedeck/releases/tag/v1.1.3
[1.1.2]: https://github.com/nrzz/pulsedeck/releases/tag/v1.1.2
[1.1.1]: https://github.com/nrzz/pulsedeck/releases/tag/v1.1.1
[1.1.0]: https://github.com/nrzz/pulsedeck/releases/tag/v1.1.0
[1.0.7]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.7
[1.0.6]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.6
[1.0.5]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.5
[1.0.4]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.4
[1.0.3]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.3
[1.0.2]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.2
[1.0.1]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.1
[1.0.0]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.0
