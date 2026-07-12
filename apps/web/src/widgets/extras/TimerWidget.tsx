import { useEffect, useRef, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { cn } from '../../lib/utils';
import type { WidgetProps } from '../registry';

const POMODORO_SEC = 25 * 60;

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TimerWidget({ id }: WidgetProps) {
  const [remaining, setRemaining] = useState(POMODORO_SEC);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const reset = () => {
    setRunning(false);
    setRemaining(POMODORO_SEC);
  };

  return (
    <WidgetShell id={id} title="Pomodoro">
      <div className="flex flex-col items-center justify-center h-full min-h-0 gap-2 overflow-hidden">
        <div className="font-mono text-2xl font-semibold tabular-nums tracking-tight leading-none">
          {formatTime(remaining)}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            className={cn('btn-accent !px-3 !py-1 !text-xs', running && 'opacity-80')}
            onClick={() => setRunning((v) => !v)}
          >
            {running ? 'Pause' : 'Start'}
          </button>
          <button type="button" className="btn !px-3 !py-1 !text-xs" onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </WidgetShell>
  );
}
