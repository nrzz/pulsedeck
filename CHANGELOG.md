# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/nrzz/pulsedeck/releases/tag/v1.0.0
