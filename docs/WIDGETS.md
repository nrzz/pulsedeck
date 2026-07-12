# Widget reference (SOP)

Complete catalog of built-in PulseDeck widgets. Each card is a React component registered in `apps/web/src/widgets/registry.tsx` and listed in `WIDGET_CATALOG` (`packages/shared`). Grid sizes are **12-column** units (`w` / `h`) unless the shell uses 8/16 columns.

Collectors are **demand-gated**: expensive calls (`disksIO`, `cpuCurrentSpeed`) only run when related widgets are on the active preset. Charts use **SVG sparklines** only (no recharts).

---

## System

| Type | Name | Shows | Default size |
|------|------|-------|--------------|
| `cpu` | CPU | Load %, cores, optional temp | 3×3 |
| `ram` | Memory | Used %, sparkline | 3×3 |
| `gpu` | GPU | Util %, VRAM | 3×3 |
| `disk` | Disks | Drive space bars | 3×3 |
| `processes` | Processes | Top by CPU/RAM (`sortBy`, `limit`) | 4×4 |
| `battery` | Battery | Charge / AC | 2×2 |
| `system-info` | System Info | Hostname, OS, uptime | 2×2 |
| `uptime` | Uptime | Time since boot | 2×2 |
| `temps` | Temperatures | CPU / GPU temps | 3×2 |
| `fans` | Fans | RPM when OS exposes (often empty) | 3×2 |
| `cpu-freq` | CPU Frequency | Current / min / max clocks | 3×2 |
| `swap` | Swap | Pagefile usage | 3×2 |
| `disk-io` | Disk I/O | Read/write rates | 3×2 |
| `top-memory` | Top Memory | Processes by RAM | 4×3 |
| `sensors` | Sensors | Temp + fan + battery strip | 4×2 |
| `alerts` | Alerts | Threshold status board | 3×2 |

## Network

| Type | Name | Shows | Default size |
|------|------|-------|--------------|
| `network-speed` | Network Speed | RX/TX + sparklines | 4×3 |
| `wifi` | Wi‑Fi | SSID / signal | 2×2 |
| `ips` | IP Addresses | Local + public | 3×2 |
| `ping` | Ping Monitor | Hosts latency (`hosts[]`) | 3×3 |
| `data-usage` | Data Usage | Session RX/TX totals | 3×2 |
| `net-adapters` | Adapters | Per-iface up/down | 4×3 |
| `net-graph` | Net Graph | Combined RX/TX history | 4×3 |
| `ports` | Ports | Watched hosts/ports | 3×3 |
| `bandwidth-cap` | Bandwidth Cap | Session vs optional monthly cap | 3×2 |

## Finance

| Type | Name | Shows | Default size |
|------|------|-------|--------------|
| `crypto` | Crypto | CoinGecko watchlist (`symbols`) | 4×3 |
| `stocks` | Stocks | Tickers (`symbols`) | 4×3 |
| `exchange` | Exchange | FX pairs (`pairs`, default USD/INR) | 3×2 |
| `market-strip` | Market Strip | Compact stock+crypto row | 6×2 |
| `portfolio` | Portfolio | Local holdings × price | 4×3 |

## Extras / lifestyle

| Type | Name | Shows | Default size |
|------|------|-------|--------------|
| `clock` | Clocks | Local + world (`timezones`) | 2×3 |
| `world-clocks` | World Clocks | Multi-city strip | 6×2 |
| `weather` | Weather | Open-Meteo (default **Bangalore**) | 2×3 |
| `aqi` | Air Quality | Open-Meteo air API | 2×2 |
| `notes` | Notes | Persisted notepad | 4×4 |
| `todo` | Todo | Checklist in widget settings | 3×3 |
| `calendar` | Calendar | Month grid + today | 3×3 |
| `timer` | Timer | Countdown / Pomodoro | 3×2 |
| `stopwatch` | Stopwatch | Elapsed timer | 2×2 |
| `quick-links` | Quick Links | Bookmarks | 3×3 |
| `launcher` | Launcher | Big app/URL buttons | 4×2 |
| `headline` | Headline | Single RSS item (`feedUrl`) | 4×2 |
| `news` | News tray | Multi-topic headlines, suggestion packs, custom RSS; titles+links only | 4×4 |
| `media` | Now Playing | Desktop SMTC (empty in browser) | 4×2 |
| `clipboard` | Clipboard | Last N texts (desktop; local only) | 3×3 |
| `active-app` | Active App | Foreground window (desktop) | 3×2 |
| `hotkeys` | Hotkeys | PulseDeck shortcut cheat-sheet | 3×3 |

**Catalog size:** 46 types across system / network / finance / extras.

---

## Layout packs

One-click boards from Customize → **Layout packs** (or toolbar **Presets**):

| Pack | Contents |
|------|----------|
| Minimal | CPU, RAM, Clock, Weather |
| System | CPU, RAM, GPU, Disk, Disk IO, Temps, Processes |
| Network | Speed, Wi‑Fi, IPs, Ping, Adapters, Data usage |
| Finance | Crypto, Stocks, Exchange |
| Focus | Clock, Calendar, Todo, Timer, Notes, Active app |
| Full monitor | System + network core (opt-in) |

Also: `default` (browser dashboard) and `desktop` (widget shell compact set).

## Desktop pin

Electron pins to the wallpaper layer via **WorkerW** (`apps/desktop/src/pin-desktop.ts`). Tray click opens the menu and keeps the board visible; optional **Float over apps** mode.

## Related

- Authoring SOP: [CREATING_WIDGETS.md](CREATING_WIDGETS.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
