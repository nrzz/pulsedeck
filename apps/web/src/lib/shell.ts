export interface PulseDeckBridge {
  isWidgetMode: true;
  getLocked: () => Promise<boolean>;
  setLocked: (locked: boolean) => Promise<boolean>;
  onLockedChanged: (cb: (locked: boolean) => void) => () => void;
  onEditLayout: (cb: () => void) => () => void;
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
