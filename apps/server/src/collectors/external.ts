import type { CryptoQuote, StockQuote, WeatherData } from '@pulsedeck/shared';

export async function fetchCrypto(ids: string[]): Promise<CryptoQuote[]> {
  if (!ids.length) return [];
  const idList = ids.join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(idList)}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      id: string;
      symbol: string;
      name: string;
      current_price: number;
      price_change_percentage_24h: number;
      sparkline_in_7d?: { price: number[] };
      image?: string;
    }>;
    return data.map((c) => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price,
      change24h: Math.round((c.price_change_percentage_24h || 0) * 100) / 100,
      sparkline: (c.sparkline_in_7d?.price || []).slice(-48),
      image: c.image,
    }));
  } catch {
    return [];
  }
}

export async function fetchStocks(symbols: string[], apiKey?: string): Promise<StockQuote[]> {
  if (!symbols.length) return [];

  // Prefer Finnhub when key is present; fall back to Yahoo unofficial chart API
  if (apiKey) {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) return null;
          const q = (await res.json()) as {
            c: number;
            d: number;
            dp: number;
            h: number;
            l: number;
            o: number;
            pc: number;
          };
          if (!q.c) return null;
          return {
            symbol: symbol.toUpperCase(),
            price: q.c,
            change: q.d,
            changePercent: q.dp,
            high: q.h,
            low: q.l,
            open: q.o,
            previousClose: q.pc,
          } satisfies StockQuote;
        } catch {
          return null;
        }
      }),
    );
    return results.filter((r): r is StockQuote => r !== null);
  }

  // Yahoo Finance chart endpoint (no key)
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'PulseDeck/1.0' },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as {
          chart?: {
            result?: Array<{
              meta: {
                regularMarketPrice: number;
                previousClose?: number;
                chartPreviousClose?: number;
                regularMarketDayHigh?: number;
                regularMarketDayLow?: number;
              };
            }>;
          };
        };
        const meta = data.chart?.result?.[0]?.meta;
        if (!meta?.regularMarketPrice) return null;
        const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice;
        const change = meta.regularMarketPrice - prev;
        const changePercent = prev ? (change / prev) * 100 : 0;
        return {
          symbol: symbol.toUpperCase(),
          price: meta.regularMarketPrice,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          high: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
          low: meta.regularMarketDayLow ?? meta.regularMarketPrice,
          open: prev,
          previousClose: prev,
        } satisfies StockQuote;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((r): r is StockQuote => r !== null);
}

export async function fetchWeather(
  lat: number,
  lon: number,
  city?: string,
): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      latitude: number;
      longitude: number;
      timezone: string;
      current: {
        temperature_2m: number;
        relative_humidity_2m: number;
        weather_code: number;
        wind_speed_10m: number;
      };
    };
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      humidity: data.current.relative_humidity_2m,
      city,
    };
  } catch {
    return null;
  }
}
