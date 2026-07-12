import { ArrowDown, ArrowUp } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import { formatSpeed, cn } from '../../lib/utils';
import type { WidgetProps } from '../registry';
import type { SystemMetrics } from '@pulsedeck/shared';

const EMPTY_NET: SystemMetrics['network'] = [];

export function NetAdaptersWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const ifaces = useDashboard((s) => s.metrics?.network ?? EMPTY_NET);

  return (
    <WidgetShell id={id} title="Network Adapters">
      {!metrics ? (
        <WidgetSkeleton label="Loading adapters" />
      ) : ifaces.length === 0 ? (
        <div className="text-sm text-ink-muted">No adapters</div>
      ) : (
        <div className="space-y-2 max-h-full overflow-hidden">
          {ifaces.map((n) => (
            <div key={n.iface} className="rounded-lg bg-surface-3/40 p-2 text-xs">
              <div className="flex justify-between items-center gap-2 mb-1">
                <span className="font-medium truncate">{n.iface}</span>
                <span
                  className={cn(
                    'shrink-0 px-1.5 py-0.5 rounded text-[10px]',
                    n.operstate === 'up' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-surface-3 text-ink-muted',
                  )}
                >
                  {n.operstate}
                </span>
              </div>
              <div className="flex justify-between text-ink-muted font-mono tabular-nums">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ArrowDown size={10} /> {formatSpeed(n.rxSec)}
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <ArrowUp size={10} /> {formatSpeed(n.txSec)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
