# Installing PulseDeck

PulseDeck is a **Windows desktop app**. Most users only need the installer from GitHub Releases — no Node.js, no command line.

## Recommended: download the installer

1. Go to **Releases**:  
   `https://github.com/nrzz/pulsedeck/releases/latest`
2. Download **`PulseDeck-Setup-x.x.x.exe`**
3. Double-click the file
4. Follow the installer (you can change the install folder)
5. Finish → launch **PulseDeck** from the Start menu or desktop shortcut

### First launch checklist

- Glass widgets appear **pinned to the desktop wallpaper** (behind apps; top-right by default)
- Toolbar shows **Edit / Add / Presets / Customize** (always visible unless locked)
- Closing the board **hides to the tray** (does not quit)
- **Ctrl+Alt+P** toggles show/hide · **Ctrl+Alt+E** edit · **Ctrl+Alt+L** lock
- Tray **click or right-click** opens the menu — the board stays visible (including when using `^`)
- Optional tray item: **Float over apps** if you want the board above Chrome/etc.

---

## Windows SmartScreen (“Windows protected your PC”)

The official builds are **not code-signed** (code-signing certificates are paid). Windows may show SmartScreen once:

1. Click **More info**
2. Click **Run anyway**

This is expected for many open-source apps. You can verify the source on GitHub before installing.

---

## Firewall / network prompts

PulseDeck runs a local server on `127.0.0.1` (localhost only). Windows may ask about network access the first time:

- Allowing **private networks** is fine
- PulseDeck does **not** need to be exposed to the public internet

External widgets (crypto, stocks, weather, public IP) make outbound HTTPS requests to public APIs.

---

## Where files live

| Item                   | Location                                                   |
| ---------------------- | ---------------------------------------------------------- |
| App install            | Usually `C:\Users\<you>\AppData\Local\Programs\PulseDeck\` |
| Your layout & settings | `%APPDATA%\PulseDeck\config.json`                          |
| Notes / API keys       | Inside that same config file                               |

Open the config folder quickly:

```powershell
explorer $env:APPDATA\PulseDeck
```

---

## Reset to defaults

1. Quit PulseDeck (tray → **Quit**)
2. Delete `%APPDATA%\PulseDeck\config.json`
3. Start PulseDeck again — a default layout is created

Or use **Settings → Reset to defaults** inside the app.

---

## Uninstall

- **Settings → Apps → PulseDeck → Uninstall**, or
- Use the uninstaller from the Start menu folder

Your config in `%APPDATA%\PulseDeck` may remain; delete that folder manually if you want a clean slate.

---

## Build from source (developers)

Fresh clone from GitHub (or any git remote):

```bash
git clone https://github.com/nrzz/pulsedeck.git
cd pulsedeck
npm install
npm run typecheck
npm run build
```

### Dev (browser)

```bash
npm run dev
# UI http://localhost:5173 — API http://127.0.0.1:8787
```

### Desktop installer

```bash
npm run dist
```

Installer output:

```
apps/desktop/release/PulseDeck-Setup-1.0.0.exe
```

### Verify after clone

With `npm run dev` running in one terminal:

```bash
npm run test:e2e:full
```

Checks WorkerW/tray source contracts, APIs (including `/api/news`), and that all catalog widgets can be placed on the board.

### Requirements

- Windows 10/11 x64
- Node.js 18+

### Local symlink / SmartScreen tips when building

If `electron-builder` fails extracting `winCodeSign` with “Cannot create symbolic link”:

1. Enable **Developer Mode** in Windows Settings, or
2. Run the build in a terminal with symlink privileges

CI (GitHub Actions) builds normally without this issue.

---

## Troubleshooting

| Problem                        | Fix                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| App won’t start / blank window | Quit from tray, delete `%APPDATA%\PulseDeck\config.json`, relaunch                           |
| Board disappears on tray `^`   | Update to a build with WorkerW pin; tray should only open the menu                           |
| No live metrics                | Wait a few seconds on first launch (Windows WMI warmup). Check tray isn’t a crashed instance |
| Crypto / weather / news empty  | Need internet access for those widgets                                                       |
| Port conflict                  | Desktop picks a free port automatically; reboot if something is wedged                       |
| Dual instances                 | PulseDeck is single-instance — second launch focuses the first window                        |
| High memory                    | Prefer compact presets; News tray uses titles only — avoid Full monitor unless needed        |

Still stuck? Open a GitHub issue with:

- Windows version
- PulseDeck version / installer name
- Steps to reproduce
- Screenshot if useful

---

## Browser-only mode (optional)

If you prefer not to use the desktop shell:

```bash
npm install
npm run build
npm start
```

Then open **http://127.0.0.1:8787**