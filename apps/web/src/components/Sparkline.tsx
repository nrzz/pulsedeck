import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineProps {
  data: { t: number; v: number }[] | number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = 'rgb(var(--accent))', height = 56 }: SparklineProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `spark-${uid}`;

  const points =
    typeof data[0] === 'number'
      ? (data as number[]).map((v, i) => ({ t: i, v }))
      : (data as { t: number; v: number }[]);

  if (!points.length) {
    return (
      <div className="rounded-lg bg-surface-3/40 animate-pulse" style={{ height }} aria-hidden />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={['auto', 'auto']} />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          fill={`url(#${gradId})`}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
