import { useMemo, useState } from 'react';
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
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<(typeof CATEGORIES)[number] | 'all'>('all');

  const widgets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(widgetRegistry).filter((w) => {
      if (cat !== 'all' && w.category !== cat) return false;
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.type.includes(q)
      );
    });
  }, [query, cat]);

  if (!open) return null;

  const recommended = ['cpu', 'ram', 'weather', 'clock', 'todo', 'temps', 'network-speed', 'news'];

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
          <button
            type="button"
            className="btn !p-2"
            onClick={() => setAddWidgetOpen(false)}
            data-testid="close-add-widget"
            aria-label="Close add widget"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-3 border-b border-white/5 space-y-2">
          <input
            className="input"
            placeholder="Search widgets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="widget-search"
          />
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className={`btn !py-1 !px-2 !text-xs ${cat === 'all' ? 'bg-accent/20 border-accent/40' : ''}`}
              onClick={() => setCat('all')}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`btn !py-1 !px-2 !text-xs capitalize ${cat === c ? 'bg-accent/20 border-accent/40' : ''}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-ink-muted self-center mr-1">Recommended:</span>
            {recommended.map((t) => {
              const w = widgetRegistry[t];
              if (!w) return null;
              return (
                <button
                  key={t}
                  type="button"
                  className="btn !py-0.5 !px-2 !text-[11px] !rounded-full"
                  onClick={async () => {
                    const id = uid(w.type);
                    const { w: ww, h, minW, minH } = w.defaultSize;
                    addWidget(
                      { id, type: w.type, settings: { ...(w.defaultSettings || {}) } },
                      { i: id, x: 0, y: Infinity, w: ww, h, minW, minH },
                    );
                    const latest = useDashboard.getState().config;
                    setConfig(latest);
                    await persistConfig(latest);
                    showToast(`Added ${w.name}`);
                    setAddWidgetOpen(false);
                  }}
                >
                  {w.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="overflow-y-auto p-4 space-y-5 flex-1 min-h-0">
          {(cat === 'all' ? CATEGORIES : [cat]).map((category) => {
            const list = widgets.filter((w) => w.category === category);
            if (!list.length) return null;
            return (
              <div key={category}>
                <h3 className="widget-title mb-2 capitalize">{category}</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {list.map((w) => (
                    <button
                      key={w.type}
                      type="button"
                      className="btn !items-start !flex-col !gap-1 text-left h-auto py-3"
                      onClick={async () => {
                        const id = uid(w.type);
                        const { w: ww, h, minW, minH } = w.defaultSize;
                        const newsDefaults = config.shell?.newsDefaults;
                        const settings =
                          w.type === 'news'
                            ? {
                                ...(w.defaultSettings || {}),
                                ...(newsDefaults || {}),
                                topics: newsDefaults?.topics ?? (w.defaultSettings?.topics as string[]) ?? [
                                  'technology',
                                  'world',
                                ],
                              }
                            : { ...(w.defaultSettings || {}) };
                        addWidget(
                          {
                            id,
                            type: w.type,
                            settings,
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
                      <span className="text-[11px] text-ink-muted font-normal">{w.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {!widgets.length && (
            <div className="text-sm text-ink-muted text-center py-8">No widgets match “{query}”</div>
          )}
        </div>
        <div className="p-3 text-[11px] text-ink-muted border-t border-white/5">
          {widgets.length} widgets · Active:{' '}
          {config.presets.find((p) => p.id === config.activePresetId)?.name}
        </div>
      </div>
    </div>
  );
}
