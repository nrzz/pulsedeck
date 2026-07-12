# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Fixed

- Board vanishing when opening the Windows tray overflow (`^`) due to `HWND_BOTTOM` / blur re-pin

## [1.0.0] — 2026-07-12

### Added

- Windows desktop app (Electron) with NSIS installer and system tray
- Floating transparent widget shell (`?shell=widget`) with wallpaper between cards
- Desktop pin (behind apps), lock / click-through, Ctrl+Alt+P show/hide, autostart
- Compact **Desktop** preset (CPU, RAM, Network, Clock, Weather)
- Full browser dashboard with drag-and-drop / resize grid (Edit mode)
- 18 widgets across system, network, finance, and extras
- Themes, accents, density, layout presets, config export/import
- Fastify + WebSocket metrics server (`systeminformation` + external APIs)
- CI (typecheck, lint, format check, build) and tag-triggered Windows release workflow
- Docs: install guide, architecture, widget reference, creating-widgets SOP

### Fixed

- Grid drag/resize broken by CSS `transform` entrance animation on grid items
- Packaged app crash from top-level `import.meta.url` in CJS server bundle

[Unreleased]: https://github.com/nrzz/pulsedeck/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.0
