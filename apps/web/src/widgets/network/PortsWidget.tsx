import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { cn } from '../../lib/utils';
import type { WidgetProps } from '../registry';

const MAX_HOSTS = 4;
const MAX_PORTS = 4;

export function PortsWidget({ id, settings }: WidgetProps) {
  const ping = useDashboard((s) => s.ping);
  const hosts = (settings.hosts as string[]) || [];
  const ports = (settings.ports as Array<{ host: string; port: number; label?: string }>) || [];

  const hostRows = (
    ping.filter((p) => hosts.includes(p.host)).length
      ? ping.filter((p) => hosts.includes(p.host))
      : hosts.map((h) => ({ host: h, alive: false, timeMs: null as number | null, timestamp: 0 }))
  ).slice(0, MAX_HOSTS);
  const hostMore = Math.max(0, hosts.length - hostRows.length);
  const portRows = ports.slice(0, MAX_PORTS);
  const portMore = ports.length - portRows.length;

  return (
    <WidgetShell id={id} title="Ports">
      <div className="space-y-3 text-sm overflow-hidden h-full min-h-0">
        {hosts.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-ink-muted uppercase tracking-wide">Hosts</div>
            {hostRows.map((p) => (
              <div key={p.host} className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      p.alive ? 'bg-emerald-400' : 'bg-red-400',
                    )}
                  />
                  <span className="font-mono truncate">{p.host}</span>
                </div>
                <span className="font-mono text-ink-muted tabular-nums shrink-0">
                  {p.alive && p.timeMs != null ? `${p.timeMs.toFixed(0)} ms` : '—'}
                </span>
              </div>
            ))}
            {hostMore > 0 && <div className="text-[10px] text-ink-muted">+{hostMore} more</div>}
          </div>
        )}

        {ports.length > 0 && (
          <div className="space-y-1.5 border-t border-white/5 pt-2">
            <div className="text-[10px] text-ink-muted uppercase tracking-wide">Ports</div>
            {portRows.map((p, i) => (
              <div key={`${p.host}-${p.port}-${i}`} className="flex justify-between text-xs font-mono gap-2">
                <span className="truncate">{p.label || `${p.host}:${p.port}`}</span>
                <span className="text-ink-muted tabular-nums shrink-0">{p.port}</span>
              </div>
            ))}
            {portMore > 0 && <div className="text-[10px] text-ink-muted">+{portMore} more</div>}
          </div>
        )}

        {hosts.length === 0 && ports.length === 0 && (
          <div className="text-ink-muted text-xs">Configure hosts in settings</div>
        )}
      </div>
    </WidgetShell>
  );
}
