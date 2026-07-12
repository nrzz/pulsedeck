# Installing PulseDeck

PulseDeck is a **desktop app for Windows and Linux**. Download from GitHub Releases — no Node.js required for normal use.

![Desktop widget board](screenshot-widget.png)

---

## Windows

1. Open **[Releases → Latest](https://github.com/nrzz/pulsedeck/releases/latest)**
2. Download **`PulseDeck-Setup-x.x.x.exe`** (current: **1.1.1**)
3. Run the installer (SmartScreen: **More info → Run anyway**)
4. Launch **PulseDeck** from the Start menu

Config: `%APPDATA%\PulseDeck\config.json`  
Install: usually `%LOCALAPPDATA%\Programs\PulseDeck\`

The board pins to the **wallpaper layer** (WorkerW). Tray click opens the menu without hiding the board.

---

## Linux

1. Open **[Releases → Latest](https://github.com/nrzz/pulsedeck/releases/latest)**
2. Download either:
   - **`PulseDeck-x.x.x.AppImage`** — portable
   - **`PulseDeck-x.x.x-amd64.deb`** — Debian/Ubuntu package
3. **AppImage:**
   ```bash
   chmod +x PulseDeck-*.AppImage
   ./PulseDeck-*.AppImage
   ```
4. **deb:**
   ```bash
   sudo apt install ./PulseDeck-*-amd64.deb
   pulsedeck
   ```

Config: `~/.config/PulseDeck/config.json`

### Linux notes

| Topic          | Detail                                                         |
| -------------- | -------------------------------------------------------------- |
| Tray           | May need `libayatana-appindicator` / StatusNotifier support    |
| Behind windows | Best-effort (X11 + `wmctrl` helps); not a true wallpaper embed |
| Wayland        | App runs; global hotkeys may be blocked by the compositor      |
| GPU util       | `nvidia-smi` + DRM sysfs for AMD/Intel when available          |
| Fans           | hwmon / `lm-sensors` when present                              |

---

## First launch

| Expect        | Detail                                       |
| ------------- | -------------------------------------------- |
| Glass widgets | Board visible on desktop / behind apps       |
| Toolbar       | **Edit · Add · Presets · Customize**         |
| Close window  | Hides to the **system tray** (does not quit) |
| Tray click    | Opens the menu — board stays visible         |

### Hotkeys

| Shortcut       | Action                        |
| -------------- | ----------------------------- |
| **Ctrl+Alt+P** | Show / hide board             |
| **Ctrl+Alt+E** | Edit layout                   |
| **Ctrl+Alt+L** | Lock / unlock (click-through) |

### Launcher apps

Gear on **Launcher** → **App** → pick presets (Cursor, Chrome, …) or **Browse…** for any `.exe` / `.desktop`. URLs still work via the **URL** tab.

---

## Customize

1. Click **Customize**
2. Theme, accent, density, scale, grid columns
3. **News tray** defaults and layout packs

To add widgets: **Edit → Add**.

---

## Troubleshooting

| Problem                                | Fix                                                    |
| -------------------------------------- | ------------------------------------------------------ |
| Won’t start / blank window             | Quit from tray; delete config folder; relaunch         |
| Board disappears on tray `^` (Windows) | Update to **1.0.3+** (WorkerW pin)                     |
| GPU util stuck at 0% / Intel “+1 more” | Update to **1.0.6+**                                   |
| Can't pick gold/silver in Stocks       | Update to **1.0.5+** — Stocks gear chips               |
| News one-per-topic / no scroll         | Update to **1.0.4+**                                   |
| Launcher only opens URLs               | Update to **1.1.0+** — gear → App                      |
| Linux tray missing                     | Install appindicator packages; or use taskbar fallback |
| Crypto / weather / news empty          | Need internet                                          |
| High memory                            | Prefer Minimal/System packs                            |

Still stuck? [Open an issue](https://github.com/nrzz/pulsedeck/issues) with OS, PulseDeck version, and steps.

---

## Building from source?

See **[CONTRIBUTING.md](../CONTRIBUTING.md)** (`npm run dist:win` / `npm run dist:linux`).
