import { contextBridge, ipcRenderer } from 'electron';

export interface PulseDeckBridge {
  isWidgetMode: true;
  getLocked: () => Promise<boolean>;
  setLocked: (locked: boolean) => Promise<boolean>;
  onLockedChanged: (cb: (locked: boolean) => void) => () => void;
  onEditLayout: (cb: () => void) => () => void;
  toggleEdit: () => void;
  openSettings: () => void;
}

const bridge: PulseDeckBridge = {
  isWidgetMode: true,
  getLocked: () => ipcRenderer.invoke('pulsedeck:get-locked') as Promise<boolean>,
  setLocked: (locked: boolean) =>
    ipcRenderer.invoke('pulsedeck:set-locked', locked) as Promise<boolean>,
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
  toggleEdit: () => ipcRenderer.send('pulsedeck:toggle-edit'),
  openSettings: () => ipcRenderer.send('pulsedeck:open-settings'),
};

contextBridge.exposeInMainWorld('pulsedeck', bridge);
