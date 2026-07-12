import { useEffect, useRef, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import type { WidgetProps } from '../registry';

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function StopwatchWidget({ id }: WidgetProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const elapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!running) return;
    const start = Date.now() - elapsedRef.current;
    intervalRef.current = setInterval(() => {
      const next = Date.now() - start;
      elapsedRef.current = next;
      setElapsed(next);
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const reset = () => {
    setRunning(false);
    elapsedRef.current = 0;
    setElapsed(0);
  };

  return (
    <WidgetShell id={id} title="Stopwatch">
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
          {formatElapsed(elapsed)}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-accent px-4" onClick={() => setRunning((v) => !v)}>
            {running ? 'Pause' : 'Start'}
          </button>
          <button type="button" className="btn" onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </WidgetShell>
  );
}
