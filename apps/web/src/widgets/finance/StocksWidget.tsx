import { useMemo, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { cn, formatPrice } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function StocksWidget({ id, settings }: WidgetProps) {
  const stocks = useDashboard((s) => s.stocks);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const symbols = useMemo(
    () => (settings.symbols as string[]) || ['AAPL', 'MSFT', 'GOOGL', 'TSLA'],
    [settings.symbols],
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(symbols.join(', '));

  const list = useMemo(() => {
    const wanted = new Set(symbols.map((s) => s.toUpperCase()));
    return stocks.filter((s) => wanted.has(s.symbol.toUpperCase()));
  }, [stocks, symbols]);

  return (
    <WidgetShell
      id={id}
      title="Stocks"
      onSettings={() => {
        setDraft(symbols.join(', '));
        setEditing((v) => !v);
      }}
    >
      {editing ? (
        <div className="space-y-2">
          <p className="text-[11px] text-ink-muted">Ticker symbols (e.g. AAPL, MSFT)</p>
          <textarea
            className="input h-20 resize-none font-mono text-xs"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            className="btn-accent w-full justify-center"
            onClick={() => {
              const next = draft
                .split(',')
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean);
              updateWidgetSettings(id, { symbols: next });
              setEditing(false);
            }}
          >
            Save watchlist
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {!list.length && <div className="text-sm text-ink-muted">Loading quotes…</div>}
          {list.map((s) => (
            <div key={s.symbol} className="flex items-center justify-between text-sm">
              <span className="font-semibold">{s.symbol}</span>
              <div className="text-right">
                <div className="font-mono">${formatPrice(s.price)}</div>
                <div
                  className={cn(
                    'text-xs font-mono',
                    s.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {s.changePercent >= 0 ? '+' : ''}
                  {s.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
