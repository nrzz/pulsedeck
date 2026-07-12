import { create } from 'zustand';

interface ToastState {
  message: string | null;
  show: (message: string, ms?: number) => void;
  clear: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message, ms = 2200) => {
    if (timer) clearTimeout(timer);
    set({ message });
    timer = setTimeout(() => set({ message: null }), ms);
  },
  clear: () => {
    if (timer) clearTimeout(timer);
    set({ message: null });
  },
}));
