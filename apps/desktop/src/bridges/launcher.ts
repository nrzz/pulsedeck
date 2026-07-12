import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { dialog, shell, type BrowserWindow } from 'electron';

export type LaunchKind = 'url' | 'app';

export type OpenTargetResult = { ok: true } | { ok: false; error: string };

function expandEnv(p: string): string {
  return p
    .replace(/%([^%]+)%/g, (_, name: string) => process.env[name] || `%${name}%`)
    .replace(/^~(?=$|[/\\])/, os.homedir());
}

function looksLikeUrl(target: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(target);
}

function isHttp(target: string): boolean {
  return /^https?:\/\//i.test(target);
}

export async function openTarget(kind: LaunchKind, targetRaw: string): Promise<OpenTargetResult> {
  const target = expandEnv(targetRaw.trim().replace(/^["']|["']$/g, ''));
  if (!target) return { ok: false, error: 'Empty target' };

  // Any URL-like scheme (http, cursor://, vscode://) goes through openExternal
  if (kind === 'url' || isHttp(target) || (looksLikeUrl(target) && !path.isAbsolute(target))) {
    try {
      await shell.openExternal(target);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // App path must be absolute
  if (!path.isAbsolute(target) && !looksLikeUrl(target)) {
    return { ok: false, error: 'App path must be absolute' };
  }

  if (looksLikeUrl(target)) {
    try {
      await shell.openExternal(target);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  if (!fs.existsSync(target)) {
    return { ok: false, error: 'File not found' };
  }

  const errMsg = await shell.openPath(target);
  if (errMsg) return { ok: false, error: errMsg };
  return { ok: true };
}

export async function pickApp(parent?: BrowserWindow | null): Promise<string | null> {
  const filters =
    process.platform === 'win32'
      ? [
          { name: 'Applications', extensions: ['exe', 'lnk', 'bat', 'cmd'] },
          { name: 'All files', extensions: ['*'] },
        ]
      : [
          { name: 'Desktop entries', extensions: ['desktop'] },
          { name: 'All files', extensions: ['*'] },
        ];

  const opts = {
    title: 'Pick application',
    properties: ['openFile' as const],
    filters,
  };
  const result = parent
    ? await dialog.showOpenDialog(parent, opts)
    : await dialog.showOpenDialog(opts);
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
}

export type AppPreset = { id: string; title: string; candidates: string[] };

export function launcherAppPresets(): AppPreset[] {
  const home = os.homedir();
  const local = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  if (process.platform === 'win32') {
    return [
      {
        id: 'cursor',
        title: 'Cursor',
        candidates: [
          path.join(local, 'Programs', 'cursor', 'Cursor.exe'),
          path.join(local, 'Programs', 'Cursor', 'Cursor.exe'),
          path.join(pf, 'cursor', 'Cursor.exe'),
        ],
      },
      {
        id: 'chrome',
        title: 'Chrome',
        candidates: [
          path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        ],
      },
      {
        id: 'edge',
        title: 'Edge',
        candidates: [
          path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        ],
      },
      {
        id: 'firefox',
        title: 'Firefox',
        candidates: [
          path.join(pf, 'Mozilla Firefox', 'firefox.exe'),
          path.join(pf86, 'Mozilla Firefox', 'firefox.exe'),
        ],
      },
      {
        id: 'code',
        title: 'VS Code',
        candidates: [
          path.join(local, 'Programs', 'Microsoft VS Code', 'Code.exe'),
          path.join(pf, 'Microsoft VS Code', 'Code.exe'),
        ],
      },
      {
        id: 'explorer',
        title: 'Explorer',
        candidates: [path.join(process.env.SystemRoot || 'C:\\Windows', 'explorer.exe')],
      },
      {
        id: 'terminal',
        title: 'Terminal',
        candidates: [
          path.join(local, 'Microsoft', 'WindowsApps', 'wt.exe'),
          path.join(pf, 'Windows Terminal', 'wt.exe'),
        ],
      },
      {
        id: 'notepad',
        title: 'Notepad',
        candidates: [path.join(process.env.SystemRoot || 'C:\\Windows', 'notepad.exe')],
      },
    ];
  }

  if (process.platform === 'linux') {
    return [
      {
        id: 'cursor',
        title: 'Cursor',
        candidates: [
          path.join(home, '.local', 'bin', 'cursor'),
          '/usr/bin/cursor',
          '/opt/Cursor/cursor',
        ],
      },
      {
        id: 'chrome',
        title: 'Chrome',
        candidates: [
          '/usr/bin/google-chrome-stable',
          '/usr/bin/google-chrome',
          '/usr/bin/chromium',
        ],
      },
      {
        id: 'firefox',
        title: 'Firefox',
        candidates: ['/usr/bin/firefox'],
      },
      {
        id: 'code',
        title: 'VS Code',
        candidates: ['/usr/bin/code', '/usr/share/code/bin/code'],
      },
      {
        id: 'files',
        title: 'Files',
        candidates: ['/usr/bin/nautilus', '/usr/bin/dolphin', '/usr/bin/thunar', '/usr/bin/nemo'],
      },
      {
        id: 'terminal',
        title: 'Terminal',
        candidates: [
          '/usr/bin/gnome-terminal',
          '/usr/bin/konsole',
          '/usr/bin/x-terminal-emulator',
          '/usr/bin/alacritty',
        ],
      },
    ];
  }

  return [];
}

export function resolvePresetPath(preset: AppPreset): string | null {
  for (const c of preset.candidates) {
    const p = expandEnv(c);
    if (fs.existsSync(p)) return p;
  }
  return preset.candidates[0] ? expandEnv(preset.candidates[0]) : null;
}
