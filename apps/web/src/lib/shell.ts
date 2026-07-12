export interface PulseDeckBridge {
  isWidgetMode: true;
  getLocked: () => Promise<boolean>;
  setLocked: (locked: boolean) => Promise<boolean>;
  getAlwaysOnTop?: () => Promise<boolean>;
  setAlwaysOnTop?: (v: boolean) => Promise<boolean>;
  resetCorner?: (
    corner?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
    size?: 'compact' | 'medium' | 'wide',
  ) => Promise<boolean>;
  listDisplays?: () => Promise<unknown[]>;
  getMedia?: () => Promise<{
    title?: string;
    artist?: string;
    album?: string;
    playing?: boolean;
  } | null>;
  getClipboardHistory?: () => Promise<string[]>;
  getForegroundApp?: () => Promise<string | null>;
  openTarget?: (opts: {
    kind: 'url' | 'app';
    target: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  pickApp?: () => Promise<string | null>;
  launcherPresets?: () => Promise<
    { id: string; title: string; path: string | null; exists: boolean }[]
  >;
  onLockedChanged: (cb: (locked: boolean) => void) => () => void;
  onEditLayout: (cb: () => void) => () => void;
  onOpenSettings?: (cb: () => void) => () => void;
  onAddWidget?: (cb: () => void) => () => void;
  toggleEdit: () => void;
  openSettings: () => void;
}

declare global {
  interface Window {
    pulsedeck?: PulseDeckBridge;
  }
}

export function isWidgetShell(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.pulsedeck?.isWidgetMode) return true;
  try {
    return new URLSearchParams(window.location.search).get('shell') === 'widget';
  } catch {
    return false;
  }
}
