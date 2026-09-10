import { useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export function useToast() {
  const toast = useCallback((type: ToastType, message: string) => {
    const event = new CustomEvent('toast', { detail: { type, message } });
    window.dispatchEvent(event);
  }, []);

  return {
    success: (msg: string) => toast('success', msg),
    error: (msg: string) => toast('error', msg),
    info: (msg: string) => toast('info', msg),
    warning: (msg: string) => toast('warning', msg),
  };
}
