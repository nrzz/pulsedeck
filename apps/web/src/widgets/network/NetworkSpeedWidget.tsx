import { ArrowDown, ArrowUp } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { Sparkline } from '../../components/Sparkline';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import { formatSpeed } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function NetworkSpeedWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const historyRx = useDashboard((s) => s.history.netRx);
  const historyTx = useDashboard((s) => s.history.netTx);
  const net = metrics?.network?.[0];

  return (
    <WidgetShell id={id} title="Network Speed">
      {!metrics ? (
        <WidgetSkeleton label="Loading network" />
      ) : (
        <div className="flex flex-col h-full min-h-0">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 min-h-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-emerald-400 text-xs mb-1">
                <ArrowDown size={12} /> Download
              </div>
              <div className="font-mono text-lg sm:text-xl font-semibold mb-2 truncate">
                {formatSpeed(net?.rxSec ?? 0)}
              </div>
              <Sparkline data={historyRx} color="#34d399" height={44} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-sky-400 text-xs mb-1">
                <ArrowUp size={12} /> Upload
              </div>
              <div className="font-mono text-lg sm:text-xl font-semibold mb-2 truncate">
                {formatSpeed(net?.txSec ?? 0)}
              </div>
              <Sparkline data={historyTx} color="#38bdf8" height={44} />
            </div>
          </div>
          {net && (
            <div className="text-[10px] text-ink-muted mt-2 truncate shrink-0">
              {net.iface} · {net.operstate}
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
