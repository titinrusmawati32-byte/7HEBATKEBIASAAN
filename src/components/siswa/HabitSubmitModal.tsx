import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Play,
  Award,
  Image as ImageIcon,
  Clock,
  FileText
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
    } catch (err) {
      alert('Gagal memuat gambar');
    }
  };

  const handleUseDemoPhoto = () => {
    // Provide a sample photo tailored to the habit
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
          particleCount: 80,
          spread: 70,
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
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {}
    }
  };

  const ytEmbedUrl = materiData?.linkYt ? getYouTubeEmbedUrl(materiData.linkYt) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-5 ${habit.bgColor} border-b ${habit.borderColor} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center font-bold text-lg text-slate-800">
              #{habit.number}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                {habit.title}
              </h3>
              <p className="text-xs text-slate-600 font-medium">{habit.quote}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 text-slate-600 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-2">
          <button
            onClick={() => setActiveTab('lapor')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'lapor'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Lapor Misi Hari Ini
          </button>
          <button
            onClick={() => setActiveTab('materi')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'materi'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Materi & Kuis Interaktif
            {materiData?.kuisAktif && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'lapor' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Prompt Description */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Petunjuk Misi: </span>
                {habit.description}
              </div>

              {/* Input Jam / Catatan */}
              {habit.id === 1 ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    {habit.actionPrompt}
                  </label>
                  <input
                    type="text"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Contoh: 05:00 WIB"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                  {/* Quick Time Selector pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['04:30 WIB', '04:45 WIB', '05:00 WIB', '05:15 WIB', '05:30 WIB'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDetail(t)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          detail === t
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {habit.actionPrompt}
                  </label>
                  <textarea
                    rows={3}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder={habit.inputPlaceholder}
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                    required
                  />
                  {/* Sample suggestions */}
                  <div className="mt-2">
                    <span className="text-[11px] font-bold text-slate-400">Contoh Cepat: </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {habit.examples.map((ex, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDetail(ex)}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] transition-colors border border-slate-200"
                        >
                          + {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Evidence */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Foto Bukti Kegiatan
                  </span>
                  <button
                    type="button"
                    onClick={handleUseDemoPhoto}
                    className="text-[11px] text-emerald-600 hover:underline font-bold"
                  >
                    + Pakai Foto Sampel
                  </button>
                </label>

                {photoBase64 ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-52 flex items-center justify-center">
                    <img
                      src={photoBase64}
                      alt="Bukti Misi"
                      className="max-h-52 w-auto object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoBase64('')}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg shadow-md transition-colors"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/50 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-slate-500 mb-2">
                      <Camera className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      Ambil Foto atau Pilih Gambar
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
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

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Menyimpan Misi...' : existingData ? 'Perbarui Laporan Misi' : 'Kirim Laporan Misi Hari Ini!'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'materi' && (
            <div className="space-y-6">
              {/* Materi Teks */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Materi Karakter dari Guru Kelas:
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {materiData?.materiTeks || 'Belum ada catatan materi tambahan dari Guru untuk misi ini.'}
                </p>
              </div>

              {/* YouTube Video if available */}
              {ytEmbedUrl && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-rose-500" />
                    Video Pembelajaran:
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
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-sky-50 rounded-2xl border border-indigo-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Kuis Asah Pengetahuan Agen!
                    </h4>
                  </div>

                  <p className="text-sm font-bold text-slate-800 leading-snug">
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
                        className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-start gap-2.5 ${
                          selectedQuizOption === opt.key
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
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

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCheckQuiz}
                      disabled={!selectedQuizOption}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      Periksa Jawaban Kuis
                    </button>
                  </div>

                  {quizSubmitted && (
                    <div className={`p-3.5 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-2 ${
                      quizIsCorrect
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {quizIsCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>Luar Biasa! Jawabanmu Tepat Sekali. Kamu pantas jadi Agen Teladan!</span>
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
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  Guru belum mengaktifkan kuis untuk misi ini. Silakan baca materi di atas!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
