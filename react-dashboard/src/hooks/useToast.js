import { useState, useCallback } from 'react';

let toastCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastCounter;
    const newToast = { id, message, type };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    toastSuccess: (msg, dur) => addToast(msg, 'success', dur),
    toastError: (msg, dur) => addToast(msg, 'error', dur),
    toastWarning: (msg, dur) => addToast(msg, 'warning', dur),
    toastInfo: (msg, dur) => addToast(msg, 'info', dur)
  };
}
