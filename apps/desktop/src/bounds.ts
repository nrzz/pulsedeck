import fs from 'node:fs';
import path from 'node:path';
import { screen, type BrowserWindow, type Rectangle } from 'electron';

export interface SavedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  displayId?: number;
}

function boundsPath(userData: string): string {
  return path.join(userData, 'window-bounds.json');
}

export function loadBounds(userData: string): SavedBounds | null {
  try {
    const raw = fs.readFileSync(boundsPath(userData), 'utf-8');
    const parsed = JSON.parse(raw) as SavedBounds;
    if (
      typeof parsed.x !== 'number' ||
      typeof parsed.y !== 'number' ||
      typeof parsed.width !== 'number' ||
      typeof parsed.height !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveBounds(userData: string, bounds: SavedBounds): void {
  try {
    fs.mkdirSync(userData, { recursive: true });
    fs.writeFileSync(boundsPath(userData), JSON.stringify(bounds, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[PulseDeck] failed to save window bounds', err);
  }
}

export function clampBoundsToDisplays(bounds: SavedBounds): Rectangle {
  const displays = screen.getAllDisplays();
  const match =
    (bounds.displayId != null ? displays.find((d) => d.id === bounds.displayId) : undefined) ??
    screen.getDisplayMatching({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });

  const wa = match.workArea;
  const width = Math.min(Math.max(bounds.width, 360), wa.width);
  const height = Math.min(Math.max(bounds.height, 280), wa.height);
  const x = Math.min(Math.max(bounds.x, wa.x), wa.x + wa.width - width);
  const y = Math.min(Math.max(bounds.y, wa.y), wa.y + wa.height - height);
  return { x, y, width, height };
}

export function persistWindowBounds(userData: string, win: BrowserWindow): void {
  if (win.isDestroyed() || !win.isVisible()) return;
  const b = win.getBounds();
  const display = screen.getDisplayMatching(b);
  saveBounds(userData, {
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    displayId: display.id,
  });
}
