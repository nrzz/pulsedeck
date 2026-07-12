import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export function IpsWidget({ id }: WidgetProps) {
  const ips = useDashboard((s) => s.metrics?.ips);
  const local = (ips?.local ?? []).slice(0, 3);

  return (
    <WidgetShell id={id} title="IP Addresses">
      <div className="space-y-2 text-sm h-full min-h-0 overflow-hidden">
        <div className="min-w-0">
          <div className="text-[10px] text-ink-muted mb-0.5">Public</div>
          <div className="font-mono text-[12px] truncate">{ips?.public ?? '…'}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-ink-muted mb-0.5">Local</div>
          <div className="space-y-0.5">
            {local.length === 0 && <span className="text-ink-muted text-xs">—</span>}
            {local.map((ip) => (
              <div key={ip} className="font-mono text-[11px] truncate">
                {ip}
              </div>
            ))}
            {(ips?.local?.length ?? 0) > local.length && (
              <div className="text-[10px] text-ink-muted">
                +{(ips?.local?.length ?? 0) - local.length} more
              </div>
            )}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}
