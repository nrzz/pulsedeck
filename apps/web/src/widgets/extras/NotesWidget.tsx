import { useEffect, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { persistConfig } from '../../hooks/useWebSocket';
import type { WidgetProps } from '../registry';

export function NotesWidget({ id }: WidgetProps) {
  const config = useDashboard((s) => s.config);
  const setConfig = useDashboard((s) => s.setConfig);
  const [value, setValue] = useState(config.notes);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setValue(config.notes);
  }, [config.notes, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(async () => {
      const next = { ...config, notes: value };
      setConfig(next);
      await persistConfig(next);
      setDirty(false);
    }, 600);
    return () => clearTimeout(t);
  }, [value, dirty, config, setConfig]);

  return (
    <WidgetShell id={id} title="Notes" allowScroll>
      <textarea
        className="w-full h-full min-h-0 resize-none bg-transparent outline-none text-sm leading-relaxed placeholder:text-ink-muted"
        placeholder="Jot something down…"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setDirty(true);
        }}
      />
    </WidgetShell>
  );
}
