import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  CRYPTO_WATCHLIST_OPTIONS,
  STOCK_WATCHLIST_OPTIONS,
  normalizeCryptoId,
  normalizeStockSymbol,
} from '@pulsedeck/shared';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { formatPrice } from '../../lib/utils';
import type { WidgetProps } from '../registry';

type Holding = { symbol: string; amount: number; kind: 'stock' | 'crypto' };

export function PortfolioWidget({ id, settings }: WidgetProps) {
  const crypto = useDashboard((s) => s.crypto);
  const stocks = useDashboard((s) => s.stocks);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const holdings = useMemo(() => (settings.holdings as Holding[]) || [], [settings.holdings]);
  const [editing, setEditing] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('1');
  const [kind, setKind] = useState<'stock' | 'crypto'>('stock');

  const save = (next: Holding[]) => updateWidgetSettings(id, { holdings: next });

  const rows = useMemo(() => {
    return holdings.map((h) => {
      let price = 0;
      if (h.kind === 'stock') {
        const want = normalizeStockSymbol(h.symbol);
        price = stocks.find((s) => normalizeStockSymbol(s.symbol) === want)?.price ?? 0;
      } else {
        const want = normalizeCryptoId(h.symbol);
        const c = crypto.find(
          (c) => c.id.toLowerCase() === want || normalizeCryptoId(c.symbol) === want,
        );
        price = c?.price ?? 0;
      }
      const value = h.amount * price;
      return { ...h, price, value };
    });
  }, [holdings, crypto, stocks]);

  const total = rows.reduce((sum, r) => sum + r.value, 0);

  const addHolding = (raw: string, amt: number, k: 'stock' | 'crypto') => {
    const sym = k === 'stock' ? normalizeStockSymbol(raw) : normalizeCryptoId(raw);
    if (!sym || !Number.isFinite(amt) || amt <= 0) return;
    save([...holdings, { symbol: sym, amount: amt, kind: k }]);
  };

  const options = kind === 'stock' ? STOCK_WATCHLIST_OPTIONS : CRYPTO_WATCHLIST_OPTIONS;

  return (
    <WidgetShell id={id} title="Portfolio" allowScroll onSettings={() => setEditing((v) => !v)}>
      {editing ? (
        <div className="space-y-2" data-no-drag>
          {holdings.map((h, i) => (
            <div key={`${h.kind}-${h.symbol}-${i}`} className="flex items-center gap-2 text-xs">
              <span className="flex-1 truncate">
                {h.symbol} × {h.amount} ({h.kind})
              </span>
              <button
                type="button"
                className="text-ink-muted hover:text-red-400"
                onClick={() => save(holdings.filter((_, idx) => idx !== i))}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            {(['stock', 'crypto'] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={`btn flex-1 justify-center !text-xs ${kind === k ? 'bg-accent/20 border-accent/40' : ''}`}
                onClick={() => setKind(k)}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="btn !py-0.5 !px-2 !text-[11px] !rounded-full"
                onClick={() => {
                  const amt = Number(amount) || 1;
                  addHolding(opt.id, amt, kind);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input !text-xs font-mono"
              placeholder={kind === 'stock' ? 'Ticker / gold / GC=F' : 'CoinGecko id'}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
            <input
              className="input !text-xs"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn w-full justify-center"
            onClick={() => {
              addHolding(symbol, Number(amount), kind);
              setSymbol('');
              setAmount('1');
            }}
          >
            <Plus size={14} /> Add holding
          </button>
          <button
            type="button"
            className="btn-accent w-full justify-center"
            onClick={() => setEditing(false)}
          >
            Done
          </button>
        </div>
      ) : !holdings.length ? (
        <button
          type="button"
          className="text-sm text-ink-muted hover:text-accent"
          onClick={() => setEditing(true)}
        >
          Add holdings…
        </button>
      ) : (
        <div className="space-y-2 min-h-0">
          <div className="text-lg font-mono font-semibold tabular-nums">${formatPrice(total)}</div>
          <div className="space-y-1.5">
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
