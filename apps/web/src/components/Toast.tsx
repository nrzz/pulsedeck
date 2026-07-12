import { useToast } from '../store/toast';

export function Toast() {
  const message = useToast((s) => s.message);
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl
        bg-surface-2/95 border border-white/10 shadow-glass backdrop-blur-xl
        text-sm font-medium animate-toast-in"
    >
      {message}
    </div>
  );
}
