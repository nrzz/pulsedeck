import path from 'node:path';
import { pathToFileURL } from 'node:url';
import net from 'node:net';
import fs from 'node:fs';
import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  shell,
  dialog,
  globalShortcut,
  ipcMain,
  screen,
} from 'electron';
import type { MenuItemConstructorOptions, NativeImage, Rectangle } from 'electron';
import { createDesktopDetacher, createDesktopPinner } from './pin-desktop';
import { clampBoundsToDisplays, loadBounds, persistWindowBounds } from './bounds';
import { loadShellPrefs, saveShellPrefs, type ShellPrefs } from './shell-prefs';
import { getClipboardHistory, getForegroundApp, getMedia } from './bridges/desktop-info';
import { launcherAppPresets, openTarget, pickApp, resolvePresetPath } from './bridges/launcher';

// Memory: shrink Chromium caches / spare renderers before app ready
app.commandLine.appendSwitch('disable-features', 'SpareRendererForSitePerProcess,BackForwardCache');
app.commandLine.appendSwitch('disk-cache-size', '1048576');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=384');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverClose: (() => Promise<void>) | null = null;
let isQuitting = false;
let locked = false;
let serverBaseUrl = '';
let pinToDesktop: (win: BrowserWindow) => void = () => undefined;
let detachFromDesktop: (win: BrowserWindow) => void = () => undefined;
let boundsTimer: ReturnType<typeof setTimeout> | null = null;
let layerTimer: ReturnType<typeof setTimeout> | null = null;
let shellPrefs: ShellPrefs = { alwaysOnTop: false, v: 2 };

type Corner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

function getFreePort(host = '127.0.0.1'): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, host, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not allocate port'));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

function resolvePaths() {
  const packaged = app.isPackaged;
  if (packaged) {
    return {
      webDist: path.join(process.resourcesPath, 'web'),
      serverEntry: path.join(__dirname, 'server.bundle.cjs'),
      dataDir: app.getPath('userData'),
      iconPath: path.join(process.resourcesPath, 'icon.png'),
      iconIcoPath: path.join(process.resourcesPath, 'icon.ico'),
      trayIconPath: path.join(process.resourcesPath, 'tray-icon.png'),
      preload: path.join(__dirname, 'preload.js'),
    };
  }
  return {
    webDist: path.resolve(__dirname, '../../web/dist'),
    serverEntry: path.resolve(__dirname, '../../server/dist/server.js'),
    dataDir: app.getPath('userData'),
    iconPath: path.resolve(__dirname, '../resources/icon.png'),
    iconIcoPath: path.resolve(__dirname, '../resources/icon.ico'),
    trayIconPath: path.resolve(__dirname, '../resources/tray-icon.png'),
    preload: path.join(__dirname, 'preload.js'),
  };
}

async function waitForHealth(url: string, attempts = 40): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('PulseDeck server failed to become ready');
}

