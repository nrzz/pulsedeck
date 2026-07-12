import fs from 'node:fs';
import path from 'node:path';

export interface ShellPrefs {
  /**
   * false (default) = pinned to desktop wallpaper layer (behind other apps).
   * true = float over apps.
   */
  alwaysOnTop: boolean;
  /** Prefs schema version — used to migrate bad defaults. */
  v?: number;
}

const PREFS_VERSION = 2;

const DEFAULTS: ShellPrefs = {
  alwaysOnTop: false,
  v: PREFS_VERSION,
};

function prefsPath(userData: string): string {
  return path.join(userData, 'shell-prefs.json');
}

export function loadShellPrefs(userData: string): ShellPrefs {
  try {
    const raw = fs.readFileSync(prefsPath(userData), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<ShellPrefs>;
    // v1 defaulted to alwaysOnTop=true (wrong for desktop widgets) — reset once
    if (parsed.v !== PREFS_VERSION) {
      const migrated: ShellPrefs = {
        alwaysOnTop: false,
        v: PREFS_VERSION,
      };
      saveShellPrefs(userData, migrated);
      return migrated;
    }
    return {
      alwaysOnTop: typeof parsed.alwaysOnTop === 'boolean' ? parsed.alwaysOnTop : DEFAULTS.alwaysOnTop,
      v: PREFS_VERSION,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveShellPrefs(userData: string, prefs: ShellPrefs): void {
  try {
    fs.mkdirSync(userData, { recursive: true });
    fs.writeFileSync(
      prefsPath(userData),
      JSON.stringify({ ...prefs, v: PREFS_VERSION }, null, 2),
      'utf-8',
    );
  } catch (err) {
    console.warn('[PulseDeck] failed to save shell prefs', err);
  }
}
