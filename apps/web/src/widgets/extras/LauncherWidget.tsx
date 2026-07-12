import { ExternalLink } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

type LinkItem = { title: string; url: string };

const MAX_VISIBLE = 8;

export function LauncherWidget({ id, settings }: WidgetProps) {
  const config = useDashboard((s) => s.config);
  const links =
    (settings.links as LinkItem[]) ||
    config.quickLinks.map((l) => ({ title: l.title, url: l.url }));
  const shown = links.slice(0, MAX_VISIBLE);
  const more = links.length - shown.length;

  return (
    <WidgetShell id={id} title="Launcher">
      {!links.length ? (
        <div className="text-sm text-ink-muted">Add links in settings</div>
      ) : (
        <div className="flex flex-wrap gap-2 overflow-hidden content-start">
          {shown.map((link, i) => (
            <button
              key={`${link.url}-${i}`}
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
