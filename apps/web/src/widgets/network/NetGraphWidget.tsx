import { ArrowDown, ArrowUp } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { Sparkline } from '../../components/Sparkline';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export function NetGraphWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const historyRx = useDashboard((s) => s.history.netRx);
  const historyTx = useDashboard((s) => s.history.netTx);

  return (
    <WidgetShell id={id} title="Network Graph">
      {!metrics ? (
        <WidgetSkeleton label="Loading network graph" />
      ) : (
        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="flex-1 min-h-0">
            <div className="flex items-center gap-1 text-emerald-400 text-xs mb-1">
              <ArrowDown size={12} /> RX
            </div>
            <Sparkline data={historyRx} color="#34d399" height={48} />
          </div>
          <div className="flex-1 min-h-0">
            <div className="flex items-center gap-1 text-sky-400 text-xs mb-1">
              <ArrowUp size={12} /> TX
            </div>
            <Sparkline data={historyTx} color="#38bdf8" height={48} />
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
