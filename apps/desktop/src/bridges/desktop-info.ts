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

const CLIP_MAX = 20;
let clipHistory: string[] = [];
let lastClip = '';

export function pollClipboard(): string[] {
  try {
    const text = clipboard.readText().trim();
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
      const { stdout } = await execFileAsync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `(Add-Type @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Fg {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  public static string Title() {
    var sb = new StringBuilder(512);
    GetWindowText(GetForegroundWindow(), sb, sb.Capacity);
    return sb.ToString();
  }
}
'@ -PassThru | Out-Null; [Fg]::Title())`,
        ],
        { timeout: 4000, windowsHide: true },
      );
      const title = stdout.trim();
      return title ? { name: title, title } : null;
    } catch {
      return null;
    }
  }

  return null;
}
