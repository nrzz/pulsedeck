# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/nrzz/pulsedeck/compare/v1.0.4...HEAD
[1.0.4]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.4
[1.0.3]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.3
[1.0.2]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.2
[1.0.1]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.1
[1.0.0]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.0
