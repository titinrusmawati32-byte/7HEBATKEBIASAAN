import React, { useRef } from 'react';
import { X, Printer, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { HABIT_DEFINITIONS } from '../../data/habitDefinitions';
import { formatDateIndonesian } from '../../utils/helpers';

interface PiagamModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaNama: string;
  siswaKelas: string;
  siswaNisn: string;
}

export const PiagamModal: React.FC<PiagamModalProps> = ({
  isOpen,
  onClose,
  siswaNama,
  siswaKelas,
  siswaNisn
}) => {
  if (!isOpen) return null;

  const schoolConfig = StorageService.getPengaturanKop().data;
  const guruPengaturan = StorageService.getPengaturanGuru(siswaKelas).data;
  const completedHabits = StorageService.cekStatusMisiHariIni(siswaNisn);

  const handlePrint = () => {
    window.print();
  };

  const tempatCetak = guruPengaturan?.tempatCetak || 'Jakarta';
  const tanggalCetak = guruPengaturan?.tanggalCetak ? formatDateIndonesian(guruPengaturan.tanggalCetak) : formatDateIndonesian(new Date().toISOString().substring(0, 10));
  const namaGuru = guruPengaturan?.namaGuru || 'Ibu Guru Kelas';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden">
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Piagam Penghargaan Karakter Emas</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Piagam (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas */}
        <div className="p-6 sm:p-10 bg-amber-50/40 relative">
          {/* Border Frame */}
          <div className="relative border-8 border-double border-amber-600/70 p-6 sm:p-10 rounded-2xl bg-white shadow-lg space-y-6 text-center">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-600"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-600"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-600"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-600"></div>

            {/* School Header */}
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest font-extrabold text-amber-800">
                {schoolConfig.namaSekolah}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 uppercase tracking-wider font-display text-amber-700">
                PIAGAM PENGHARGAAN
              </h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                BINTANG 7 KEBIASAAN ANAK INDONESIA HEBAT
              </div>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 max-w-2xl mx-auto text-slate-700">
              <p className="text-xs sm:text-sm italic">
                Dengan bangga dan penuh apresiasi diberikan kepada:
              </p>

              <div className="py-2 border-b-2 border-dashed border-amber-400 inline-block px-8">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {siswaNama}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                NISN: {siswaNisn} • {siswaKelas}
              </p>

              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                Atas dedikasi, kedisiplinan, dan keteladanan dalam mempraktikkan serta mengisi jurnal harian{' '}
                <strong>7 Kebiasaan Anak Indonesia Hebat</strong>: Bangun Pagi, Beribadah, Berolahraga, Gemar Belajar, Makan Sehat, Membantu Sesama, dan Tidur Tepat Waktu.
              </p>
            </div>

            {/* 7 Habits Badge Checklist Stamps */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-2 pb-4">
              {HABIT_DEFINITIONS.map((h) => {
                const isCompleted = completedHabits.includes(h.id);
                return (
                  <div
                    key={h.id}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 ${
                      isCompleted
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center font-bold text-xs text-amber-700">
                      {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : h.id}
                    </div>
                    <span className="text-[10px] font-bold truncate max-w-full">
                      {h.shortTitle}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 max-w-xl mx-auto text-xs sm:text-sm">
              <div className="space-y-12 text-center">
                <p className="text-slate-600">Mengetahui,<br />Kepala Sekolah</p>
                <div>
                  <p className="font-bold text-slate-900 border-b border-slate-800 pb-1 inline-block min-w-[140px]">
                    {schoolConfig.usernameKepsek || 'Kepala Sekolah'}
                  </p>
                  <p className="text-[11px] text-slate-500">Komandan Sekolah</p>
                </div>
              </div>

              <div className="space-y-12 text-center">
                <p className="text-slate-600">{tempatCetak}, {tanggalCetak}<br />Guru Kelas</p>
                <div>
                  <p className="font-bold text-slate-900 border-b border-slate-800 pb-1 inline-block min-w-[140px]">
                    {namaGuru}
                  </p>
                  <p className="text-[11px] text-slate-500">Wali / Pengampu {siswaKelas}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
