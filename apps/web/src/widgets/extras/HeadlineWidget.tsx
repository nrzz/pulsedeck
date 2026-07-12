import { useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

const FEED_PRESETS = [
  { label: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
  { label: 'BBC Tech', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
  { label: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { label: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
];

export function HeadlineWidget({ id, settings }: WidgetProps) {
  const headline = useDashboard((s) => s.headline);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const [editing, setEditing] = useState(false);
  const [feedUrl, setFeedUrl] = useState(
    String(settings.feedUrl ?? 'https://news.ycombinator.com/rss'),
  );

  const apply = (url: string) => {
    setFeedUrl(url);
    updateWidgetSettings(id, { feedUrl: url });
    setEditing(false);
    void fetch(`/api/headline?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.title) useDashboard.getState().setHeadline(data);
      })
      .catch(() => undefined);
  };

  const title = headline?.title ?? null;

  let body;
  if (editing) {
    body = (
      <div className="space-y-2" data-no-drag>
        <div className="flex flex-wrap gap-1">
          {FEED_PRESETS.map((p) => (
            <button
              key={p.url}
              type="button"
              className="btn !py-0.5 !px-2 !text-[11px] !rounded-full"
              onClick={() => apply(p.url)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          className="input !text-xs"
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
          placeholder="RSS / Atom URL"
        />
        <button
          type="button"
          className="btn-accent w-full justify-center"
          onClick={() => apply(feedUrl)}
        >
          Save feed
        </button>
        <p className="text-[10px] text-ink-muted">
          Prefer the <strong>News tray</strong> widget for topics + suggestions.
        </p>
      </div>
    );
  } else if (!title) {
    body = <div className="text-sm text-ink-muted">No headline available</div>;
  } else if (headline?.link) {
    body = (
      <a
        href={headline.link}
        target="_blank"
        rel="noreferrer"
        className="text-sm leading-relaxed hover:text-accent transition line-clamp-4"
      >
        {title}
      </a>
    );
  } else {
    body = <div className="text-sm leading-relaxed line-clamp-4">{title}</div>;
  }

  return (
    <WidgetShell
      id={id}
      title="Headline"
      allowScroll={editing}
      onSettings={() => setEditing((v) => !v)}
    >
      {body}
    </WidgetShell>
  );
}
