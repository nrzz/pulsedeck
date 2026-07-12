import { useMemo, useState } from 'react';
import { CRYPTO_WATCHLIST_OPTIONS, normalizeCryptoId } from '@pulsedeck/shared';
import { WidgetShell } from '../../components/WidgetShell';
import { Sparkline } from '../../components/Sparkline';
import { useDashboard } from '../../store/dashboard';
import { cn, formatPrice } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function CryptoWidget({ id, settings }: WidgetProps) {
  const crypto = useDashboard((s) => s.crypto);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const symbols = useMemo(
    () =>
      ((settings.symbols as string[]) || ['bitcoin', 'ethereum', 'solana']).map(normalizeCryptoId),
    [settings.symbols],
  );
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState('');

  const list = useMemo(() => {
    if (!crypto.length) return [];
    const order = new Map(symbols.map((s, i) => [s, i]));
    return [...crypto]
      .filter((c) => order.has(c.id.toLowerCase()) || symbols.includes(normalizeCryptoId(c.symbol)))
      .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  }, [crypto, symbols]);

  const save = (next: string[]) => {
    const unique = [...new Set(next.map(normalizeCryptoId).filter(Boolean))];
    updateWidgetSettings(id, { symbols: unique });
  };

  const toggle = (coinId: string) => {
    const idNorm = normalizeCryptoId(coinId);
    if (symbols.includes(idNorm)) save(symbols.filter((s) => s !== idNorm));
    else save([...symbols, idNorm]);
  };

  return (
    <WidgetShell id={id} title="Crypto" onSettings={() => setEditing((v) => !v)} allowScroll>
      {editing ? (
        <div className="space-y-2" data-no-drag>
          <p className="text-[11px] text-ink-muted">Tap to add / remove · CoinGecko ids</p>
          <div className="flex flex-wrap gap-1">
            {CRYPTO_WATCHLIST_OPTIONS.map((opt) => {
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
              placeholder="Custom id (e.g. monero)"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const idNorm = normalizeCryptoId(custom);
                if (!idNorm) return;
                if (!symbols.includes(idNorm)) save([...symbols, idNorm]);
                setCustom('');
              }}
            />
            <button
              type="button"
              className="btn !text-xs"
              onClick={() => {
                const idNorm = normalizeCryptoId(custom);
                if (!idNorm) return;
                if (!symbols.includes(idNorm)) save([...symbols, idNorm]);
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
              <div>{crypto.length ? 'No matching coins' : 'Loading quotes…'}</div>
              <button
                type="button"
                className="text-[10px] text-accent"
                onClick={() => setEditing(true)}
              >
                Open gear · pick BTC, ETH, PAXG…
              </button>
            </div>
          )}
          {list.map((c) => (
            <div key={c.id} className="flex items-center gap-2 min-w-0">
              {c.image && <img src={c.image} alt="" className="w-4 h-4 rounded-full shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-[12px] truncate">{c.symbol}</span>
                  <span className="font-mono text-[12px] tabular-nums shrink-0">
                    ${formatPrice(c.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span
                    className={cn(
                      'text-[10px] font-mono',
                      c.change24h >= 0 ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {c.change24h >= 0 ? '+' : ''}
                    {c.change24h.toFixed(2)}%
                  </span>
                  <div className="w-16 shrink-0">
                    <Sparkline
                      data={c.sparkline}
                      color={c.change24h >= 0 ? '#34d399' : '#f87171'}
                      height={16}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
