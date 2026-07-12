# Widget reference (SOP)

Complete catalog of built-in PulseDeck widgets. Each card is a React component registered in `apps/web/src/widgets/registry.tsx` and listed in `WIDGET_CATALOG` (`packages/shared`).

Grid sizes are **12-column** units (`w` / `h`). Min sizes apply in Edit mode.

---

## System

### `cpu` — CPU

|                  |                                                                |
| ---------------- | -------------------------------------------------------------- |
| **Shows**        | Current load %, per-core bars/sparklines, optional temperature |
| **Data**         | WebSocket `metrics` → `metrics.cpu`                            |
| **Settings**     | none                                                           |
| **Default size** | `w: 3, h: 3` (min `2×2`)                                       |
| **File**         | `apps/web/src/widgets/system/CpuWidget.tsx`                    |

### `ram` — Memory

|                  |                                               |
| ---------------- | --------------------------------------------- |
| **Shows**        | Used %, used/total/free GB, history sparkline |
| **Data**         | WS `metrics.memory`                           |
| **Settings**     | none                                          |
| **Default size** | `w: 3, h: 3` (min `2×2`)                      |
| **File**         | `apps/web/src/widgets/system/RamWidget.tsx`   |

### `gpu` — GPU

|                  |                                                    |
| ---------------- | -------------------------------------------------- |
| **Shows**        | Utilization %, model name, VRAM if available       |
| **Data**         | WS `metrics.gpu[]` (may be empty on some machines) |
| **Settings**     | none                                               |
| **Default size** | `w: 3, h: 3` (min `2×2`)                           |
| **File**         | `apps/web/src/widgets/system/GpuWidget.tsx`        |

### `disk` — Disks

|                  |                                              |
| ---------------- | -------------------------------------------- |
| **Shows**        | Per-drive used/total bars                    |
| **Data**         | WS `metrics.disks[]`                         |
| **Settings**     | none                                         |
| **Default size** | `w: 3, h: 3` (min `2×2`)                     |
| **File**         | `apps/web/src/widgets/system/DiskWidget.tsx` |

### `processes` — Processes

|                  |                                                                             |
| ---------------- | --------------------------------------------------------------------------- |
| **Shows**        | Top processes by CPU or RAM                                                 |
| **Data**         | WS `metrics.processes[]`                                                    |
| **Settings**     | `sortBy`: `'cpu' \| 'mem'` (default `'cpu'`); `limit`: number (default `8`) |
| **Default size** | `w: 4, h: 4` (min `3×3`)                                                    |
| **File**         | `apps/web/src/widgets/system/ProcessesWidget.tsx`                           |

### `battery` — Battery

|                  |                                                      |
| ---------------- | ---------------------------------------------------- |
| **Shows**        | Charge %, charging/AC status (desktops may show N/A) |
| **Data**         | WS `metrics.battery`                                 |
| **Settings**     | none                                                 |
| **Default size** | `w: 2, h: 2` (min `2×2`)                             |
| **File**         | `apps/web/src/widgets/system/BatteryWidget.tsx`      |

### `system-info` — System Info

|                  |                                                    |
| ---------------- | -------------------------------------------------- |
| **Shows**        | Hostname, OS, uptime                               |
| **Data**         | WS `metrics.system`                                |
| **Settings**     | none                                               |
| **Default size** | `w: 2, h: 2` (min `2×2`)                           |
| **File**         | `apps/web/src/widgets/system/SystemInfoWidget.tsx` |

---

## Network

### `network-speed` — Network Speed

|                  |                                                       |
| ---------------- | ----------------------------------------------------- |
| **Shows**        | Live RX/TX rates + sparklines                         |
| **Data**         | WS `metrics.network[]` (+ client history in Zustand)  |
| **Settings**     | none                                                  |
| **Default size** | `w: 4, h: 3` (min `3×2`)                              |
| **File**         | `apps/web/src/widgets/network/NetworkSpeedWidget.tsx` |

### `wifi` — Wi‑Fi

|                  |                                               |
| ---------------- | --------------------------------------------- |
| **Shows**        | SSID / signal (or disconnected)               |
| **Data**         | WS `metrics.wifi`                             |
| **Settings**     | none                                          |
| **Default size** | `w: 2, h: 2` (min `2×2`)                      |
| **File**         | `apps/web/src/widgets/network/WifiWidget.tsx` |

### `ips` — IP Addresses

|                  |                                                              |
| ---------------- | ------------------------------------------------------------ |
| **Shows**        | Local + public IP                                            |
| **Data**         | WS `metrics` local IPs; public IP via server outbound lookup |
| **Settings**     | none                                                         |
| **Default size** | `w: 3, h: 2` (min `2×2`)                                     |
| **File**         | `apps/web/src/widgets/network/IpsWidget.tsx`                 |

