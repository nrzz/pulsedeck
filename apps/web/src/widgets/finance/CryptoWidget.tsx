import { useMemo, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { Sparkline } from '../../components/Sparkline';
import { useDashboard } from '../../store/dashboard';
import { cn, formatPrice } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function CryptoWidget({ id, settings }: WidgetProps) {
  const crypto = useDashboard((s) => s.crypto);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const symbols = useMemo(
    () => (settings.symbols as string[]) || ['bitcoin', 'ethereum', 'solana'],
    [settings.symbols],
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(symbols.join(', '));

  const list = useMemo(() => {
    if (!crypto.length) return [];
    const order = new Map(symbols.map((s, i) => [s.toLowerCase(), i]));
    return [...crypto]
      .filter(
        (c) =>
          order.has(c.id.toLowerCase()) ||
          symbols.map((s) => s.toLowerCase()).includes(c.symbol.toLowerCase()),
      )
      .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  }, [crypto, symbols]);

  return (
    <WidgetShell
      id={id}
      title="Crypto"
      onSettings={() => {
        setDraft(symbols.join(', '));
        setEditing((v) => !v);
      }}
      allowScroll={editing}
    >
      {editing ? (
        <div className="space-y-2">
          <p className="text-[11px] text-ink-muted">
            CoinGecko IDs (e.g. bitcoin, ethereum, solana)
          </p>
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
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean);
              updateWidgetSettings(id, { symbols: next });
              setEditing(false);
            }}
          >
            Save watchlist
          </button>
        </div>
      ) : (
        <div className="space-y-1.5 h-full min-h-0 overflow-hidden">
          {!list.length && (
            <div className="text-sm text-ink-muted space-y-1">
              <div>{crypto.length ? 'No matching coins' : 'Loading quotes…'}</div>
              {crypto.length > 0 && (
                <div className="text-[10px]">Open gear and use CoinGecko ids (bitcoin, ethereum)</div>
              )}
            </div>
          )}
          {list.slice(0, 4).map((c) => (
            <div key={c.id} className="flex items-center gap-2 min-w-0">
              {c.image && <img src={c.image} alt="" className="w-4 h-4 rounded-full shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-[12px] truncate">{c.symbol}</span>
                  <span className="font-mono text-[12px] tabular-nums shrink-0">${formatPrice(c.price)}</span>
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
          {list.length > 4 && (
            <div className="text-[10px] text-ink-muted">+{list.length - 4} more</div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
