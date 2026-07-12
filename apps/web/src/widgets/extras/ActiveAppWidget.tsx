import { useEffect, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import type { WidgetProps } from '../registry';

export function ActiveAppWidget({ id }: WidgetProps) {
  const [app, setApp] = useState<string | null>(null);

  useEffect(() => {
    const poll = async () => {
      const bridge = window.pulsedeck;
      try {
        const name = bridge?.getForegroundApp ? await bridge.getForegroundApp() : null;
        setApp(name);
      } catch {
        setApp(null);
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <WidgetShell id={id} title="Active App">
      <div className="space-y-1">
        <div className="text-[10px] text-ink-muted">Foreground app (desktop)</div>
        <div className="font-medium truncate">{app ?? '—'}</div>
      </div>
    </WidgetShell>
  );
}
