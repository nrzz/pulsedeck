export function WidgetSkeleton({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="h-full flex flex-col justify-center gap-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-surface-3/60" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-24 rounded-lg bg-surface-3/60" />
          <div className="h-3 w-full rounded bg-surface-3/40" />
          <div className="h-3 w-2/3 rounded bg-surface-3/40" />
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
