import { useState } from 'react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { uid } from '../../lib/utils';
import type { WidgetProps } from '../registry';

type LinkItem = { id?: string; title: string; url: string };

const MAX_VISIBLE = 8;
const DEFAULT_LINKS: LinkItem[] = [
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'YouTube', url: 'https://youtube.com' },
];

export function LauncherWidget({ id, settings }: WidgetProps) {
  const config = useDashboard((s) => s.config);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const fromSettings = settings.links as LinkItem[] | undefined;
  const links: LinkItem[] = fromSettings?.length
    ? fromSettings
    : config.quickLinks.length
      ? config.quickLinks.map((l) => ({ id: l.id, title: l.title, url: l.url }))
      : DEFAULT_LINKS;

  const save = (next: LinkItem[]) => {
    updateWidgetSettings(id, {
      links: next.map((l) => ({
        id: l.id || uid('launch'),
        title: l.title,
        url: l.url,
      })),
    });
  };

  const shown = editing ? links : links.slice(0, MAX_VISIBLE);
  const more = editing ? 0 : Math.max(0, links.length - MAX_VISIBLE);

  return (
    <WidgetShell
      id={id}
      title="Launcher"
      allowScroll={editing}
      onSettings={() => setEditing((v) => !v)}
    >
      {editing ? (
        <div className="space-y-2" data-no-drag>
          {links.length === 0 && (
            <div className="text-xs text-ink-muted">No buttons yet — add one below</div>
          )}
          {links.map((link, i) => (
            <div key={link.id || `${link.url}-${i}`} className="flex items-center gap-2">
              <span className="flex-1 text-xs truncate">{link.title}</span>
              <button
                type="button"
                className="text-ink-muted hover:text-red-400"
                onClick={() => save(links.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${link.title}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <input
              className="input"
              placeholder="Label"
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
                save([...links, { id: uid('launch'), title: title.trim(), url: url.trim() }]);
                setTitle('');
                setUrl('');
              }}
            >
              <Plus size={14} /> Add button
            </button>
            <button
              type="button"
              className="btn-accent w-full justify-center"
              onClick={() => setEditing(false)}
            >
              Done
            </button>
          </div>
        </div>
      ) : !links.length ? (
        <button
          type="button"
          className="text-sm text-ink-muted hover:text-accent"
          onClick={() => setEditing(true)}
        >
          Add launch buttons…
        </button>
      ) : (
        <div className="flex flex-wrap gap-2 overflow-hidden content-start">
          {shown.map((link, i) => (
            <button
              key={link.id || `${link.url}-${i}`}
              type="button"
              className="btn text-xs gap-1.5 max-w-full"
              onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink size={12} className="shrink-0" />
              <span className="truncate">{link.title}</span>
            </button>
          ))}
          {more > 0 && <span className="text-[10px] text-ink-muted self-center">+{more} more</span>}
        </div>
      )}
    </WidgetShell>
  );
}
