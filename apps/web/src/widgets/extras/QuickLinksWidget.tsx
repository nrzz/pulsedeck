import { useState } from 'react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { persistConfig } from '../../hooks/useWebSocket';
import { uid } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function QuickLinksWidget({ id }: WidgetProps) {
  const config = useDashboard((s) => s.config);
  const setConfig = useDashboard((s) => s.setConfig);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const save = async (quickLinks: typeof config.quickLinks) => {
    const next = { ...config, quickLinks };
    setConfig(next);
    await persistConfig(next);
  };

  return (
    <WidgetShell id={id} title="Quick Links" onSettings={() => setEditing((v) => !v)}>
      <div className="space-y-2">
        {config.quickLinks.map((link) => (
          <div key={link.id} className="flex items-center gap-2 group">
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center gap-2 text-sm hover:text-accent transition truncate"
            >
              <ExternalLink size={12} className="shrink-0 opacity-50" />
              {link.title}
            </a>
            {editing && (
              <button
                type="button"
                className="text-ink-muted hover:text-red-400"
                onClick={() => save(config.quickLinks.filter((l) => l.id !== link.id))}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        {editing && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <input
              className="input"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="input"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="button"
              className="btn w-full justify-center"
              onClick={() => {
                if (!title.trim() || !url.trim()) return;
                void save([
                  ...config.quickLinks,
                  { id: uid('link'), title: title.trim(), url: url.trim() },
                ]);
                setTitle('');
                setUrl('');
              }}
            >
              <Plus size={14} /> Add link
            </button>
          </div>
        )}
      </div>
    </WidgetShell>
  );
}
