import path from 'node:path';
import { createRequire } from 'node:module';
import type { BrowserWindow } from 'electron';

type PinFn = (win: BrowserWindow) => void;

function loadKoffi(): typeof import('koffi') | null {
  try {
    return require('koffi') as typeof import('koffi');
  } catch {
    try {
      const koffiRoot = path.join(process.resourcesPath, 'koffi');
      const req = createRequire(path.join(koffiRoot, 'package.json'));
      return req('.') as typeof import('koffi');
    } catch (err) {
      console.warn('[PulseDeck] koffi unavailable — desktop pin disabled', err);
      return null;
    }
  }
}

/**
 * Attach the window to the Windows desktop wallpaper layer (WorkerW),
 * so it stays on the home screen and does NOT sink under the wallpaper
 * when the tray / taskbar is clicked (HWND_BOTTOM-only bug).
 */
export function createDesktopPinner(): PinFn {
  const koffi = loadKoffi();
  if (!koffi || process.platform !== 'win32') {
    return () => undefined;
  }

  try {
    const user32 = koffi.load('user32.dll');

    const FindWindowW = user32.func('void * __stdcall FindWindowW(str16 lpClassName, str16 lpWindowName)');
    const FindWindowExW = user32.func(
      'void * __stdcall FindWindowExW(void *hWndParent, void *hWndChildAfter, str16 lpszClass, str16 lpszWindow)',
    );
    const SendMessageTimeoutW = user32.func(
      'void * __stdcall SendMessageTimeoutW(void *hWnd, uint Msg, size_t wParam, size_t lParam, uint fuFlags, uint uTimeout, void *lpdwResult)',
    );
    const SetParent = user32.func('void * __stdcall SetParent(void *hWndChild, void *hWndNewParent)');
    const SetWindowPos = user32.func(
      'bool __stdcall SetWindowPos(void *hWnd, void *hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags)',
    );

    const SWP_NOSIZE = 0x0001;
    const SWP_NOMOVE = 0x0002;
    const SWP_NOACTIVATE = 0x0010;
    const SWP_SHOWWINDOW = 0x0040;
    const SMTO_NORMAL = 0;
    const HWND_BOTTOM = 1;

    let cachedWorkerW: unknown = null;

    function findWorkerW(): unknown {
      if (cachedWorkerW) return cachedWorkerW;

      const progman = FindWindowW('Progman', null as unknown as string);
      if (!progman) return null;

      // Spawn / refresh WorkerW that draws the wallpaper
      try {
        SendMessageTimeoutW(progman, 0x052c, 0, 0, SMTO_NORMAL, 1000, null);
      } catch {
        // continue — WorkerW may already exist
      }

      // Classic layout: Progman → SHELLDLL_DefView, then next top-level WorkerW is wallpaper
      const defView = FindWindowExW(progman, null, 'SHELLDLL_DefView', null as unknown as string);
      if (defView) {
        const worker = FindWindowExW(null, progman, 'WorkerW', null as unknown as string);
        if (worker) {
          cachedWorkerW = worker;
          return worker;
        }
      }

      // Alternate: walk top-level WorkerW children looking for DefView
      let worker: unknown = FindWindowExW(null, null, 'WorkerW', null as unknown as string);
      while (worker) {
        const view = FindWindowExW(worker, null, 'SHELLDLL_DefView', null as unknown as string);
        if (view) {
          // Wallpaper WorkerW is typically the *next* WorkerW after the one with DefView
          const next = FindWindowExW(null, worker, 'WorkerW', null as unknown as string);
          cachedWorkerW = next || worker;
          return cachedWorkerW;
        }
        worker = FindWindowExW(null, worker, 'WorkerW', null as unknown as string);
      }

      return null;
    }

    return (win: BrowserWindow) => {
      try {
        if (win.isDestroyed()) return;
        const hwnd = win.getNativeWindowHandle();
        const worker = findWorkerW();
        if (worker) {
          SetParent(hwnd, worker);
          SetWindowPos(
            hwnd,
            HWND_BOTTOM,
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_SHOWWINDOW,
          );
          return;
        }
        SetParent(hwnd, null);
        SetWindowPos(hwnd, HWND_BOTTOM, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
      } catch (err) {
        console.warn('[PulseDeck] pin to desktop failed', err);
      }
    };
  } catch (err) {
    console.warn('[PulseDeck] koffi setup failed — desktop pin disabled', err);
    return () => undefined;
  }
}

/** Detach from WorkerW before enabling always-on-top float mode. */
export function createDesktopDetacher(): PinFn {
  const koffi = loadKoffi();
  if (!koffi || process.platform !== 'win32') {
    return () => undefined;
  }
  try {
    const user32 = koffi.load('user32.dll');
    const SetParent = user32.func('void * __stdcall SetParent(void *hWndChild, void *hWndNewParent)');
    return (win: BrowserWindow) => {
      try {
        if (win.isDestroyed()) return;
        SetParent(win.getNativeWindowHandle(), null);
      } catch {
        // ignore
      }
    };
  } catch {
    return () => undefined;
  }
}
