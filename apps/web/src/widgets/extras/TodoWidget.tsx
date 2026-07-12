import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { cn, uid } from '../../lib/utils';
import type { WidgetProps } from '../registry';

type TodoItem = { id: string; text: string; done: boolean };

const MAX_VISIBLE = 6;

export function TodoWidget({ id, settings }: WidgetProps) {
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const items = (settings.items as TodoItem[]) || [];
  const [draft, setDraft] = useState('');

  const save = (next: TodoItem[]) => updateWidgetSettings(id, { items: next });

  const toggle = (itemId: string) => {
    save(items.map((t) => (t.id === itemId ? { ...t, done: !t.done } : t)));
  };

  const remove = (itemId: string) => {
    save(items.filter((t) => t.id !== itemId));
  };

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    save([...items, { id: uid('todo'), text, done: false }]);
    setDraft('');
  };

  const shown = items.slice(0, MAX_VISIBLE);
  const more = items.length - shown.length;

  return (
    <WidgetShell id={id} title="Todo">
      <div className="space-y-2 h-full min-h-0 flex flex-col overflow-hidden">
        <div className="flex gap-2 shrink-0">
          <input
            className="input flex-1 text-sm"
            placeholder="Add task…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button type="button" className="btn shrink-0" onClick={add}>
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden space-y-1">
          {items.length === 0 && <div className="text-sm text-ink-muted">No tasks yet</div>}
          {shown.map((t) => (
            <div key={t.id} className="flex items-center gap-2 group text-sm">
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span className={cn('flex-1 truncate', t.done && 'line-through text-ink-muted')}>
                {t.text}
              </span>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-red-400"
                onClick={() => remove(t.id)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {more > 0 && <div className="text-[10px] text-ink-muted">+{more} more</div>}
        </div>
      </div>
    </WidgetShell>
  );
}