### `ping` — Ping Monitor

|                  |                                                                    |
| ---------------- | ------------------------------------------------------------------ |
| **Shows**        | Latency to configured hosts                                        |
| **Data**         | WS `ping` + REST `GET /api/ping?hosts=`                            |
| **Settings**     | `hosts`: `string[]` (default `['1.1.1.1','8.8.8.8','google.com']`) |
| **Default size** | `w: 3, h: 3` (min `2×2`)                                           |
| **File**         | `apps/web/src/widgets/network/PingWidget.tsx`                      |

### `data-usage` — Data Usage

|                  |                                                    |
| ---------------- | -------------------------------------------------- |
| **Shows**        | Session RX/TX byte totals                          |
| **Data**         | Derived from WS `metrics.network`                  |
| **Settings**     | none                                               |
| **Default size** | `w: 3, h: 2` (min `2×2`)                           |
| **File**         | `apps/web/src/widgets/network/DataUsageWidget.tsx` |

---

## Finance

### `crypto` — Crypto

|                  |                                                                                 |
| ---------------- | ------------------------------------------------------------------------------- |
| **Shows**        | Price + % change + sparkline per coin                                           |
| **Data**         | REST `GET /api/crypto?ids=` (CoinGecko) + WS `crypto`                           |
| **Settings**     | `symbols`: CoinGecko ids `string[]` (default `['bitcoin','ethereum','solana']`) |
| **Default size** | `w: 4, h: 3` (min `3×2`)                                                        |
| **File**         | `apps/web/src/widgets/finance/CryptoWidget.tsx`                                 |

### `stocks` — Stocks

|                  |                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Shows**        | Quote + change for tickers                                                             |
| **Data**         | REST `GET /api/stocks?symbols=` (Yahoo; optional Finnhub via `config.apiKeys.finnhub`) |
| **Settings**     | `symbols`: ticker `string[]` (default `['AAPL','MSFT','GOOGL','TSLA']`)                |
| **Default size** | `w: 4, h: 3` (min `3×2`)                                                               |
| **File**         | `apps/web/src/widgets/finance/StocksWidget.tsx`                                        |

---

## Extras

### `clock` — Clocks

|                  |                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Shows**        | Local + world clocks                                                                   |
| **Data**         | Client clock (no server)                                                               |
| **Settings**     | `timezones`: IANA ids `string[]` (default `['UTC','America/New_York','Asia/Kolkata']`) |
| **Default size** | `w: 2, h: 3` (min `2×2`)                                                               |
| **File**         | `apps/web/src/widgets/extras/ClockWidget.tsx`                                          |

### `weather` — Weather

|                  |                                                                     |
| ---------------- | ------------------------------------------------------------------- |
| **Shows**        | Temperature / condition for a location                              |
| **Data**         | REST `GET /api/weather?lat=&lon=&city=`                             |
| **Settings**     | `lat` (number), `lon` (number), `city` (string) — default New Delhi |
| **Default size** | `w: 2, h: 3` (min `2×2`)                                            |
| **File**         | `apps/web/src/widgets/extras/WeatherWidget.tsx`                     |

### `notes` — Notes

|                  |                                                   |
| ---------------- | ------------------------------------------------- |
| **Shows**        | Editable notepad                                  |
| **Data**         | Persisted in `config.notes` via `PUT /api/config` |
| **Settings**     | none (content is global config, not per-instance) |
| **Default size** | `w: 4, h: 4` (min `2×2`)                          |
| **File**         | `apps/web/src/widgets/extras/NotesWidget.tsx`     |

### `quick-links` — Quick Links

|                  |                                                    |
| ---------------- | -------------------------------------------------- |
| **Shows**        | Bookmark buttons                                   |
| **Data**         | `config.quickLinks[]` via config API               |
| **Settings**     | none (links live on global config)                 |
| **Default size** | `w: 3, h: 3` (min `2×2`)                           |
| **File**         | `apps/web/src/widgets/extras/QuickLinksWidget.tsx` |

---

## Presets

| Preset id | Purpose                                                                          |
| --------- | -------------------------------------------------------------------------------- |
| `default` | Full dashboard (~12 widgets) — browser / power users                             |
| `desktop` | Compact floating set (CPU, RAM, Network, Clock, Weather) — Electron widget shell |

Widget shell (`?shell=widget`) auto-activates `desktop` once for new installs.

## Related

- Authoring SOP: [CREATING_WIDGETS.md](CREATING_WIDGETS.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
