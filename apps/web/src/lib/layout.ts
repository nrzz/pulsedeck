/** Normalize layout items so they fit within `cols` without overflowing. */
export function normalizeLayoutToCols<
  T extends { x: number; y: number; w: number; h: number; minW?: number; minH?: number },
>(layout: T[], cols: number): T[] {
  const c = Math.max(4, cols);
  return layout.map((item) => {
    const minW = Math.min(item.minW ?? 2, c);
    const w = Math.min(Math.max(item.w, minW), c);
    const x = Math.min(Math.max(0, item.x), Math.max(0, c - w));
    return { ...item, w, x, minW };
  });
}

/** Scale layout from one column count to another. */
export function scaleLayoutBetween<
  T extends { x: number; y: number; w: number; h: number; minW?: number; minH?: number },
>(layout: T[], fromCols: number, toCols: number): T[] {
  const from = Math.max(4, fromCols);
  const to = Math.max(4, toCols);
  if (from === to) return normalizeLayoutToCols(layout, to);
  const factor = to / from;
  return normalizeLayoutToCols(
    layout.map((item) => ({
      ...item,
      x: Math.round(item.x * factor),
      w: Math.max(1, Math.round(item.w * factor)),
      minW: item.minW != null ? Math.max(1, Math.round(item.minW * factor)) : item.minW,
    })),
    to,
  );
}

/** Scale a 12-col pack layout into the active column count. */
export function scaleLayoutFrom12<
  T extends { x: number; y: number; w: number; h: number; minW?: number; minH?: number },
>(layout: T[], cols: number): T[] {
  return scaleLayoutBetween(layout, 12, cols);
}
