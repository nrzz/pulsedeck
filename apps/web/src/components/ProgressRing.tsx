import { cn, formatPercent } from '../lib/utils';

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  color?: string;
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  label,
  color = 'rgb(var(--accent))',
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circ - (clamped / 100) * circ;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--surface-3))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-mono font-semibold', size > 70 ? 'text-lg' : 'text-sm')}>
          {formatPercent(clamped, clamped >= 10 ? 0 : 1)}
        </span>
        {label && <span className="text-[10px] text-ink-muted uppercase">{label}</span>}
      </div>
    </div>
  );
}
