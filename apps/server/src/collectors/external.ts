import type {
  CryptoQuote,
  NewsFeedResult,
  NewsItem,
  StockQuote,
  WeatherData,
} from '@pulsedeck/shared';
import { NEWS_TOPICS, normalizeStockSymbol } from '@pulsedeck/shared';

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
      sparkline: (c.sparkline_in_7d?.price || []).slice(-24),
      image: c.image,
    }));
  } catch {
    return [];
  }
}

export async function fetchStocks(symbols: string[], apiKey?: string): Promise<StockQuote[]> {
  if (!symbols.length) return [];
  const unique = [...new Set(symbols.map(normalizeStockSymbol).filter(Boolean))];

  const results = await Promise.all(
    unique.map(async (symbol) => {
      if (apiKey) {
        try {
          const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (res.ok) {
            const q = (await res.json()) as {
              c: number;
              d: number;
              dp: number;
              h: number;
              l: number;
              o: number;
              pc: number;
            };
            if (q.c) {
              return {
                symbol,
                price: q.c,
                change: q.d,
                changePercent: q.dp,
                high: q.h,
                low: q.l,
                open: q.o,
                previousClose: q.pc,
              } satisfies StockQuote;
            }
          }
        } catch {
          /* fall through to Yahoo */
        }
      }

      // Yahoo covers ETFs, futures (GC=F / SI=F), and tickers Finnhub misses
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
          symbol,
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

export async function fetchExchange(pairs: string[]): Promise<{ pair: string; rate: number }[]> {
  const out: { pair: string; rate: number }[] = [];
  for (const pair of pairs.slice(0, 6)) {
    const [base, quote] = pair.split('/').map((s) => s.trim().toUpperCase());
    if (!base || !quote) continue;
    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) continue;
      const data = (await res.json()) as { rates?: Record<string, number> };
      const rate = data.rates?.[quote];
      if (typeof rate === 'number') out.push({ pair: `${base}/${quote}`, rate });
    } catch {
      // skip
    }
  }
  return out;
}

export async function fetchAqi(
  lat: number,
  lon: number,
  city?: string,
): Promise<{ value: number; city?: string } | null> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { current?: { us_aqi?: number } };
    const value = data.current?.us_aqi;
    if (value == null) return null;
    return { value, city };
  } catch {
    return null;
  }
}

export async function fetchHeadline(
  feedUrl: string,
): Promise<{ title: string; link?: string } | null> {
  try {
    const res = await fetch(feedUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const text = (await res.text()).slice(0, 180_000);
    const title =
      text.match(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/i)?.[1] ||
      text.match(/<item>[\s\S]*?<title>(.*?)<\/title>/i)?.[1] ||
      text.match(/<entry>[\s\S]*?<title[^>]*>(.*?)<\/title>/i)?.[1];
    const link =
      text.match(/<item>[\s\S]*?<link>(.*?)<\/link>/i)?.[1] ||
      text.match(/<entry>[\s\S]*?<link[^>]+href="([^"]+)"/i)?.[1];
    if (!title) return null;
    return { title: title.replace(/<[^>]+>/g, '').trim(), link };
  } catch {
    return null;
  }
}

const newsCache = new Map<string, { at: number; items: NewsItem[] }>();
const NEWS_CACHE_TTL = 12 * 60 * 1000;
const TITLE_MAX = 140;

function cleanText(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function truncateTitle(s: string): string {
  if (s.length <= TITLE_MAX) return s;
  return `${s.slice(0, TITLE_MAX - 1).trim()}…`;
}

function parseFeedItems(xml: string, source: string, topic: string, perFeed: number): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const block of blocks) {
    if (items.length >= perFeed) break;
    const rawTitle =
      block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] ||
      block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    if (!rawTitle) continue;
    const title = truncateTitle(cleanText(rawTitle));
    if (!title) continue;
    const link =
      block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ||
      block.match(/<link>([^<]+)<\/link>/i)?.[1] ||
      block.match(/<guid[^>]*>([^<]+)<\/guid>/i)?.[1];
    const published =
      block.match(/<pubDate>([^<]+)<\/pubDate>/i)?.[1] ||
      block.match(/<updated>([^<]+)<\/updated>/i)?.[1] ||
      block.match(/<published>([^<]+)<\/published>/i)?.[1];
    items.push({
      title,
      link: link ? cleanText(link) : undefined,
      source,
      published: published ? cleanText(published).slice(0, 40) : undefined,
      topic,
    });
  }
  return items;
}

async function fetchOneFeed(
  url: string,
  source: string,
  topic: string,
  perFeed: number,
): Promise<NewsItem[]> {
  const cached = newsCache.get(url);
  if (cached && Date.now() - cached.at < NEWS_CACHE_TTL) {
    return cached.items.slice(0, perFeed);
  }
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
    });
    if (!res.ok) return cached?.items.slice(0, perFeed) ?? [];
    // Cap download size in memory — only need early items
    const text = (await res.text()).slice(0, 180_000);
    const items = parseFeedItems(text, source, topic, perFeed);
    newsCache.set(url, { at: Date.now(), items });
    // Bound cache entries
    if (newsCache.size > 24) {
      const oldest = [...newsCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (oldest) newsCache.delete(oldest[0]);
    }
    return items;
  } catch {
    return cached?.items.slice(0, perFeed) ?? [];
  }
}

export async function fetchNews(options: {
  topics?: string[];
  feeds?: string[];
  limit?: number;
}): Promise<NewsFeedResult> {
  const limit = Math.min(40, Math.max(6, options.limit ?? 20));
  const topicIds = (
    options.topics?.length ? options.topics : ['technology', 'world', 'india']
  ).slice(0, 8);
  const customFeeds = (options.feeds || []).filter(Boolean).slice(0, 3);

  // Pull enough per topic so round-robin isn't "1 headline each"
  const perFeed = Math.max(6, Math.ceil((limit * 1.25) / Math.max(1, topicIds.length)));

  const jobs: Promise<NewsItem[]>[] = [];
  for (const id of topicIds) {
    const meta = NEWS_TOPICS.find((t) => t.id === id);
    if (!meta) continue;
    jobs.push(fetchOneFeed(meta.feed, meta.label, meta.id, perFeed));
  }
  for (let i = 0; i < customFeeds.length; i++) {
    jobs.push(fetchOneFeed(customFeeds[i], `Custom ${i + 1}`, `custom-${i}`, Math.max(6, perFeed)));
  }

  const batches = await Promise.all(jobs);
  const seen = new Set<string>();
  const merged: NewsItem[] = [];
  // Round-robin across topics/feeds for variety (not 1-per-topic when limit is small)
  let idx = 0;
  while (merged.length < limit) {
    let progressed = false;
    for (const batch of batches) {
      if (idx >= batch.length) continue;
      progressed = true;
      const item = batch[idx];
      const key = (item.link || item.title).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
        if (merged.length >= limit) break;
      }
    }
    if (!progressed) break;
    idx += 1;
  }

  return { items: merged, fetchedAt: Date.now() };
}
