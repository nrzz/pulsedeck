import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { formatBytes } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function DataUsageWidget({ id }: WidgetProps) {
  const net = useDashboard((s) => s.metrics?.network?.[0]);

  return (
    <WidgetShell id={id} title="Data Usage">
      <div className="grid grid-cols-2 gap-3 h-full content-center">
        <div className="rounded-xl bg-surface-3/50 p-3">
          <div className="flex items-center gap-1 text-xs text-emerald-400 mb-1">
            <ArrowDownToLine size={12} /> Received
          </div>
          <div className="font-mono text-lg font-semibold">{formatBytes(net?.rxBytes ?? 0)}</div>
        </div>
        <div className="rounded-xl bg-surface-3/50 p-3">
          <div className="flex items-center gap-1 text-xs text-sky-400 mb-1">
            <ArrowUpFromLine size={12} /> Sent
          </div>
          <div className="font-mono text-lg font-semibold">{formatBytes(net?.txBytes ?? 0)}</div>
        </div>
      </div>
    </WidgetShell>
  );
}
