import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export function IpsWidget({ id }: WidgetProps) {
  const ips = useDashboard((s) => s.metrics?.ips);

  return (
    <WidgetShell id={id} title="IP Addresses">
      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs text-ink-muted mb-1">Public</div>
          <div className="font-mono">{ips?.public ?? '…'}</div>
        </div>
        <div>
          <div className="text-xs text-ink-muted mb-1">Local</div>
          <div className="space-y-1">
            {(ips?.local ?? []).length === 0 && <span className="text-ink-muted">—</span>}
            {(ips?.local ?? []).map((ip) => (
              <div key={ip} className="font-mono text-xs">
                {ip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}
