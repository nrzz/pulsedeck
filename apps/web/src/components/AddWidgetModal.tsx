import { X } from 'lucide-react';
import { useDashboard } from '../store/dashboard';
import { widgetRegistry } from '../widgets/registry';
import { persistConfig } from '../hooks/useWebSocket';
import { useToast } from '../store/toast';
import { uid } from '../lib/utils';

const CATEGORIES = ['system', 'network', 'finance', 'extras'] as const;

export function AddWidgetModal() {
  const open = useDashboard((s) => s.addWidgetOpen);
  const setAddWidgetOpen = useDashboard((s) => s.setAddWidgetOpen);
  const addWidget = useDashboard((s) => s.addWidget);
  const config = useDashboard((s) => s.config);
  const setConfig = useDashboard((s) => s.setConfig);
  const showToast = useToast((s) => s.show);

  if (!open) return null;

  const widgets = Object.values(widgetRegistry);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setAddWidgetOpen(false)}
        aria-label="Close"
      />
      <div className="relative glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="font-semibold">Add widget</h2>
          <button type="button" className="btn !p-2" onClick={() => setAddWidgetOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-5">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <h3 className="widget-title mb-2 capitalize">{cat}</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {widgets
                  .filter((w) => w.category === cat)
                  .map((w) => (
                    <button
                      key={w.type}
                      type="button"
                      className="btn !items-start !flex-col !gap-1 text-left h-auto py-3"
                      onClick={async () => {
                        const id = uid(w.type);
                        const { w: ww, h, minW, minH } = w.defaultSize;
                        addWidget(
                          {
                            id,
                            type: w.type,
                            settings: { ...(w.defaultSettings || {}) },
                          },
                          { i: id, x: 0, y: Infinity, w: ww, h, minW, minH },
                        );
                        const latest = useDashboard.getState().config;
                        setConfig(latest);
                        await persistConfig(latest);
                        showToast(`Added ${w.name}`);
                        setAddWidgetOpen(false);
                      }}
                    >
                      <span className="font-medium">{w.name}</span>
                      <span className="text-[11px] text-ink-muted font-normal">
                        {w.description}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 text-[11px] text-ink-muted border-t border-white/5">
          Active layout: {config.presets.find((p) => p.id === config.activePresetId)?.name}
        </div>
      </div>
    </div>
  );
}
