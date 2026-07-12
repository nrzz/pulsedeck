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
  const pairs = useMemo(
    () => (settings.pairs as string[]) || ['USD/INR'],
    [settings.pairs],
  );
  const [localRates, setLocalRates] = useState<ExchangeRate[] | null>(null);
  const [loading, setLoading] = useState(false);

  const rates = storeRates ?? localRates;

  useEffect(() => {
    if (storeRates?.length) return;
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
  }, [pairs, storeRates, setExchange]);

  return (
    <WidgetShell id={id} title="Exchange">
      <div className="space-y-2 overflow-hidden h-full min-h-0">
        {!rates?.length && loading && (
          <div className="text-sm text-ink-muted">Loading FX…</div>
        )}
        {!rates?.length && !loading && (
          <div className="text-sm text-ink-muted">No rates available</div>
        )}
        {rates?.slice(0, 5).map((r) => (
          <div key={r.pair} className="flex justify-between items-center text-sm gap-2">
            <span className="font-medium truncate">{r.pair}</span>
            <span className="font-mono tabular-nums shrink-0">{formatPrice(r.rate)}</span>
          </div>
        ))}
        {(rates?.length ?? 0) > 5 && (
          <div className="text-[10px] text-ink-muted">+{(rates?.length ?? 0) - 5} more</div>
        )}
      </div>
    </WidgetShell>
  );
}
