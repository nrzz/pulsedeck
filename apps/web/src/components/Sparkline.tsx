import { useId, useMemo } from 'react';

interface SparklineProps {
  data: { t: number; v: number }[] | number[];
  color?: string;
  height?: number;
}

/** Tiny SVG sparkline — no chart library (keeps memory/CPU low). */
export function Sparkline({ data, color = 'rgb(var(--accent))', height = 56 }: SparklineProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `spark-${uid}`;

  const points = useMemo(() => {
    if (!data?.length) return [] as { t: number; v: number }[];
    return typeof data[0] === 'number'
      ? (data as number[]).map((v, i) => ({ t: i, v }))
      : (data as { t: number; v: number }[]);
  }, [data]);

  const path = useMemo(() => {
    if (points.length < 2) return null;
    const vals = points.map((p) => p.v);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const w = 100;
    const h = 100;
    const pad = 4;
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = pad + (1 - (p.v - min) / span) * (h - pad * 2);
      return [x, y] as const;
    });
    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(2)},${c[1].toFixed(2)}`)
      .join(' ');
    const area = `${line} L${w},${h} L0,${h} Z`;
    return { line, area };
  }, [points]);

  if (!points.length || !path) {
    return (
      <div className="rounded-md bg-surface-3/50 animate-pulse" style={{ height }} aria-hidden />
    );
  }

  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="block overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={path.area} fill={`url(#${gradId})`} />
      <path
        d={path.line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
