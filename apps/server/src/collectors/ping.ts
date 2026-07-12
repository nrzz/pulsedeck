import ping from 'ping';
import type { PingResult } from '@pulsedeck/shared';

export async function pingHosts(hosts: string[]): Promise<PingResult[]> {
  const results = await Promise.all(
    hosts.map(async (host) => {
      try {
        const res = await ping.promise.probe(host, { timeout: 3 });
        return {
          host,
          alive: res.alive,
          timeMs: res.alive ? Number(res.time) || null : null,
          timestamp: Date.now(),
        } satisfies PingResult;
      } catch {
        return {
          host,
          alive: false,
          timeMs: null,
          timestamp: Date.now(),
        } satisfies PingResult;
      }
    }),
  );
  return results;
}
