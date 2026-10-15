import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  title: string;
  subtitle?: string;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  title,
  subtitle
}) => {
  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800 text-white">
          <div>
            <h4 className="font-semibold text-lg">{title}</h4>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={photoUrl}
              download="bukti-misi-anak-hebat.jpg"
              target="_blank"
              rel="noreferrer"
              className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors text-sm flex items-center gap-1.5"
              title="Unduh / Buka Gambar Asli"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950">
          <img
            src={photoUrl}
            alt={title}
            className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
          />
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-xs text-slate-400">
          Foto Bukti Pelaksanaan Misi 7 Kebiasaan Anak Indonesia Hebat
        </div>
      </div>
    </div>
  );
};
