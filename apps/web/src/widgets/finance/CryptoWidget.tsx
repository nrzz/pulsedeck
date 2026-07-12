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
        <div className="space-y-2">
          {!list.length && <div className="text-sm text-ink-muted">Loading quotes…</div>}
          {list.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              {c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full" />}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">{c.symbol}</span>
                  <span className="font-mono text-sm">${formatPrice(c.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={cn(
                      'text-xs font-mono',
                      c.change24h >= 0 ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {c.change24h >= 0 ? '+' : ''}
                    {c.change24h.toFixed(2)}%
                  </span>
                  <div className="w-20">
                    <Sparkline
                      data={c.sparkline}
                      color={c.change24h >= 0 ? '#34d399' : '#f87171'}
                      height={20}
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
