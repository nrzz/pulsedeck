import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { formatUptime } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function SystemInfoWidget({ id }: WidgetProps) {
  const system = useDashboard((s) => s.metrics?.system);

  return (
    <WidgetShell id={id} title="System">
      <div className="space-y-2 text-sm">
        <div>
          <div className="text-ink-muted text-xs">Host</div>
          <div className="font-medium truncate">{system?.hostname ?? '—'}</div>
        </div>
        <div>
          <div className="text-ink-muted text-xs">OS</div>
          <div className="truncate">{system ? `${system.platform} ${system.release}` : '—'}</div>
        </div>
        <div>
          <div className="text-ink-muted text-xs">Uptime</div>
          <div className="font-mono">{system ? formatUptime(system.uptime) : '—'}</div>
        </div>
        {(system?.manufacturer || system?.model) && (
          <div className="text-xs text-ink-muted truncate">
            {[system.manufacturer, system.model].filter(Boolean).join(' ')}
          </div>
        )}
      </div>
    </WidgetShell>
  );
}
