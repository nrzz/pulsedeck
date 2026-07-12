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

const MAX_VISIBLE = 6;

export function MarketStripWidget({ id }: WidgetProps) {
  const crypto = useDashboard((s) => s.crypto);
  const stocks = useDashboard((s) => s.stocks);

  const all = useMemo<TickerItem[]>(() => {
    const list: TickerItem[] = [];
    for (const c of crypto) {
      list.push({
        key: `c-${c.id}`,
        label: c.symbol.toUpperCase(),
        price: c.price,
        change: c.change24h,
        kind: 'crypto',
      });
    }
    for (const s of stocks) {
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

  const items = all.slice(0, MAX_VISIBLE);
  const more = all.length - items.length;

  return (
    <WidgetShell id={id} title="Market Strip">
      {!items.length ? (
        <div className="text-sm text-ink-muted">Loading quotes…</div>
      ) : (
        <div className="flex gap-2 overflow-hidden items-start">
          {items.map((item) => (
            <div
              key={item.key}
              className="shrink-0 rounded-lg bg-surface-3/50 px-2.5 py-1.5 min-w-[88px]"
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
          {more > 0 && (
            <div className="shrink-0 self-center text-[10px] text-ink-muted px-1">+{more} more</div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
