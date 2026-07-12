import { useCallback, useEffect, useMemo, useState } from 'react';
import { Newspaper, RefreshCw } from 'lucide-react';
import {
  NEWS_SUGGESTIONS,
  NEWS_TOPICS,
  type NewsItem,
  type NewsTopicId,
} from '@pulsedeck/shared';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { persistConfig } from '../../hooks/useWebSocket';
import type { WidgetProps } from '../registry';

type NewsSettings = {
  topics?: string[];
  feeds?: string[];
  limit?: number;
  refreshMinutes?: number;
  showSource?: boolean;
  showTime?: boolean;
  density?: 'compact' | 'comfy';
};

function formatWhen(raw?: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 16);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function loadNews(
  widgetId: string,
  settings: NewsSettings,
): Promise<void> {
  const topics = (settings.topics?.length ? settings.topics : ['technology', 'world', 'india']).slice(
    0,
    8,
  );
  const feeds = (settings.feeds || []).slice(0, 3);
  const limit = Math.min(40, Math.max(6, settings.limit ?? 20));
  const qs = new URLSearchParams({
    topics: topics.join(','),
    limit: String(limit),
  });
  if (feeds.length) qs.set('feeds', feeds.join(','));
  const res = await fetch(`/api/news?${qs}`);
  if (!res.ok) return;
  const data = (await res.json()) as { items?: NewsItem[] };
  if (Array.isArray(data.items)) {
    useDashboard.getState().setNewsForWidget(widgetId, data.items);
  }
}

