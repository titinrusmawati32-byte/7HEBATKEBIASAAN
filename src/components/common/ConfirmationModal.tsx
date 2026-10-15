import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, LogOut, X, Loader2 } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  type?: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  type = 'danger',
  title,
  message,
  confirmLabel,
  cancelLabel = 'Batal',
  isLoading = false,
  onConfirm,
  onClose
}) => {
  // Listen for Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isLogout = type === 'warning' || title.toLowerCase().includes('keluar');
  const defaultConfirmLabel = isLogout ? 'Ya, Keluar' : 'Ya, Hapus Permanen';
  const finalConfirmLabel = confirmLabel || defaultConfirmLabel;

  const getIcon = () => {
    if (isLogout) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <LogOut className="w-6 h-6" />
        </div>
      );
    }
    if (type === 'danger') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <Trash2 className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-6 h-6" />
      </div>
    );
  };

  const getButtonClass = () => {
    if (isLogout) {
      return 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20';
    }
    if (type === 'danger') {
      return 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20';
    }
    return 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-start gap-4">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <h3 id="confirm-modal-title" className="text-base font-extrabold text-slate-900 leading-snug">
              {title}
            </h3>
            <p className="mt-1 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-40"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${getButtonClass()}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{finalConfirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
