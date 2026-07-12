import { useMemo, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { cn } from '../../lib/utils';
import type { WidgetProps } from '../registry';

const MAX_HOSTS = 4;
const MAX_PORTS = 4;

type PortItem = { host: string; port: number; label?: string };

function parseHostList(raw: string[]): { hosts: string[]; ports: PortItem[] } {
  const hosts: string[] = [];
  const ports: PortItem[] = [];
  for (const entry of raw) {
    const s = entry.trim();
    if (!s) continue;
    const m = s.match(/^(.+):(\d+)$/);
    if (m) {
      ports.push({ host: m[1], port: Number(m[2]), label: s });
      if (!hosts.includes(m[1])) hosts.push(m[1]);
    } else {
      hosts.push(s);
    }
  }
  return { hosts, ports };
}

export function PortsWidget({ id, settings }: WidgetProps) {
  const ping = useDashboard((s) => s.ping);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const [editing, setEditing] = useState(false);

  const normalized = useMemo(() => {
    const fromPorts = (settings.ports as PortItem[]) || [];
    const fromHosts = (settings.hosts as string[]) || [];
    if (fromPorts.length || fromHosts.some((h) => !h.includes(':'))) {
      const hostOnly = fromHosts.filter((h) => !h.includes(':'));
      const parsed = parseHostList(fromHosts.filter((h) => h.includes(':')));
      return {
        hosts: [...new Set([...hostOnly, ...parsed.hosts, ...fromPorts.map((p) => p.host)])],
        ports: [...fromPorts, ...parsed.ports],
      };
    }
    return parseHostList(fromHosts);
  }, [settings.hosts, settings.ports]);

  const { hosts, ports } = normalized;
  const [draft, setDraft] = useState(
    [
      ...hosts.filter((h) => !ports.some((p) => p.host === h)),
      ...ports.map((p) => p.label || `${p.host}:${p.port}`),
    ].join(', '),
  );

  const hostRows = (
    ping.filter((p) => hosts.includes(p.host)).length
      ? ping.filter((p) => hosts.includes(p.host))
      : hosts.map((h) => ({ host: h, alive: false, timeMs: null as number | null, timestamp: 0 }))
  ).slice(0, MAX_HOSTS);
  const hostMore = Math.max(0, hosts.length - hostRows.length);
  const portRows = ports.slice(0, MAX_PORTS);
  const portMore = ports.length - portRows.length;

  return (
    <WidgetShell
      id={id}
      title="Ports"
      allowScroll={editing}
      onSettings={() => {
        setDraft(
          [
            ...hosts.filter((h) => !ports.some((p) => p.host === h)),
            ...ports.map((p) => p.label || `${p.host}:${p.port}`),
          ].join(', '),
        );
        setEditing((v) => !v);
      }}
    >
      {editing ? (
        <div className="space-y-2" data-no-drag>
          <p className="text-[11px] text-ink-muted">Hosts or host:port — e.g. 1.1.1.1, 8.8.8.8:53</p>
          <textarea
            className="input h-24 resize-none font-mono text-xs"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            className="btn-accent w-full justify-center"
            onClick={() => {
              const parsed = parseHostList(
                draft
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              );
              updateWidgetSettings(id, { hosts: parsed.hosts, ports: parsed.ports });
              setEditing(false);
            }}
          >
            Save targets
          </button>
        </div>
      ) : (
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
            <button type="button" className="text-ink-muted text-xs hover:text-accent" onClick={() => setEditing(true)}>
              Configure hosts…
            </button>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
