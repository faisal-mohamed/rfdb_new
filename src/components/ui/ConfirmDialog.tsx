'use client';

import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmText = 'Proceed', cancelText = 'Cancel', onConfirm, onCancel, variant = 'warning' }: ConfirmDialogProps) {
  if (!open) return null;
  const confirmClass = variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700';
  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl border w-full max-w-md p-5">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
          </div>
          <div className="flex-1">
            {title && <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>}
            <p className="text-sm text-slate-700 whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">{cancelText}</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-md ${confirmClass}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}


