'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (opts: { message: string; title?: string; variant?: ToastVariant; durationMs?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(({ message, title, variant = 'info', durationMs = 3500 }: { message: string; title?: string; variant?: ToastVariant; durationMs?: number }) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const toast: Toast = { id, message, title, variant, durationMs };
    setToasts(prev => [...prev, toast]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-0 pointer-events-none flex items-start justify-end p-4 gap-2 flex-col-reverse sm:flex-col sm:items-end z-[1000]">
        <div className="w-full sm:w-auto space-y-2">
          {toasts.map(t => (
            <div key={t.id} className={[
              'pointer-events-auto rounded-lg shadow-lg border px-4 py-3 bg-white/90 backdrop-blur flex items-start gap-3',
              t.variant === 'success' ? 'border-emerald-200' : '',
              t.variant === 'error' ? 'border-red-200' : '',
              t.variant === 'info' ? 'border-blue-200' : '',
              t.variant === 'warning' ? 'border-yellow-200' : '',
            ].join(' ')}>
              <div className="mt-0.5">
                {t.variant === 'success' && (<span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>)}
                {t.variant === 'error' && (<span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"></span>)}
                {t.variant === 'info' && (<span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>)}
                {t.variant === 'warning' && (<span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500"></span>)}
              </div>
              <div className="flex-1">
                {t.title && <div className="text-sm font-semibold text-slate-900">{t.title}</div>}
                <div className="text-sm text-slate-700 whitespace-pre-line">{t.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}


