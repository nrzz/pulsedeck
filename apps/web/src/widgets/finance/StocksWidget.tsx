import { useMemo, useState } from 'react';
import { STOCK_WATCHLIST_OPTIONS, normalizeStockSymbol } from '@pulsedeck/shared';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { cn, formatPrice } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function StocksWidget({ id, settings }: WidgetProps) {
  const stocks = useDashboard((s) => s.stocks);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const symbols = useMemo(
    () =>
      ((settings.symbols as string[]) || ['AAPL', 'MSFT', 'GOOGL', 'TSLA']).map(
        normalizeStockSymbol,
      ),
    [settings.symbols],
  );
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState('');

  const list = useMemo(() => {
    const wanted = new Set(symbols);
    const order = new Map(symbols.map((s, i) => [s, i]));
    return stocks
      .filter((s) => wanted.has(normalizeStockSymbol(s.symbol)))
      .sort((a, b) => (order.get(a.symbol) ?? 99) - (order.get(b.symbol) ?? 99));
  }, [stocks, symbols]);

  const save = (next: string[]) => {
    const unique = [...new Set(next.map(normalizeStockSymbol).filter(Boolean))];
    updateWidgetSettings(id, { symbols: unique });
  };

  const toggle = (idOrSymbol: string) => {
    const sym = normalizeStockSymbol(idOrSymbol);
    if (symbols.includes(sym)) save(symbols.filter((s) => s !== sym));
    else save([...symbols, sym]);
  };

  return (
    <WidgetShell id={id} title="Stocks" onSettings={() => setEditing((v) => !v)} allowScroll>
      {editing ? (
        <div className="space-y-2" data-no-drag>
          <p className="text-[11px] text-ink-muted">Tap to add / remove · any Yahoo ticker works</p>
          <div className="flex flex-wrap gap-1">
            {STOCK_WATCHLIST_OPTIONS.map((opt) => {
              const on = symbols.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`btn !py-0.5 !px-2 !text-[11px] !rounded-full ${
                    on ? 'bg-accent/20 border-accent/40' : ''
                  }`}
                  onClick={() => toggle(opt.id)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1">
            <input
              className="input !py-1 !text-xs flex-1 font-mono"
              placeholder="Custom (GLD, GC=F, RELIANCE.NS…)"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const sym = normalizeStockSymbol(custom);
                if (!sym) return;
                if (!symbols.includes(sym)) save([...symbols, sym]);
                setCustom('');
              }}
            />
            <button
              type="button"
              className="btn !text-xs"
              onClick={() => {
                const sym = normalizeStockSymbol(custom);
                if (!sym) return;
                if (!symbols.includes(sym)) save([...symbols, sym]);
                setCustom('');
              }}
            >
              Add
            </button>
          </div>
          {symbols.length > 0 && (
            <p className="text-[10px] text-ink-muted truncate">Watching: {symbols.join(', ')}</p>
          )}
          <button
            type="button"
            className="btn-accent w-full justify-center"
            onClick={() => setEditing(false)}
          >
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-1.5 min-h-0">
          {!list.length && (
            <div className="text-sm text-ink-muted space-y-1">
              <div>{stocks.length ? 'No matching tickers' : 'Loading quotes…'}</div>
              <button
                type="button"
                className="text-[10px] text-accent"
                onClick={() => setEditing(true)}
              >
                Open gear · pick Gold ETF, Silver, futures…
              </button>
            </div>
          )}
          {list.map((s) => (
            <div key={s.symbol} className="flex items-center justify-between text-[12px] gap-2">
              <span className="font-semibold truncate">{s.symbol}</span>
              <div className="text-right shrink-0">
                <div className="font-mono tabular-nums">${formatPrice(s.price)}</div>
                <div
                  className={cn(
                    'text-[10px] font-mono',
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
