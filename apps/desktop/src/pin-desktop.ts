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
 * Send the window to the bottom of the z-order (above wallpaper, below apps).
 * Uses Win32 SetWindowPos via koffi. Falls back to a no-op if unavailable.
 */
export function createDesktopPinner(): PinFn {
  const koffi = loadKoffi();
  if (!koffi) {
    return () => undefined;
  }

  try {
    const user32 = koffi.load('user32.dll');
    const SetWindowPos = user32.func(
      'bool __stdcall SetWindowPos(void *hWnd, void *hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags)',
    );

    const HWND_BOTTOM = 1;
    const SWP_NOSIZE = 0x0001;
    const SWP_NOMOVE = 0x0002;
    const SWP_NOACTIVATE = 0x0010;
    const flags = SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE;

    return (win: BrowserWindow) => {
      try {
        if (win.isDestroyed()) return;
        const hwnd = win.getNativeWindowHandle();
        SetWindowPos(hwnd, HWND_BOTTOM, 0, 0, 0, 0, flags);
      } catch (err) {
        console.warn('[PulseDeck] pin to desktop failed', err);
      }
    };
  } catch (err) {
    console.warn('[PulseDeck] koffi setup failed — desktop pin disabled', err);
    return () => undefined;
  }
}
