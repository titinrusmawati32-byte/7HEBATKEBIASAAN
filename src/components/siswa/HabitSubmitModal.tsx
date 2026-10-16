import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Camera,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Play,
  Award,
  Image as ImageIcon,
  Clock,
  FileText,
  RotateCcw
} from 'lucide-react';
import { HabitDefinition, HabitItemData, HabitMateri } from '../../types';
import { StorageService } from '../../services/storageService';
import { fileToBase64, getYouTubeEmbedUrl } from '../../utils/helpers';

interface HabitSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: HabitDefinition;
  username: string;
  nama: string;
  kelas: string;
  existingData: HabitItemData | null;
  onSubmitted: () => void;
}

export const HabitSubmitModal: React.FC<HabitSubmitModalProps> = ({
  isOpen,
  onClose,
  habit,
  username,
  nama,
  kelas,
  existingData,
  onSubmitted
}) => {
  const [activeTab, setActiveTab] = useState<'lapor' | 'materi'>('lapor');
  const [detail, setDetail] = useState(existingData?.detail || (habit.id === 1 ? '05:00 WIB' : ''));
  const [photoBase64, setPhotoBase64] = useState<string>(existingData?.fotoBukti || '');
  const [submitting, setSubmitting] = useState(false);
  const [materiData, setMateriData] = useState<HabitMateri | null>(null);

  // Quiz interactive state
  const [selectedQuizOption, setSelectedQuizOption] = useState<string>('');
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen || !habit) return;
    if (existingData) {
      setDetail(existingData.detail);
      setPhotoBase64(existingData.fotoBukti || '');
    } else {
      setDetail(habit.id === 1 ? '05:00 WIB' : '');
      setPhotoBase64('');
    }

    // Load educational material & quiz from teacher
    const materiRes = StorageService.getMateriHabit(kelas, habit.id);
    if (materiRes.success && materiRes.data) {
      setMateriData(materiRes.data);
    }

    setSelectedQuizOption('');
    setQuizSubmitted(false);
    setQuizIsCorrect(null);
  }, [isOpen, habit, existingData, kelas]);

  if (!isOpen || !habit) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setPhotoBase64(base64);
    } catch {
      alert('Gagal memuat gambar, silakan gunakan foto berukuran lebih kecil');
    }
  };

  const handleUseDemoPhoto = () => {
    const demoPhotos: Record<number, string> = {
      1: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      2: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
      3: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80',
      4: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
      5: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80',
      6: 'https://images.unsplash.com/photo-1594708767771-a7502209ff51?w=600&auto=format&fit=crop&q=80',
      7: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?w=600&auto=format&fit=crop&q=80'
    };
    setPhotoBase64(demoPhotos[habit.id] || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim()) {
      alert(habit.id === 1 ? 'Harap masukkan jam bangun Anda!' : 'Harap masukkan catatan kegiatan Anda!');
      return;
    }

    setSubmitting(true);
    try {
      await StorageService.simpanMisiIndividu({
        habitId: habit.id,
        username,
        nama,
        kelas,
        detail,
        fileBase64: photoBase64
      });

      setSubmitting(false);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch {}

      onSubmitted();
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      alert('Gagal menyimpan misi: ' + (err.message || err.toString()));
    }
  };

  const handleCheckQuiz = () => {
    if (!selectedQuizOption || !materiData) return;
    const isCorrect = selectedQuizOption.toUpperCase() === materiData.jawaban.toUpperCase();
    setQuizIsCorrect(isCorrect);
    setQuizSubmitted(true);

    if (isCorrect) {
      try {
        confetti({ particleCount: 60, spread: 65, origin: { y: 0.65 } });
      } catch {}
    }
  };

  const ytEmbedUrl = (materiData?.linkYt ? getYouTubeEmbedUrl(materiData.linkYt) : null) || undefined;

  // Header background theme based on Habit ID
  const getHeaderTheme = () => {
    switch (habit.id) {
      case 1:
        return {
          gradient: 'bg-gradient-to-r from-[#FFFBE8] via-[#FFF3D6] to-[#E3F5FF] border-amber-200/80',
          badgeBg: 'bg-amber-400/25 border-amber-300 text-amber-900',
          accent: '#FFA41B'
        };
      case 2:
        return {
          gradient: 'bg-gradient-to-r from-[#E8FFF4] via-[#D1FAE5] to-[#ECFEFF] border-emerald-200/80',
          badgeBg: 'bg-emerald-400/25 border-emerald-300 text-emerald-900',
          accent: '#059669'
        };
      case 3:
        return {
          gradient: 'bg-gradient-to-r from-[#F0F9FF] via-[#E0F2FE] to-[#F5F3FF] border-sky-200/80',
          badgeBg: 'bg-sky-400/25 border-sky-300 text-sky-900',
          accent: '#0284c7'
        };
      case 4:
        return {
          gradient: 'bg-gradient-to-r from-[#F5F3FF] via-[#EDE9FE] to-[#EFF6FF] border-indigo-200/80',
          badgeBg: 'bg-indigo-400/25 border-indigo-300 text-indigo-900',
          accent: '#6366f1'
        };
      case 5:
        return {
          gradient: 'bg-gradient-to-r from-[#FFF7ED] via-[#FFEDD5] to-[#FEF3C7] border-orange-200/80',
          badgeBg: 'bg-orange-400/25 border-orange-300 text-orange-900',
          accent: '#ea580c'
        };
      case 6:
        return {
          gradient: 'bg-gradient-to-r from-[#ECFDF5] via-[#D1FAE5] to-[#F0FDFA] border-teal-200/80',
          badgeBg: 'bg-teal-400/25 border-teal-300 text-teal-900',
          accent: '#0d9488'
        };
      case 7:
        return {
          gradient: 'bg-gradient-to-r from-[#FFF1F2] via-[#FFE4E6] to-[#FDF2F8] border-rose-200/80',
          badgeBg: 'bg-rose-400/25 border-rose-300 text-rose-900',
          accent: '#e11d48'
        };
      default:
        return {
          gradient: 'bg-gradient-to-r from-[#FFFBE8] via-[#FFF3D6] to-[#E3F5FF] border-amber-200/80',
          badgeBg: 'bg-amber-400/25 border-amber-300 text-amber-900',
          accent: '#FFA41B'
        };
    }
  };

  const theme = getHeaderTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      {/* BEGIN: MainModalCard */}
      <main className="w-full max-w-[590px] bg-white rounded-[36px] shadow-custom-card border border-slate-100 overflow-hidden relative flex flex-col p-5 sm:p-7 max-h-[92vh] transition-all">
        {/* BEGIN: TopHeaderSection */}
        <header className={`relative w-full rounded-2xl ${theme.gradient} overflow-hidden p-4 sm:p-5 mb-4 sm:mb-5 border`}>
          {/* Close Button (Top Right) */}
          <button
            onClick={onClose}
            aria-label="Tutup"
            type="button"
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-xs backdrop-blur-xs transition-transform active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Decorative Header Graphic (Sun & Cute Morning Illustration for Habit 1 or themed decorative SVG) */}
          <div className="absolute right-2 bottom-0 w-44 sm:w-52 h-full pointer-events-none select-none flex items-end justify-end opacity-90">
            {habit.id === 1 ? (
              <svg className="w-36 h-36 translate-y-3 translate-x-2" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Sun Glow */}
                <circle cx="100" cy="85" r="45" fill="#FDE047" fillOpacity="0.45" />
                {/* Sun Face */}
                <circle cx="100" cy="85" r="32" fill="#FFA41B" />
                {/* Sun Rays */}
                <path d="M100 42V48M100 122V128M57 85H63M137 85H143M70 55L75 60M125 110L130 115M70 115L75 110M125 60L130 55" stroke="#FFA41B" strokeWidth="4" strokeLinecap="round" />
                {/* Smiling Eyes */}
                <path d="M90 82C90 80 93 78 95 82" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M105 82C105 80 108 78 110 82" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                {/* Big Smile */}
                <path d="M93 91C96 96 104 96 107 91" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                {/* Rosy Cheeks */}
                <circle cx="88" cy="88" r="3" fill="#F43F5E" fillOpacity="0.6" />
                <circle cx="112" cy="88" r="3" fill="#F43F5E" fillOpacity="0.6" />
                {/* Morning Clouds */}
                <path d="M40 135C40 128 46 122 53 122C56 116 62 112 69 112C78 112 85 119 85 128C90 128 94 132 94 136C94 140 90 144 85 144H48C43.5 144 40 140 40 135Z" fill="#FFFFFF" fillOpacity="0.85" />
              </svg>
            ) : (
              <div className="w-28 h-28 rounded-full bg-white/40 backdrop-blur-xs flex items-center justify-center translate-y-4 translate-x-2 border border-white/60">
                <i className={`fa-solid ${habit.id === 2 ? 'fa-hands-praying text-emerald-500' : habit.id === 3 ? 'fa-person-running text-sky-500' : habit.id === 4 ? 'fa-book-open-reader text-indigo-500' : habit.id === 5 ? 'fa-apple-whole text-orange-500' : habit.id === 6 ? 'fa-hand-holding-heart text-teal-500' : 'fa-bed text-rose-500'} text-4xl opacity-80`}></i>
              </div>
            )}
          </div>

          {/* Header Content */}
          <div className="relative z-10 pr-12 max-w-[75%] sm:max-w-[70%]">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${theme.badgeBg} border text-[11px] font-black uppercase tracking-wider mb-1.5`}>
              <i className="fa-solid fa-star text-amber-500 text-[10px]"></i>
              <span>MISI #{habit.number}: {habit.badgeText || 'Karakter Emas'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {habit.shortTitle || habit.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1 line-clamp-2">
              {habit.quote}
            </p>
          </div>
        </header>

        {/* BEGIN: TabButtons */}
        <div className="flex border-b border-slate-200 mb-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('lapor')}
            className={`pb-3 px-3 font-extrabold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'lapor'
                ? 'border-[#00BA63] text-[#00BA63]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Lapor Misi Hari Ini</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('materi')}
            className={`pb-3 px-3 font-extrabold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'materi'
                ? 'border-[#00BA63] text-[#00BA63]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Materi & Kuis</span>
            {materiData?.kuisAktif && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scroll pr-1 space-y-4">
          {activeTab === 'lapor' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Petunjuk Box */}
              <div className="p-3.5 bg-[#F0F8FF] rounded-2xl border border-sky-100 text-[#18385C] text-xs font-medium leading-relaxed">
                <span className="font-black text-slate-900">Petunjuk Misi: </span>
                {habit.description}
              </div>

              {/* Input Jam Bangun (Habit 1) atau Catatan (Habit 2-7) */}
              {habit.id === 1 ? (
                <div>
                  <label className="block text-xs font-black text-[#18385C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#FFA41B]" />
                    <span>Pukul berapa kamu bangun pagi hari ini? *</span>
                  </label>
                  <input
                    type="text"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Contoh: 05:00 WIB"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BA63] bg-slate-50/50"
                    required
                  />
                  {/* Quick Time Selector Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {['04:30 WIB', '04:45 WIB', '05:00 WIB', '05:15 WIB', '05:30 WIB', '05:45 WIB', '06:00 WIB'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDetail(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          detail === t
                            ? 'bg-[#FFA41B] text-white border-amber-600 shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-black text-[#18385C] uppercase tracking-wider mb-2">
                    {habit.actionPrompt} *
                  </label>
                  <textarea
                    rows={3}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder={habit.inputPlaceholder}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BA63] bg-slate-50/50 leading-relaxed"
                    required
                  />
                  {/* Quick Suggestions */}
                  {habit.examples && habit.examples.length > 0 && (
                    <div className="mt-2">
                      <span className="text-[11px] font-bold text-slate-400">Pilihan Cepat: </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {habit.examples.map((ex, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setDetail(ex)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-bold transition-colors border border-slate-200 cursor-pointer"
                          >
                            + {ex}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Foto Bukti */}
              <div>
                <label className="block text-xs font-black text-[#18385C] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#00BA63]" />
                    <span>Foto Bukti Kegiatan</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleUseDemoPhoto}
                    className="text-[11px] text-[#00BA63] hover:underline font-extrabold cursor-pointer"
                  >
                    + Pakai Foto Sampel
                  </button>
                </label>

                {photoBase64 ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-48 flex items-center justify-center group">
                    <img
                      src={photoBase64}
                      alt="Bukti Misi"
                      className="max-h-48 w-auto object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoBase64('')}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl shadow-md transition-colors cursor-pointer"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#00BA63] rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/60 hover:bg-emerald-50/40 transition-all">
                    <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#00BA63] mb-2 border border-slate-100">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                      Ambil Foto atau Pilih Gambar
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Format JPG, PNG (Otomatis dikompres)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 sm:py-4 px-5 bg-[#00BA63] hover:bg-[#009e53] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-btn-green btn-glossy transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {submitting
                      ? 'Menyimpan Misi...'
                      : existingData
                      ? 'Perbarui Laporan Misi'
                      : 'Kirim Laporan Misi Hari Ini!'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'materi' && (
            <div className="space-y-4">
              {/* Materi Teks Card */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                <h4 className="font-extrabold text-amber-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Catatan Karakter dari Guru Kelas:</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                  {materiData?.materiTeks || 'Belum ada catatan materi khusus dari Guru untuk misi ini.'}
                </p>
              </div>

              {/* YouTube Video Embed */}
              {ytEmbedUrl && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-rose-500" />
                    <span>Video Motivasi:</span>
                  </h4>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-inner bg-slate-900">
                    <iframe
                      src={ytEmbedUrl}
                      title="Materi Habit"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              {/* Kuis Interaktif */}
              {materiData?.kuisAktif && materiData.pertanyaan ? (
                <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50 to-sky-50 rounded-2xl border border-indigo-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Kuis Asah Pengetahuan Agen!
                    </h4>
                  </div>

                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug">
                    {materiData.pertanyaan}
                  </p>

                  <div className="space-y-2">
                    {[
                      { key: 'A', text: materiData.opsiA },
                      { key: 'B', text: materiData.opsiB },
                      { key: 'C', text: materiData.opsiC }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setSelectedQuizOption(opt.key);
                          setQuizSubmitted(false);
                          setQuizIsCorrect(null);
                        }}
                        className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-bold transition-all flex items-start gap-2.5 cursor-pointer ${
                          selectedQuizOption === opt.key
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          selectedQuizOption === opt.key ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {opt.key}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleCheckQuiz}
                      disabled={!selectedQuizOption}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
                    >
                      Periksa Jawaban Kuis
                    </button>
                  </div>

                  {quizSubmitted && (
                    <div className={`p-3 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-2 ${
                      quizIsCorrect
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {quizIsCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>Luar Biasa! Jawabanmu Tepat Sekali. Kamu pantas jadi Agen Teladan! ⭐</span>
                        </>
                      ) : (
                        <>
                          <X className="w-5 h-5 text-rose-600 shrink-0" />
                          <span>Jawaban belum tepat, yuk coba baca materinya lagi dan pilih opsi lain!</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
                  Belum ada kuis aktif untuk misi ini.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
