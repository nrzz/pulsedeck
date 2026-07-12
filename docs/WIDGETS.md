# Widget reference

Complete catalog of built-in PulseDeck widgets (**47** types). Each card is registered in `apps/web/src/widgets/registry.tsx` and listed in `WIDGET_CATALOG` (`packages/shared`).

Grid sizes are **column × row** units on a 12-column board (shell can use 8 or 16 columns; packs scale automatically).

Collectors are **demand-gated**: expensive calls (`disksIO`, `cpuCurrentSpeed`) only run when related widgets are on the active layout. Charts use **SVG sparklines** only.

---

## System

| Type          | Name          | Shows                                                                      | Default size |
| ------------- | ------------- | -------------------------------------------------------------------------- | ------------ |
| `cpu`         | CPU           | Load %, cores, sparkline                                                   | 3×3          |
| `ram`         | Memory        | Used %, sparkline                                                          | 3×3          |
| `gpu`         | GPU           | Util % (nvidia-smi + Windows PDH / Linux sysfs), VRAM; dual-GPU lists both | 3×3          |
| `disk`        | Disks         | Drive space bars                                                           | 3×3          |
| `processes`   | Processes     | Top by CPU/RAM (`sortBy`, `limit`)                                         | 4×4          |
| `battery`     | Battery       | Charge / AC                                                                | 2×2          |
| `system-info` | System Info   | Hostname, OS, uptime                                                       | 2×2          |
| `uptime`      | Uptime        | Time since boot                                                            | 2×2          |
| `temps`       | Temperatures  | CPU / GPU temps                                                            | 3×2          |
| `fans`        | Fans          | RPM when OS exposes (often empty)                                          | 3×2          |
| `cpu-freq`    | CPU Frequency | Current / min / max clocks                                                 | 3×3          |
| `swap`        | Swap          | Pagefile usage                                                             | 3×3          |
| `disk-io`     | Disk I/O      | Read/write rates                                                           | 3×2          |
| `top-memory`  | Top Memory    | Processes by RAM                                                           | 4×3          |
| `sensors`     | Sensors       | Temp + fan + battery strip                                                 | 4×2          |
| `alerts`      | Alerts        | Threshold status board                                                     | 3×2          |

## Network

| Type            | Name          | Shows                           | Default size |
| --------------- | ------------- | ------------------------------- | ------------ |
| `network-speed` | Network Speed | RX/TX + sparklines              | 4×3          |
| `wifi`          | Wi‑Fi         | SSID / signal                   | 2×2          |
| `ips`           | IP Addresses  | Local + public                  | 3×2          |
| `ping`          | Ping Monitor  | Hosts latency (`hosts[]`)       | 3×3          |
| `data-usage`    | Data Usage    | Session RX/TX totals            | 3×2          |
| `net-adapters`  | Adapters      | Per-iface up/down               | 4×3          |
| `net-graph`     | Net Graph     | Combined RX/TX history          | 4×3          |
| `ports`         | Ports         | Watched hosts/ports             | 3×3          |
| `bandwidth-cap` | Bandwidth Cap | Session vs optional monthly cap | 3×2          |

## Finance

| Type           | Name         | Shows                                                                                     | Default size |
| -------------- | ------------ | ----------------------------------------------------------------------------------------- | ------------ |
| `crypto`       | Crypto       | CoinGecko watchlist — tap presets (BTC…PAXG) or custom ids                                | 4×3          |
| `stocks`       | Stocks       | Yahoo tickers — presets include **Gold/Silver ETF + futures** (`GLD`/`SLV`/`GC=F`/`SI=F`) | 4×3          |
| `exchange`     | Exchange     | FX pairs (`pairs`, default USD/INR)                                                       | 3×2          |
| `market-strip` | Market Strip | Compact stock+crypto row                                                                  | 6×2          |
| `portfolio`    | Portfolio    | Local holdings × price                                                                    | 4×3          |

## Extras / lifestyle

| Type           | Name         | Shows                                                                                 | Default size |
| -------------- | ------------ | ------------------------------------------------------------------------------------- | ------------ |
| `clock`        | Clocks       | Local + world (`timezones`)                                                           | 2×3          |
| `world-clocks` | World Clocks | Multi-city strip                                                                      | 6×2          |
| `weather`      | Weather      | Open-Meteo (default **Bangalore**)                                                    | 2×3          |
| `aqi`          | Air Quality  | Open-Meteo air API                                                                    | 2×2          |
| `notes`        | Notes        | Persisted notepad                                                                     | 4×4          |
| `todo`         | Todo         | Checklist in widget settings                                                          | 3×3          |
| `calendar`     | Calendar     | Month grid + today                                                                    | 3×4          |
| `timer`        | Timer        | Pomodoro countdown                                                                    | 2×3          |
| `stopwatch`    | Stopwatch    | Elapsed timer                                                                         | 2×3          |
| `quick-links`  | Quick Links  | Bookmarks                                                                             | 3×3          |
| `launcher`     | Launcher     | URL **or** desktop app buttons (presets + Browse); opens via Electron                 | 4×2          |
| `headline`     | Headline     | Single RSS item (`feedUrl`)                                                           | 4×2          |
| `news`         | News tray    | Scrollable mixed headlines (up to 8 topics, ~20 items); suggestion packs + custom RSS | 4×5          |
| `media`        | Now Playing  | Desktop SMTC (empty in browser)                                                       | 4×2          |
| `clipboard`    | Clipboard    | Last N texts (desktop)                                                                | 3×3          |
| `active-app`   | Active App   | Foreground window (desktop)                                                           | 3×2          |
| `hotkeys`      | Hotkeys      | PulseDeck shortcut cheat-sheet                                                        | 3×3          |

---

## Layout packs

One-click boards from **Customize → Layout packs** or toolbar **Presets**:

| Pack         | Contents                                                       |
| ------------ | -------------------------------------------------------------- |
| Minimal      | CPU, RAM, Clock, Weather                                       |
| System       | CPU, RAM, GPU, Disk, Disk I/O, Temps, Processes                |
| Network      | Speed, Wi‑Fi, IPs, Ping, Adapters, Data usage                  |
| Finance      | Crypto, Stocks, Exchange                                       |
| Focus        | Clock, Calendar, Todo, Timer, Notes, Active app, **News tray** |
| Full monitor | Dense system + network core                                    |

Also: default browser dashboard and compact **Desktop** shell preset.

## Desktop pin

**Windows:** Electron pins to the wallpaper layer via **WorkerW**. Tray click opens the menu and keeps the board visible; optional **Float over apps**.

**Linux:** **Behind windows** (best-effort stacking; `wmctrl` on X11 helps) or **Float over apps**. True wallpaper embed is not available.

## Related

- Install (end users): [INSTALL.md](INSTALL.md)
- Authoring SOP: [CREATING_WIDGETS.md](CREATING_WIDGETS.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