export function NewsWidget({ id, settings }: WidgetProps) {
  const news = useDashboard((s) => s.newsByWidgetId[id] ?? null);
  const defaults = useDashboard((s) => s.config.shell?.newsDefaults);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customFeed, setCustomFeed] = useState('');

  const cfg: NewsSettings = useMemo(() => {
    const topics =
      (settings.topics as string[] | undefined) ??
      defaults?.topics ??
      ['technology', 'world', 'india', 'business'];
    return {
      topics,
      feeds: (settings.feeds as string[] | undefined) ?? [],
      // Migrate old trays that defaulted to 3–5 items (felt like 1 per topic)
      limit: (() => {
        const raw = (settings.limit as number | undefined) ?? defaults?.limit ?? 20;
        return raw <= 6 ? 20 : raw;
      })(),
      refreshMinutes:
        (settings.refreshMinutes as number | undefined) ?? defaults?.refreshMinutes ?? 20,
      showSource: (settings.showSource as boolean | undefined) ?? defaults?.showSource ?? true,
      showTime: (settings.showTime as boolean | undefined) ?? defaults?.showTime ?? false,
      density: (settings.density as 'compact' | 'comfy' | undefined) ?? defaults?.density ?? 'compact',
    };
  }, [settings, defaults]);

  const save = useCallback(
    async (patch: Partial<NewsSettings>, refetch = true) => {
      updateWidgetSettings(id, patch);
      const next = { ...cfg, ...patch };
      const latest = useDashboard.getState().config;
      void persistConfig(latest);
      if (refetch) {
        setLoading(true);
        try {
          await loadNews(id, next);
        } finally {
          setLoading(false);
        }
      }
    },
    [cfg, id, updateWidgetSettings],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        if (!cancelled) await loadNews(id, cfg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    const mins = Math.max(15, cfg.refreshMinutes ?? 20);
    const timer = window.setInterval(() => void run(), mins * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // Re-fetch when topic/limit/feeds identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, (cfg.topics || []).join(','), (cfg.feeds || []).join(','), cfg.limit, cfg.refreshMinutes]);

  const toggleTopic = (topicId: NewsTopicId) => {
    const set = new Set(cfg.topics || []);
    if (set.has(topicId)) set.delete(topicId);
    else if (set.size < 8) set.add(topicId);
    const next = [...set];
    if (!next.length) next.push('technology');
    void save({ topics: next });
  };

  const compact = cfg.density === 'compact';

  let body;
  if (editing) {
    body = (
      <div className="space-y-3 text-xs" data-no-drag>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-muted mb-1.5">Suggestions</div>
          <div className="flex flex-wrap gap-1">
            {NEWS_SUGGESTIONS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                title={pack.description}
                className="btn !py-0.5 !px-2 !text-[11px] !rounded-full"
                onClick={() => void save({ topics: [...pack.topics] })}
              >
                {pack.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-muted mb-1.5">
            Topics <span className="normal-case opacity-70">(max 8)</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {NEWS_TOPICS.map((t) => {
              const on = (cfg.topics || []).includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`btn !py-0.5 !px-2 !text-[11px] !rounded-full ${
                    on ? 'bg-accent/20 border-accent/40' : ''
                  }`}
                  onClick={() => toggleTopic(t.id)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] text-ink-muted">Items</span>
            <select
              className="input !py-1 !text-xs"
              value={cfg.limit}
              onChange={(e) => void save({ limit: Number(e.target.value) })}
            >
              {[8, 12, 16, 20, 24, 32].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] text-ink-muted">Refresh</span>
            <select
              className="input !py-1 !text-xs"
              value={cfg.refreshMinutes}
              onChange={(e) => void save({ refreshMinutes: Number(e.target.value) }, false)}
            >
              {[15, 20, 30, 60].map((n) => (
                <option key={n} value={n}>
                  {n} min
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] text-ink-muted">Density</span>
            <select
              className="input !py-1 !text-xs"
              value={cfg.density}
              onChange={(e) =>
                void save({ density: e.target.value as 'compact' | 'comfy' }, false)
              }
            >
              <option value="compact">Compact</option>
              <option value="comfy">Comfy</option>
            </select>
          </label>
          <div className="space-y-1">
            <span className="text-[10px] text-ink-muted">Display</span>
            <div className="flex flex-col gap-1 pt-1">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={!!cfg.showSource}
                  onChange={(e) => void save({ showSource: e.target.checked }, false)}
                />
                Source
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={!!cfg.showTime}
                  onChange={(e) => void save({ showTime: e.target.checked }, false)}
                />
                Time
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-ink-muted">Custom RSS (max 3)</span>
          <div className="flex gap-1">
            <input
              className="input !py-1 !text-xs flex-1"
              placeholder="https://…/rss"
              value={customFeed}
              onChange={(e) => setCustomFeed(e.target.value)}
            />
            <button
              type="button"
              className="btn-accent !py-1 !px-2 !text-xs"
              onClick={() => {
                const url = customFeed.trim();
                if (!url) return;
                const feeds = [...(cfg.feeds || []), url].slice(0, 3);
                setCustomFeed('');
                void save({ feeds });
              }}
            >
              Add
            </button>
          </div>
          {(cfg.feeds || []).map((f) => (
            <div key={f} className="flex items-center gap-1 text-[10px] text-ink-muted">
              <span className="truncate flex-1">{f}</span>
              <button
                type="button"
                className="btn !py-0 !px-1.5 !text-[10px]"
                onClick={() => void save({ feeds: (cfg.feeds || []).filter((x) => x !== f) })}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-ink-muted leading-snug">
          Titles + links only · mixed across topics · tray scrolls · server-cached 12m.
        </p>
      </div>
    );
  } else if (!news?.length && loading) {
    body = (
      <div className="h-full flex flex-col items-center justify-center text-ink-muted gap-1">
        <Newspaper size={18} className="opacity-50" />
        <span className="text-sm">Loading headlines…</span>
      </div>
    );
  } else if (!news?.length) {
    body = (
      <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-sm text-ink-muted">
        <span>No headlines yet</span>
        <button type="button" className="btn !text-xs" onClick={() => setEditing(true)}>
          Pick topics
        </button>
      </div>
    );
  } else {
    body = (
      <ul className={`min-h-0 ${compact ? 'space-y-1' : 'space-y-1.5'}`}>
        {news.map((item, i) => (
          <li key={`${item.link || item.title}-${i}`} className="min-w-0">
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className={`block leading-snug hover:text-accent transition ${
                  compact ? 'text-[12px] line-clamp-2' : 'text-sm line-clamp-3'
                }`}
              >
                {item.title}
              </a>
            ) : (
              <div className={compact ? 'text-[12px] line-clamp-2' : 'text-sm line-clamp-3'}>
                {item.title}
              </div>
            )}
            {(cfg.showSource || cfg.showTime) && (
              <div className="text-[10px] text-ink-muted mt-0.5 truncate">
                {[cfg.showSource ? item.source : null, cfg.showTime ? formatWhen(item.published) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <WidgetShell
      id={id}
      title="News"
      onSettings={() => setEditing((v) => !v)}
      allowScroll
      actions={
        <button
          type="button"
          className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-white/5 transition"
          title="Refresh"
          aria-label="Refresh news"
          onClick={() => {
            setLoading(true);
            void loadNews(id, cfg).finally(() => setLoading(false));
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      }
    >
      {body}
    </WidgetShell>
  );
}
