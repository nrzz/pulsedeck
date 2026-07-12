import { useMemo } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { cn, formatPrice } from '../../lib/utils';
import type { WidgetProps } from '../registry';

type TickerItem = {
  key: string;
  label: string;
  price: number;
  change: number;
  kind: 'crypto' | 'stock';
};

export function MarketStripWidget({ id }: WidgetProps) {
  const crypto = useDashboard((s) => s.crypto);
  const stocks = useDashboard((s) => s.stocks);

  const items = useMemo<TickerItem[]>(() => {
    const list: TickerItem[] = [];
    for (const c of crypto.slice(0, 6)) {
      list.push({
        key: `c-${c.id}`,
        label: c.symbol.toUpperCase(),
        price: c.price,
        change: c.change24h,
        kind: 'crypto',
      });
    }
    for (const s of stocks.slice(0, 6)) {
      list.push({
        key: `s-${s.symbol}`,
        label: s.symbol,
        price: s.price,
        change: s.changePercent,
        kind: 'stock',
      });
    }
    return list;
  }, [crypto, stocks]);

  return (
    <WidgetShell id={id} title="Market Strip">
      {!items.length ? (
        <div className="text-sm text-ink-muted">Loading quotes…</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {items.map((item) => (
            <div
              key={item.key}
              className="shrink-0 rounded-lg bg-surface-3/50 px-3 py-2 min-w-[100px]"
            >
              <div className="text-[10px] text-ink-muted uppercase">{item.kind}</div>
              <div className="font-semibold text-sm">{item.label}</div>
              <div className="font-mono text-xs tabular-nums">${formatPrice(item.price)}</div>
              <div
                className={cn(
                  'text-[10px] font-mono tabular-nums',
                  item.change >= 0 ? 'text-emerald-400' : 'text-red-400',
                )}
              >
                {item.change >= 0 ? '+' : ''}
                {item.change.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
