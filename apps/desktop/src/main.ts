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
import { createDesktopPinner } from './pin-desktop';
import { clampBoundsToDisplays, loadBounds, persistWindowBounds } from './bounds';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverClose: (() => Promise<void>) | null = null;
let isQuitting = false;
let locked = false;
let serverBaseUrl = '';
let pinToDesktop: (win: BrowserWindow) => void = () => undefined;
let boundsTimer: ReturnType<typeof setTimeout> | null = null;

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
      preload: path.join(__dirname, 'preload.js'),
    };
  }
  return {
    webDist: path.resolve(__dirname, '../../web/dist'),
    serverEntry: path.resolve(__dirname, '../../server/dist/server.js'),
    dataDir: app.getPath('userData'),
    iconPath: path.resolve(__dirname, '../resources/icon.png'),
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

function loadIcon(): Electron.NativeImage {
  const { iconPath } = resolvePaths();
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
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

function applyLock(next: boolean) {
  locked = next;
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (locked) {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
      mainWindow.setResizable(false);
    } else {
      mainWindow.setIgnoreMouseEvents(false);
      mainWindow.setResizable(true);
    }
    mainWindow.webContents.send('pulsedeck:locked-changed', locked);
  }
  rebuildTrayMenu();
}

function showBoard() {
  if (!mainWindow) return;
  mainWindow.showInactive();
  pinToDesktop(mainWindow);
}

function hideBoard() {
  mainWindow?.hide();
}

function toggleBoard() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) hideBoard();
  else showBoard();
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
  rebuildTrayMenu();
}

function rebuildTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: mainWindow?.isVisible() ? 'Hide board' : 'Show board',
        click: () => toggleBoard(),
      },
      {
        label: 'Edit layout',
        click: () => {
          if (!mainWindow) return;
          if (locked) applyLock(false);
          showBoard();
          mainWindow.webContents.send('pulsedeck:edit-layout');
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
    ]),
  );
}

function createTray(icon: Electron.NativeImage) {
  const trayIcon = icon.isEmpty()
    ? nativeImage.createEmpty()
    : icon.resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);
  tray.setToolTip('PulseDeck');
  rebuildTrayMenu();
  tray.on('double-click', () => toggleBoard());
  tray.on('click', () => toggleBoard());
}

function createWindow(url: string, icon: Electron.NativeImage) {
  const { dataDir, preload } = resolvePaths();
  const saved = loadBounds(dataDir);
  const primary = screen.getPrimaryDisplay().workArea;
  const width = Math.min(720, primary.width - 40);
  const height = Math.min(520, primary.height - 40);
  const defaults = {
    // Top-right corner — classic widget placement
    x: primary.x + primary.width - width - 24,
    y: primary.y + 24,
    width,
    height,
  };
  // Prefer fresh compact defaults over a legacy giant dashboard window
  const bounds =
    saved && saved.width <= 900 && saved.height <= 700 ? clampBoundsToDisplays(saved) : defaults;

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 360,
    minHeight: 280,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    skipTaskbar: true,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    title: 'PulseDeck',
    icon: icon.isEmpty() ? undefined : icon,
    autoHideMenuBar: true,
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // No acrylic — it paints an opaque slab. Pure transparency so wallpaper shows between cards.

  const widgetUrl = `${url}${url.includes('?') ? '&' : '?'}shell=widget`;
  void mainWindow.loadURL(widgetUrl);

  mainWindow.once('ready-to-show', () => {
    showBoard();
  });

  mainWindow.on('show', () => {
    if (mainWindow) pinToDesktop(mainWindow);
    rebuildTrayMenu();
  });

  mainWindow.on('hide', () => rebuildTrayMenu());

  mainWindow.on('focus', () => {
    // Re-pin so the board stays under other apps after accidental focus
    if (mainWindow) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) pinToDesktop(mainWindow);
      }, 50);
    }
  });

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
      pinToDesktop = createDesktopPinner();
      registerIpc();
      const icon = loadIcon();
      serverBaseUrl = await bootServer();
      createTray(icon);
      createWindow(serverBaseUrl, icon);

      const ok = globalShortcut.register('CommandOrControl+Alt+P', () => toggleBoard());
      if (!ok) console.warn('[PulseDeck] failed to register Ctrl+Alt+P');
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
