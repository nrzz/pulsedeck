import { WidgetShell } from '../../components/WidgetShell';
import type { WidgetProps } from '../registry';

const HOTKEYS = [
  { keys: 'Ctrl+Alt+P', tip: 'Toggle pin / always on top' },
  { keys: 'Ctrl+Alt+E', tip: 'Edit layout' },
  { keys: 'Ctrl+Alt+L', tip: 'Lock dashboard' },
  { keys: 'Tray icon', tip: 'Right-click for menu' },
  { keys: 'Tray icon', tip: 'Double-click to show/hide' },
];

export function HotkeysWidget({ id }: WidgetProps) {
  return (
    <WidgetShell id={id} title="Hotkeys">
      <div className="space-y-2">
        {HOTKEYS.map((h, i) => (
          <div key={i} className="flex justify-between gap-2 text-xs">
            <span className="font-mono text-accent shrink-0">{h.keys}</span>
            <span className="text-ink-muted text-right">{h.tip}</span>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
