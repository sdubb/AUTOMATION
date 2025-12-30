import { useState, useCallback } from 'react';
import { ToastMessage } from '../components/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration = 3000
  ) => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = (message: string, duration?: number) => addToast(message, 'success', duration || 3000);
  const error = (message: string, duration?: number) => addToast(message, 'error', duration || 4000);
  const info = (message: string, duration?: number) => addToast(message, 'info', duration || 3000);
  const warning = (message: string, duration?: number) => addToast(message, 'warning', duration || 3500);

  return { toasts, addToast, removeToast, success, error, info, warning };
};
