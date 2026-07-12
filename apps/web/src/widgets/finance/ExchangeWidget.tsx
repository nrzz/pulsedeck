import { useEffect, useMemo, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { formatPrice } from '../../lib/utils';
import type { WidgetProps } from '../registry';
import type { ExchangeRate } from '../../store/dashboard';

async function fetchPair(base: string, quote: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${quote}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { rates: Record<string, number> };
    return data.rates[quote] ?? null;
  } catch {
    return null;
  }
}

export function ExchangeWidget({ id, settings }: WidgetProps) {
  const storeRates = useDashboard((s) => s.exchange);
  const setExchange = useDashboard((s) => s.setExchange);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const pairs = useMemo(
    () => (settings.pairs as string[]) || ['USD/INR', 'EUR/INR'],
    [settings.pairs],
  );
  const [localRates, setLocalRates] = useState<ExchangeRate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pairs.join(', '));
  const [fetchKey, setFetchKey] = useState(0);

  const rates = useMemo(() => {
    const wanted = new Set(pairs.map((p) => p.toUpperCase()));
    const fromStore = (storeRates ?? []).filter((r) => wanted.has(r.pair.toUpperCase()));
    if (fromStore.length) return fromStore;
    return (localRates ?? []).filter((r) => wanted.has(r.pair.toUpperCase()));
  }, [storeRates, localRates, pairs]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const results: ExchangeRate[] = [];
      for (const pair of pairs) {
        const [base, quote] = pair.split('/').map((s) => s.trim().toUpperCase());
        if (!base || !quote) continue;
        const rate = await fetchPair(base, quote);
        if (rate != null) results.push({ pair: `${base}/${quote}`, rate });
      }
      if (!cancelled) {
        setLocalRates(results.length ? results : null);
        if (results.length) setExchange(results);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pairs, setExchange, fetchKey]);

  return (
    <WidgetShell
      id={id}
      title="Exchange"
      allowScroll={editing}
      onSettings={() => {
        setDraft(pairs.join(', '));
        setEditing((v) => !v);
      }}
    >
      {editing ? (
        <div className="space-y-2" data-no-drag>
          <p className="text-[11px] text-ink-muted">Pairs like USD/INR, EUR/USD</p>
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
              updateWidgetSettings(id, { pairs: next });
              setFetchKey((k) => k + 1);
              setEditing(false);
            }}
          >
            Save pairs
          </button>
        </div>
      ) : (
        <div className="space-y-2 overflow-hidden h-full min-h-0">
          {!rates.length && loading && <div className="text-sm text-ink-muted">Loading FX…</div>}
          {!rates.length && !loading && (
            <div className="text-sm text-ink-muted">No rates — check pairs in gear</div>
          )}
          {rates.slice(0, 5).map((r) => (
            <div key={r.pair} className="flex justify-between items-center text-sm gap-2">
              <span className="font-medium truncate">{r.pair}</span>
              <span className="font-mono tabular-nums shrink-0">{formatPrice(r.rate)}</span>
            </div>
          ))}
          {rates.length > 5 && (
            <div className="text-[10px] text-ink-muted">+{rates.length - 5} more</div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
