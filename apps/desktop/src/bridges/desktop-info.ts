import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { clipboard } from 'electron';

const execFileAsync = promisify(execFile);

export type MediaInfo = {
  title?: string;
  artist?: string;
  album?: string;
  playing?: boolean;
} | null;

export async function getMedia(): Promise<MediaInfo> {
  if (process.platform === 'linux') {
    try {
      const { stdout } = await execFileAsync(
        'playerctl',
        ['metadata', '--format', '{{status}}|{{artist}}|{{title}}|{{album}}'],
        { timeout: 2500 },
      );
      const [status, artist, title, album] = stdout.trim().split('|');
      if (!title && !artist) return null;
      return {
        title: title || undefined,
        artist: artist || undefined,
        album: album || undefined,
        playing: /playing/i.test(status || ''),
      };
    } catch {
      return null;
    }
  }

  if (process.platform === 'win32') {
    // Best-effort: no SMTC dependency — return null rather than crash
    return null;
  }

  return null;
}

const CLIP_MAX = 12;
let clipHistory: string[] = [];
let lastClip = '';

export function pollClipboard(): string[] {
  try {
    const text = clipboard.readText().trim().slice(0, 2000);
    if (text && text !== lastClip) {
      lastClip = text;
      clipHistory = [text, ...clipHistory.filter((t) => t !== text)].slice(0, CLIP_MAX);
    }
  } catch {
    // ignore
  }
  return clipHistory;
}

export function getClipboardHistory(): string[] {
  pollClipboard();
  return clipHistory;
}

export type ForegroundApp = { name: string; title?: string } | null;

type FgFns = {
  GetForegroundWindow: () => unknown;
  GetWindowTextW: (h: unknown, buf: Buffer, n: number) => number;
};
let winFg: FgFns | null | undefined;

function loadWinForeground(): FgFns | null {
  if (winFg !== undefined) return winFg;
  try {
    const koffi = require('koffi') as typeof import('koffi');
    const user32 = koffi.load('user32.dll');
    winFg = {
      GetForegroundWindow: user32.func('GetForegroundWindow', 'void *', []),
      GetWindowTextW: user32.func('int __stdcall GetWindowTextW(void *h, uint16 *s, int n)'),
    };
  } catch {
    winFg = null;
  }
  return winFg;
}

export async function getForegroundApp(): Promise<ForegroundApp> {
  if (process.platform === 'linux') {
    // Hyprland
    try {
      const { stdout } = await execFileAsync('hyprctl', ['activewindow', '-j'], { timeout: 2000 });
      const j = JSON.parse(stdout) as { class?: string; title?: string };
      if (j.class || j.title) return { name: j.class || 'app', title: j.title };
    } catch {
      // try xdotool
    }
    try {
      const { stdout: idOut } = await execFileAsync('xdotool', ['getactivewindow'], {
        timeout: 2000,
      });
      const id = idOut.trim();
      if (!id) return null;
      const { stdout: nameOut } = await execFileAsync('xdotool', ['getwindowname', id], {
        timeout: 2000,
      });
      const title = nameOut.trim();
      return title ? { name: title, title } : null;
    } catch {
      return null;
    }
  }

  if (process.platform === 'win32') {
    try {
      const fg = loadWinForeground();
      if (fg) {
        const hwnd = fg.GetForegroundWindow();
        if (!hwnd) return null;
        const buf = Buffer.alloc(512 * 2);
        const n = fg.GetWindowTextW(hwnd, buf, 512);
        if (!n) return null;
        const title = buf.toString('utf16le', 0, Math.min(n, 512) * 2).replace(/\0+$/, '');
        return title ? { name: title, title } : null;
      }
      const { stdout } = await execFileAsync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          '(Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle } | Sort-Object { -$_.WorkingSet64 } | Select-Object -First 1).MainWindowTitle',
        ],
        { timeout: 2500, windowsHide: true },
      );
      const title = stdout.trim();
      return title ? { name: title, title } : null;
    } catch {
      return null;
    }
  }

  return null;
}
