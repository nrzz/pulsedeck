import { useMemo } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { formatPrice } from '../../lib/utils';
import type { WidgetProps } from '../registry';

type Holding = { symbol: string; amount: number; kind: 'stock' | 'crypto' };

export function PortfolioWidget({ id, settings }: WidgetProps) {
  const crypto = useDashboard((s) => s.crypto);
  const stocks = useDashboard((s) => s.stocks);
  const holdings = (settings.holdings as Holding[]) || [];

  const rows = useMemo(() => {
    return holdings.map((h) => {
      let price = 0;
      if (h.kind === 'stock') {
        price = stocks.find((s) => s.symbol.toUpperCase() === h.symbol.toUpperCase())?.price ?? 0;
      } else {
        const c = crypto.find(
          (c) =>
            c.id.toLowerCase() === h.symbol.toLowerCase() ||
            c.symbol.toLowerCase() === h.symbol.toLowerCase(),
        );
        price = c?.price ?? 0;
      }
      const value = h.amount * price;
      return { ...h, price, value };
    });
  }, [holdings, crypto, stocks]);

  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <WidgetShell id={id} title="Portfolio">
      {!holdings.length ? (
        <div className="text-sm text-ink-muted">Add holdings in settings</div>
      ) : (
        <div className="space-y-2">
          <div className="text-lg font-mono font-semibold tabular-nums">${formatPrice(total)}</div>
          <div className="space-y-1.5 max-h-full overflow-auto">
            {rows.map((r) => (
              <div key={`${r.kind}-${r.symbol}`} className="flex justify-between text-xs gap-2">
                <div className="min-w-0 truncate">
                  <span className="font-medium">{r.symbol}</span>
                  <span className="text-ink-muted ml-1">× {r.amount}</span>
                </div>
                <span className="font-mono tabular-nums shrink-0">
                  {r.price ? `$${formatPrice(r.value)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
