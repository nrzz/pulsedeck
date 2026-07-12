# Installing PulseDeck

PulseDeck is a **Windows desktop app**. Download the installer from GitHub Releases — no Node.js, no command line, no clone of this repo.

![Desktop widget board](screenshot-widget.png)

---

## 1. Download

1. Open **[Releases → Latest](https://github.com/nrzz/pulsedeck/releases/latest)**
2. Download **`PulseDeck-Setup-x.x.x.exe`** (current: **1.0.2**)
3. Double-click the file and follow the installer
4. Launch **PulseDeck** from the Start menu or desktop shortcut

### Windows SmartScreen

Official builds are **not code-signed**. Windows may show “Windows protected your PC”:

1. Click **More info**
2. Click **Run anyway**

That is expected for many open-source apps. The source is public on GitHub.

### Firewall

PulseDeck runs a local server on `127.0.0.1` only. Allow **private networks** if Windows asks. External widgets (crypto, weather, news, public IP) need outbound HTTPS.

---

## 2. First launch

You should see:

| Expect | Detail |
| ------ | ------ |
| Glass widgets on the wallpaper | Board is **pinned behind apps** by default |
| Toolbar | **Edit · Add · Presets · Customize** (always visible unless locked) |
| Close window | Hides to the **system tray** (does not quit) |
| Tray click / right-click | Opens the menu — board stays visible (including tray `^`) |

![Full dashboard view](screenshot-dashboard.png)

### Hotkeys

| Shortcut | Action |
| -------- | ------ |
| **Ctrl+Alt+P** | Show / hide board |
| **Ctrl+Alt+E** | Edit layout |
| **Ctrl+Alt+L** | Lock / unlock (click-through) |

### Optional tray items

- **Float over apps** — put the board above Chrome/other windows
- **Quit** — fully exit PulseDeck

---

## 3. Customize your board

![Customize panel](screenshot-customize.png)

1. Click **Customize** (gear)
2. Change theme, accent, density, scale, grid columns
3. Set **News tray** defaults (topics, suggestion packs)
4. Apply a **Layout pack** (Minimal, System, Network, Finance, Focus, Full monitor)

![Add widget catalog — 47 types](screenshot-add-widget.png)

To add widgets: **Edit → Add** → search or pick a category → click a type.

---

## Where files live

| Item | Location |
| ---- | -------- |
| App install | Usually `%LOCALAPPDATA%\Programs\PulseDeck\` |
| Layout & settings | `%APPDATA%\PulseDeck\config.json` |

```powershell
explorer $env:APPDATA\PulseDeck
```

---

## Reset / uninstall

**Reset layout**

1. Tray → **Quit**
2. Delete `%APPDATA%\PulseDeck\config.json`
3. Start PulseDeck again  

Or use **Settings → Reset to defaults** in the app.

**Uninstall**

- Windows **Settings → Apps → PulseDeck → Uninstall**, or the Start menu uninstaller  
- Config may remain under `%APPDATA%\PulseDeck` — delete that folder for a clean slate

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| Won’t start / blank window | Quit from tray, delete `%APPDATA%\PulseDeck\config.json`, relaunch |
| Board disappears on tray `^` | Update to **1.0.2+** (WorkerW pin); tray should only open the menu |
| Installer fails to start with `path` / `undefined` | Update to **1.0.2+** — v1.0.1 had a packaged-server bug |
| No live metrics | Wait a few seconds on first launch (Windows WMI warmup) |
| Crypto / weather / news empty | Need internet access |
| Two instances | PulseDeck is single-instance — second launch focuses the first |
| High memory | Prefer Minimal/System packs; News tray is titles-only |

Still stuck? [Open an issue](https://github.com/nrzz/pulsedeck/issues) with Windows version, PulseDeck version, and steps to reproduce.

---

## Building from source?

For contributors only — see [CONTRIBUTING.md](../CONTRIBUTING.md).
