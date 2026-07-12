import { useEffect, useState } from 'react';
import { AppWindow, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { uid } from '../../lib/utils';
import type { WidgetProps } from '../registry';

type LaunchKind = 'url' | 'app';

type LauncherItem = {
  id?: string;
  title: string;
  kind: LaunchKind;
  target: string;
  /** legacy */
  url?: string;
};

type Preset = { id: string; title: string; path: string | null; exists: boolean };

const MAX_VISIBLE = 8;
const MAX_ITEMS = 24;
const DEFAULT_LINKS: LauncherItem[] = [
  { title: 'GitHub', kind: 'url', target: 'https://github.com' },
  { title: 'YouTube', kind: 'url', target: 'https://youtube.com' },
];

function migrateItem(raw: LauncherItem | { title: string; url: string }): LauncherItem {
  if ('kind' in raw && raw.kind && raw.target) {
    return {
      id: raw.id,
      title: raw.title,
      kind: raw.kind,
      target: raw.target,
    };
  }
  const legacy = raw as { id?: string; title: string; url: string };
  return {
    id: legacy.id,
    title: legacy.title,
    kind: 'url',
    target: legacy.url || '',
  };
}

export function LauncherWidget({ id, settings }: WidgetProps) {
  const config = useDashboard((s) => s.config);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [kind, setKind] = useState<LaunchKind>('url');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fromSettings = settings.links as LauncherItem[] | undefined;
  const links: LauncherItem[] = (
    fromSettings?.length
      ? fromSettings
      : config.quickLinks.length
        ? config.quickLinks.map((l) => ({
            id: l.id,
            title: l.title,
            kind: 'url' as const,
            target: l.url,
          }))
        : DEFAULT_LINKS
  ).map(migrateItem);

  const save = (next: LauncherItem[]) => {
    updateWidgetSettings(id, {
      links: next.slice(0, MAX_ITEMS).map((l) => ({
        id: l.id || uid('launch'),
        title: l.title,
        kind: l.kind,
        target: l.target,
      })),
    });
  };

  useEffect(() => {
    if (!editing) return;
    const bridge = window.pulsedeck;
    if (!bridge?.launcherPresets) return;
    void bridge
      .launcherPresets()
      .then(setPresets)
      .catch(() => setPresets([]));
  }, [editing]);

  const launch = async (item: LauncherItem) => {
    setError(null);
    const bridge = window.pulsedeck;
    if (bridge?.openTarget) {
      const res = await bridge.openTarget({ kind: item.kind, target: item.target });
      if (!res.ok) {
        setError(res.error);
        window.setTimeout(() => setError(null), 3000);
      }
      return;
    }
    if (item.kind === 'url' || /^https?:\/\//i.test(item.target)) {
      window.open(item.target, '_blank', 'noopener,noreferrer');
      return;
    }
    setError('Open apps in the PulseDeck desktop app');
    window.setTimeout(() => setError(null), 3000);
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
            <div key={link.id || `${link.target}-${i}`} className="flex items-center gap-2">
              <span className="text-[10px] text-ink-muted shrink-0 uppercase w-8">{link.kind}</span>
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

          <div className="flex gap-2 pt-2 border-t border-white/5">
            {(['url', 'app'] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={`btn flex-1 justify-center !text-xs ${
                  kind === k ? 'bg-accent/20 border-accent/40' : ''
                }`}
                onClick={() => setKind(k)}
              >
                {k === 'url' ? 'URL' : 'App'}
              </button>
            ))}
          </div>

          {kind === 'app' && presets.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`btn !py-0.5 !px-2 !text-[11px] !rounded-full ${
                    p.exists ? '' : 'opacity-50'
                  }`}
                  title={p.path || p.title}
                  onClick={() => {
                    if (!p.path) return;
                    if (links.length >= MAX_ITEMS) return;
                    save([
                      ...links,
                      {
                        id: uid('launch'),
                        title: p.title,
                        kind: 'app',
                        target: p.path,
                      },
                    ]);
                  }}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <input
              className="input"
              placeholder="Label"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-1">
              <input
                className="input flex-1 font-mono !text-xs"
                placeholder={kind === 'url' ? 'https://' : 'C:\\… or /usr/bin/…'}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              {kind === 'app' && window.pulsedeck?.pickApp && (
                <button
                  type="button"
                  className="btn !text-xs shrink-0"
                  onClick={async () => {
                    const picked = await window.pulsedeck?.pickApp?.();
                    if (picked) setTarget(picked);
                  }}
                >
                  Browse…
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn w-full justify-center"
              onClick={() => {
                if (!title.trim() || !target.trim()) return;
                if (links.length >= MAX_ITEMS) return;
                save([
                  ...links,
                  {
                    id: uid('launch'),
                    title: title.trim(),
                    kind,
                    target: target.trim(),
                  },
                ]);
                setTitle('');
                setTarget('');
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
        <div className="space-y-1">
          <div className="flex flex-wrap gap-2 overflow-hidden content-start">
            {shown.map((link, i) => (
              <button
                key={link.id || `${link.target}-${i}`}
                type="button"
                className="btn text-xs gap-1.5 max-w-full"
                onClick={() => void launch(link)}
              >
                {link.kind === 'app' ? (
                  <AppWindow size={12} className="shrink-0" />
                ) : (
                  <ExternalLink size={12} className="shrink-0" />
                )}
                <span className="truncate">{link.title}</span>
              </button>
            ))}
            {more > 0 && (
              <span className="text-[10px] text-ink-muted self-center">+{more} more</span>
            )}
          </div>
          {error && <div className="text-[10px] text-red-400 truncate">{error}</div>}
        </div>
      )}
    </WidgetShell>
  );
}
