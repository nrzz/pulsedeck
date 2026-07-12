import { contextBridge, ipcRenderer } from 'electron';

export interface PulseDeckBridge {
  isWidgetMode: true;
  getLocked: () => Promise<boolean>;
  setLocked: (locked: boolean) => Promise<boolean>;
  getAlwaysOnTop: () => Promise<boolean>;
  setAlwaysOnTop: (v: boolean) => Promise<boolean>;
  resetCorner: (
    corner?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
    size?: 'compact' | 'medium' | 'wide',
  ) => Promise<boolean>;
  listDisplays: () => Promise<
    { id: number; label: string; primary: boolean; bounds: object; workArea: object }[]
  >;
  onLockedChanged: (cb: (locked: boolean) => void) => () => void;
  onEditLayout: (cb: () => void) => () => void;
  onOpenSettings: (cb: () => void) => () => void;
  onAddWidget: (cb: () => void) => () => void;
  toggleEdit: () => void;
  openSettings: () => void;
}

const bridge: PulseDeckBridge = {
  isWidgetMode: true,
  getLocked: () => ipcRenderer.invoke('pulsedeck:get-locked') as Promise<boolean>,
  setLocked: (locked: boolean) =>
    ipcRenderer.invoke('pulsedeck:set-locked', locked) as Promise<boolean>,
  getAlwaysOnTop: () => ipcRenderer.invoke('pulsedeck:get-always-on-top') as Promise<boolean>,
  setAlwaysOnTop: (v: boolean) =>
    ipcRenderer.invoke('pulsedeck:set-always-on-top', v) as Promise<boolean>,
  resetCorner: (corner, size) =>
    ipcRenderer.invoke('pulsedeck:reset-corner', corner, size) as Promise<boolean>,
  listDisplays: () =>
    ipcRenderer.invoke('pulsedeck:list-displays') as Promise<
      { id: number; label: string; primary: boolean; bounds: object; workArea: object }[]
    >,
  onLockedChanged: (cb) => {
    const handler = (_: Electron.IpcRendererEvent, locked: boolean) => cb(locked);
    ipcRenderer.on('pulsedeck:locked-changed', handler);
    return () => ipcRenderer.removeListener('pulsedeck:locked-changed', handler);
  },
  onEditLayout: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('pulsedeck:edit-layout', handler);
    return () => ipcRenderer.removeListener('pulsedeck:edit-layout', handler);
  },
  onOpenSettings: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('pulsedeck:open-settings', handler);
    return () => ipcRenderer.removeListener('pulsedeck:open-settings', handler);
  },
  onAddWidget: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('pulsedeck:add-widget', handler);
    return () => ipcRenderer.removeListener('pulsedeck:add-widget', handler);
  },
  toggleEdit: () => ipcRenderer.send('pulsedeck:toggle-edit'),
  openSettings: () => ipcRenderer.send('pulsedeck:open-settings'),
};

contextBridge.exposeInMainWorld('pulsedeck', bridge);
