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
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
            <div className="min-w-0 min-h-0 overflow-hidden flex flex-col justify-center">
              <div className="flex items-center gap-1 text-emerald-400 text-[10px] mb-0.5">
                <ArrowDown size={11} /> Download
              </div>
              <div className="font-mono text-base font-semibold mb-1 truncate tabular-nums">
                {formatSpeed(net?.rxSec ?? 0)}
              </div>
              <Sparkline data={historyRx} color="#34d399" height={28} />
            </div>
            <div className="min-w-0 min-h-0 overflow-hidden flex flex-col justify-center">
              <div className="flex items-center gap-1 text-sky-400 text-[10px] mb-0.5">
                <ArrowUp size={11} /> Upload
              </div>
              <div className="font-mono text-base font-semibold mb-1 truncate tabular-nums">
                {formatSpeed(net?.txSec ?? 0)}
              </div>
              <Sparkline data={historyTx} color="#38bdf8" height={28} />
            </div>
          </div>
          {net && (
            <div className="text-[10px] text-ink-muted mt-1 truncate shrink-0">
              {net.iface} · {net.operstate}
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
