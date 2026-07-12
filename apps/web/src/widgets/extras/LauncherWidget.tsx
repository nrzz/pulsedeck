import { ExternalLink } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

type LinkItem = { title: string; url: string };

export function LauncherWidget({ id, settings }: WidgetProps) {
  const config = useDashboard((s) => s.config);
  const links =
    (settings.links as LinkItem[]) ||
    config.quickLinks.map((l) => ({ title: l.title, url: l.url }));

  return (
    <WidgetShell id={id} title="Launcher">
      {!links.length ? (
        <div className="text-sm text-ink-muted">Add links in settings</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {links.map((link, i) => (
            <button
              key={`${link.url}-${i}`}
              type="button"
              className="btn text-xs gap-1.5"
              onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink size={12} />
              {link.title}
            </button>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