async function bootServer() {
  const { webDist, serverEntry, dataDir } = resolvePaths();
  const port = await getFreePort();

  if (!fs.existsSync(webDist)) {
    throw new Error(
      `Web UI not found at ${webDist}. Run "npm run build" before launching the desktop app.`,
    );
  }

  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Server entry not found at ${serverEntry}. Run "npm run build" first.`);
  }

  process.env.PULSEDECK_DATA_DIR = dataDir;
  process.env.PULSEDECK_WEB_DIST = webDist;

  let startServer: (opts: Record<string, unknown>) => Promise<{
    url: string;
    close: () => Promise<void>;
  }>;

  if (serverEntry.endsWith('.cjs')) {
    const mod = require(serverEntry) as {
      startServer: typeof startServer;
    };
    startServer = mod.startServer;
  } else {
    const mod = (await import(pathToFileURL(serverEntry).href)) as {
      startServer: typeof startServer;
    };
    startServer = mod.startServer;
  }

  const started = await startServer({
    host: '127.0.0.1',
    port,
    dataDir,
    webDistPath: webDist,
    quiet: true,
  });

  serverClose = started.close;
  await waitForHealth(started.url);
  return started.url;
}

function loadIcon(): NativeImage {
  const { iconPath, iconIcoPath } = resolvePaths();
  if (process.platform === 'win32' && fs.existsSync(iconIcoPath)) {
    const ico = nativeImage.createFromPath(iconIcoPath);
    if (!ico.isEmpty()) return ico;
  }
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  return nativeImage.createEmpty();
}

function loadTrayIcon(fallback: NativeImage): NativeImage {
  const { trayIconPath, iconIcoPath, iconPath } = resolvePaths();
  const candidates = [trayIconPath, iconIcoPath, iconPath];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const img = nativeImage.createFromPath(candidate);
    if (img.isEmpty()) continue;
    const size = img.getSize();
    if (size.width > 32 || size.height > 32) {
      return img.resize({ width: 16, height: 16, quality: 'better' });
    }
    return img;
  }
  if (!fallback.isEmpty()) {
    return fallback.resize({ width: 16, height: 16, quality: 'better' });
  }
  return nativeImage.createEmpty();
}

function schedulePersistBounds() {
  const { dataDir } = resolvePaths();
  if (boundsTimer) clearTimeout(boundsTimer);
  boundsTimer = setTimeout(() => {
    if (mainWindow) persistWindowBounds(dataDir, mainWindow);
  }, 400);
}

function applyWindowLayer(win: BrowserWindow = mainWindow!) {
  if (!win || win.isDestroyed()) return;
  if (shellPrefs.alwaysOnTop) {
    detachFromDesktop(win);
    win.setAlwaysOnTop(true, 'floating');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  } else {
    win.setAlwaysOnTop(false);
    win.setVisibleOnAllWorkspaces(false);
    pinToDesktop(win);
  }
}

function scheduleApplyLayer(win: BrowserWindow) {
  if (layerTimer) clearTimeout(layerTimer);
  layerTimer = setTimeout(() => applyWindowLayer(win), 80);
}

function setAlwaysOnTopPref(enabled: boolean) {
  shellPrefs = { ...shellPrefs, alwaysOnTop: enabled, v: 2 };
  const { dataDir } = resolvePaths();
  saveShellPrefs(dataDir, shellPrefs);
  if (mainWindow && !mainWindow.isDestroyed()) {
    applyWindowLayer(mainWindow);
    if (mainWindow.isVisible()) mainWindow.showInactive();
  }
}

function applyLock(next: boolean) {
  locked = next;
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (locked) {
      try {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
      } catch {
        try {
          mainWindow.setIgnoreMouseEvents(true);
        } catch {
          console.warn('[PulseDeck] click-through lock unsupported on this session');
        }
      }
      mainWindow.setResizable(false);
    } else {
      mainWindow.setIgnoreMouseEvents(false);
      mainWindow.setResizable(true);
    }
    mainWindow.webContents.send('pulsedeck:locked-changed', locked);
  }
}

function showBoard() {
  if (!mainWindow) return;
  mainWindow.showInactive();
  applyWindowLayer(mainWindow);
}

function hideBoard() {
  mainWindow?.hide();
}

function toggleBoard() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) hideBoard();
  else showBoard();
}

function resetBoardCorner(
  corner: Corner = 'top-right',
  size: 'compact' | 'medium' | 'wide' = 'compact',
) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const display = screen.getDisplayMatching(mainWindow.getBounds()) || screen.getPrimaryDisplay();
  const wa = display.workArea;
  const width =
    size === 'wide'
      ? Math.min(1100, wa.width - 40)
      : size === 'medium'
        ? Math.min(900, wa.width - 40)
        : Math.min(720, wa.width - 40);
  const height =
    size === 'wide'
      ? Math.min(700, wa.height - 40)
      : size === 'medium'
        ? Math.min(600, wa.height - 40)
        : Math.min(520, wa.height - 40);
  const margin = 24;
  const x =
    corner === 'top-left' || corner === 'bottom-left'
      ? wa.x + margin
      : wa.x + wa.width - width - margin;
  const y =
    corner === 'top-left' || corner === 'top-right'
      ? wa.y + margin
      : wa.y + wa.height - height - margin;
  mainWindow.setBounds({ x, y, width, height });
  showBoard();
  schedulePersistBounds();
}

function isAutostartEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}

function setAutostart(enabled: boolean) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true,
    path: process.execPath,
    args: app.isPackaged ? [] : [path.resolve(__dirname, '../../..')],
  });
}

function openEditLayout() {
  if (!mainWindow) return;
  if (locked) applyLock(false);
  showBoard();
  mainWindow.webContents.send('pulsedeck:edit-layout');
}

function openSettingsPanel() {
  if (!mainWindow) return;
  if (locked) applyLock(false);
  showBoard();
  mainWindow.webContents.send('pulsedeck:open-settings');
}

function buildTrayMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: mainWindow?.isVisible() ? 'Hide board' : 'Show board',
      click: () => toggleBoard(),
    },
    { type: 'separator' },
    {
      label: process.platform === 'linux' ? 'Behind windows' : 'Pinned to desktop',
      type: 'checkbox',
      checked: !shellPrefs.alwaysOnTop,
      toolTip:
        process.platform === 'linux'
          ? 'Keep the board under other windows (best-effort on Linux).'
          : 'Stay on the wallpaper (home screen). Apps cover the board when over it.',
      click: (item) => setAlwaysOnTopPref(!item.checked),
    },
    {
      label: 'Float over apps',
      type: 'checkbox',
      checked: shellPrefs.alwaysOnTop,
      toolTip: 'Keep the board above other windows.',
      click: (item) => setAlwaysOnTopPref(item.checked),
    },
    {
      label: 'Reset position',
      submenu: [
        { label: 'Top right', click: () => resetBoardCorner('top-right') },
        { label: 'Top left', click: () => resetBoardCorner('top-left') },
        { label: 'Bottom right', click: () => resetBoardCorner('bottom-right') },
        { label: 'Bottom left', click: () => resetBoardCorner('bottom-left') },
      ],
    },
    {
      label: 'Customize…',
      click: () => openSettingsPanel(),
    },
    {
      label: 'Edit layout',
      click: () => openEditLayout(),
    },
    {
      label: 'Add widget',
      click: () => {
        if (!mainWindow) return;
        if (locked) applyLock(false);
        showBoard();
        mainWindow.webContents.send('pulsedeck:add-widget');
      },
    },
    {
      label: locked ? 'Unlock board' : 'Lock board (click-through)',
      click: () => applyLock(!locked),
    },
    { type: 'separator' },
    {
      label: 'Launch at startup',
      type: 'checkbox',
      checked: isAutostartEnabled(),
      click: (item) => setAutostart(item.checked),
    },
    {
      label: 'Open in browser',
      click: () => {
        if (serverBaseUrl) void shell.openExternal(serverBaseUrl);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit PulseDeck',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ];
  return Menu.buildFromTemplate(template);
}

function popupTrayMenu(bounds?: Rectangle) {
  if (!tray) return;
  // Keep board visible while using tray / overflow (^) — never hide on tray interaction
  showBoard();
  const menu = buildTrayMenu();
  if (bounds) tray.popUpContextMenu(menu, bounds);
  else tray.popUpContextMenu(menu);
  // Re-assert desktop pin after the menu closes / taskbar focus shuffle
  if (mainWindow) scheduleApplyLayer(mainWindow);
}

function createTray(icon: NativeImage): boolean {
  try {
    const trayIcon = loadTrayIcon(icon);
    tray = new Tray(trayIcon.isEmpty() ? icon : trayIcon);
    tray.setToolTip('PulseDeck — click for menu');
    tray.setContextMenu(buildTrayMenu());

    tray.on('right-click', (_event, bounds) => {
      popupTrayMenu(bounds);
    });
    tray.on('click', (_event, bounds) => {
      popupTrayMenu(bounds);
    });
    tray.on('double-click', () => {
      showBoard();
    });
    return true;
  } catch (err) {
    console.warn('[PulseDeck] tray unavailable — showing taskbar entry', err);
    tray = null;
    return false;
  }
}

function createWindow(url: string, icon: NativeImage) {
  const { dataDir, preload } = resolvePaths();
  const saved = loadBounds(dataDir);
  const primary = screen.getPrimaryDisplay().workArea;
  const width = Math.min(720, primary.width - 40);
  const height = Math.min(520, primary.height - 40);
  const defaults = {
    x: primary.x + primary.width - width - 24,
    y: primary.y + 24,
    width,
    height,
  };
  const bounds =
    saved && saved.width <= 900 && saved.height <= 700 ? clampBoundsToDisplays(saved) : defaults;

  // Prefer opaque by default — transparent HWND + DWM layering is a major CPU cost on Windows.
  // Set PULSEDECK_TRANSPARENT=1 to restore see-through board chrome.
  const transparent =
    process.env.PULSEDECK_TRANSPARENT === '1' || process.env.PULSEDECK_OPAQUE === '0';
  const opaque = !transparent;
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 360,
    minHeight: 280,
    show: false,
    frame: false,
    transparent: !opaque,
    backgroundColor: opaque ? '#0f1117' : '#00000000',
    hasShadow: false,
    skipTaskbar: true,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: shellPrefs.alwaysOnTop,
    title: 'PulseDeck',
    icon: icon.isEmpty() ? undefined : icon,
    autoHideMenuBar: true,
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: true,
      spellcheck: false,
      v8CacheOptions: 'none',
    },
  });

  // Drop Chromium HTTP cache — PulseDeck is local API only
  void mainWindow.webContents.session.clearCache();

  const widgetUrl = `${url}${url.includes('?') ? '&' : '?'}shell=widget`;
  void mainWindow.loadURL(widgetUrl);

  mainWindow.once('ready-to-show', () => {
    showBoard();
  });

  mainWindow.on('show', () => {
    if (mainWindow) scheduleApplyLayer(mainWindow);
  });

  // Do NOT re-pin on every blur — that was sinking HWND_BOTTOM under wallpaper on tray clicks.
  // Re-pin on display changes / explicit show / tray menu instead.

  mainWindow.on('move', schedulePersistBounds);
  mainWindow.on('resize', schedulePersistBounds);

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    void shell.openExternal(target);
    return { action: 'deny' };
  });
}

function registerIpc() {
  ipcMain.handle('pulsedeck:get-locked', () => locked);
  ipcMain.handle('pulsedeck:set-locked', (_e, next: boolean) => {
    applyLock(Boolean(next));
    return locked;
  });
  ipcMain.handle('pulsedeck:get-always-on-top', () => shellPrefs.alwaysOnTop);
  ipcMain.handle('pulsedeck:set-always-on-top', (_e, next: boolean) => {
    setAlwaysOnTopPref(Boolean(next));
    return shellPrefs.alwaysOnTop;
  });
  ipcMain.handle(
    'pulsedeck:reset-corner',
    (_e, corner?: Corner, size?: 'compact' | 'medium' | 'wide') => {
      resetBoardCorner(corner || 'top-right', size || 'compact');
      return true;
    },
  );
  ipcMain.handle('pulsedeck:list-displays', () =>
    screen.getAllDisplays().map((d) => ({
      id: d.id,
      label: d.label || `Display ${d.id}`,
      bounds: d.bounds,
      workArea: d.workArea,
      primary: d.id === screen.getPrimaryDisplay().id,
    })),
  );
  ipcMain.on('pulsedeck:toggle-edit', () => openEditLayout());
  ipcMain.on('pulsedeck:open-settings', () => openSettingsPanel());

  ipcMain.handle('pulsedeck:get-media', () => getMedia());
  ipcMain.handle('pulsedeck:get-clipboard-history', () => getClipboardHistory());
  ipcMain.handle('pulsedeck:get-foreground-app', async () => {
    const fg = await getForegroundApp();
    return fg?.title || fg?.name || null;
  });
  ipcMain.handle(
    'pulsedeck:open-target',
    async (_e, payload: { kind?: string; target?: string }) => {
      const kind = payload?.kind === 'app' ? 'app' : 'url';
      return openTarget(kind, String(payload?.target || ''));
    },
  );
  ipcMain.handle('pulsedeck:pick-app', async () => pickApp(mainWindow));
  ipcMain.handle('pulsedeck:launcher-presets', () => {
    return launcherAppPresets().map((p) => {
      const resolved = resolvePresetPath(p);
      const exists = Boolean(resolved && fs.existsSync(resolved));
      return {
        id: p.id,
        title: p.title,
        path: resolved,
        exists,
      };
    });
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showBoard();
  });

  app.whenReady().then(async () => {
    try {
      const { dataDir } = resolvePaths();
      shellPrefs = loadShellPrefs(dataDir);
      pinToDesktop = createDesktopPinner();
      detachFromDesktop = createDesktopDetacher();
      registerIpc();
      const icon = loadIcon();
      serverBaseUrl = await bootServer();
      const trayOk = createTray(icon);
      createWindow(serverBaseUrl, icon);
      if (!trayOk && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setSkipTaskbar(false);
      }

      screen.on('display-metrics-changed', () => {
        if (mainWindow && mainWindow.isVisible()) scheduleApplyLayer(mainWindow);
      });

      const okP = globalShortcut.register('CommandOrControl+Alt+P', () => toggleBoard());
      const okE = globalShortcut.register('CommandOrControl+Alt+E', () => openEditLayout());
      const okL = globalShortcut.register('CommandOrControl+Alt+L', () => applyLock(!locked));
      if (!okP) console.warn('[PulseDeck] failed to register Ctrl+Alt+P');
      if (!okE) console.warn('[PulseDeck] failed to register Ctrl+Alt+E');
      if (!okL) console.warn('[PulseDeck] failed to register Ctrl+Alt+L');
    } catch (err) {
      console.error(err);
      dialog.showErrorBox(
        'PulseDeck failed to start',
        err instanceof Error ? err.message : String(err),
      );
      isQuitting = true;
      app.quit();
    }
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Keep running in tray on Windows
});

app.on('will-quit', (event) => {
  if (serverClose) {
    event.preventDefault();
    const close = serverClose;
    serverClose = null;
    void close()
      .catch(() => undefined)
      .finally(() => {
        app.exit(0);
      });
  }
});
