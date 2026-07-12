# Creating widgets (SOP)

This is the standard operating procedure for adding a new PulseDeck widget. Follow every step so the catalog, registry, defaults, and docs stay in sync.

## Architecture reminder

```
packages/shared  →  WIDGET_CATALOG + types
apps/server      →  collectors / APIs / WebSocket payloads
apps/web         →  React component + registry + Zustand
apps/desktop     →  unchanged (loads built web UI)
```

## `WidgetDefinition` interface

Defined in `apps/web/src/widgets/registry.tsx`:

```ts
export interface WidgetProps {
  id: string;
  settings: Record<string, unknown>;
}

export interface WidgetDefinition {
  type: string; // unique id, kebab-case preferred
  name: string; // UI label
  category: 'system' | 'network' | 'finance' | 'extras';
  description: string;
  defaultSize: { w: number; h: number; minW?: number; minH?: number };
  defaultSettings?: Record<string, unknown>;
  component: ComponentType<WidgetProps>;
}
```

Mirror a one-line entry in `WIDGET_CATALOG` inside `packages/shared/src/index.ts`.

---

## Step-by-step SOP

### 1. Shared catalog

In `packages/shared/src/index.ts`, append to `WIDGET_CATALOG`:

```ts
{ type: 'my-widget', name: 'My Widget', category: 'extras', description: 'What it does' },
```

Rebuild shared: `npm run build -w @pulsedeck/shared`.

### 2. Component

Create `apps/web/src/widgets/<category>/MyWidget.tsx`:

```tsx
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export function MyWidget({ id, settings }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);

  return (
    <WidgetShell id={id} title="My Widget">
      <div className="text-sm text-ink-muted">
        Load {metrics?.cpu.currentLoad?.toFixed(0) ?? '…'}%{/* read settings.foo as needed */}
      </div>
    </WidgetShell>
  );
}
```

`WidgetShell` provides glass chrome, drag handle (edit mode), settings button hook, and remove.

### 3. Registry

In `apps/web/src/widgets/registry.tsx`:

```tsx
import { MyWidget } from './extras/MyWidget';

// inside widgetRegistry:
'my-widget': {
  type: 'my-widget',
  name: 'My Widget',
  category: 'extras',
  description: 'What it does',
  defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
  defaultSettings: { foo: 'bar' },
  component: MyWidget,
},
```

### 4. (Optional) Default layout / desktop preset

To ship it on new installs, add an instance to `DEFAULT_WIDGETS` + `DEFAULT_LAYOUT` and/or `DESKTOP_WIDGETS` + `DESKTOP_LAYOUT` in `packages/shared/src/index.ts`.

Users can also add it via **Edit → Add** without changing defaults.

### 5. Settings UI

```tsx
<WidgetShell id={id} title="My Widget" onSettings={() => setOpen((v) => !v)}>
  {open && (
    <input
      className="input"
      value={String(settings.foo ?? '')}
      onChange={(e) => {
        useDashboard.getState().updateWidgetSettings(id, { foo: e.target.value });
      }}
      onBlur={() => persistConfig(useDashboard.getState().config)}
    />
  )}
</WidgetShell>
```

### 6. New live data (if needed)

| Need                 | Where                                                               |
| -------------------- | ------------------------------------------------------------------- |
| System metrics field | `apps/server/src/collectors/metrics.ts` + `SystemMetrics` in shared |
| External API         | `apps/server/src/collectors/external.ts` + route/WS broadcast       |
| Client store         | Zustand field + handler in `apps/web/src/hooks/useWebSocket.ts`     |

### 7. Document

- Add a section to [WIDGETS.md](WIDGETS.md) (settings schema, data source, sizes, file path).
- Mention it in the README widget table if it is user-facing.

### 8. Verify

```bash
npm run typecheck
npm run lint
npm run dev          # http://localhost:5173 — Edit → Add → your widget
npm run test:e2e:dnd # drag/resize still green
```

For desktop packaging: `npm run build` then `npm run dist`.

---

## Do / Don't

**Do**

- Wrap content in `WidgetShell`
- Use `font-mono` / `.metric-value` for numbers; `.widget-title` for headers
- Reuse `Sparkline` / `ProgressRing`
- Keep secrets in `config.apiKeys`, never in widget settings
- Keep grid children free of CSS `transform` animations (breaks `react-grid-layout`)

**Don't**

- Animate `transform` on `.react-grid-item` (use opacity/filter on an inner wrapper)
- Put Electron-specific code in widgets — desktop loads the same web build
- Block the UI on slow APIs — fetch on the server and push over WS
- Commit `%APPDATA%` / `apps/server/data/config.json` personal layouts

---

## Checklist (copy into PRs)

- [ ] `WIDGET_CATALOG` entry in shared
- [ ] Component under `apps/web/src/widgets/...`
- [ ] `widgetRegistry` entry
- [ ] Settings documented in `docs/WIDGETS.md`
- [ ] Typecheck + lint clean
- [ ] Manual: Add widget in Edit mode, drag, resize, save
- [ ] Desktop rebuild if shipping installer

## Related

- [WIDGETS.md](WIDGETS.md) — all built-in widgets
- [ARCHITECTURE.md](ARCHITECTURE.md) — monorepo & data flow
- [CONTRIBUTING.md](../CONTRIBUTING.md)
