/// <reference types="vite/client" />

import type { PulseDeckBridge } from './lib/shell';

declare global {
  interface Window {
    pulsedeck?: PulseDeckBridge;
  }
}

export {};
