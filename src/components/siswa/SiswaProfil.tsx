import React, { useState, useEffect } from 'react';
import {
  User,
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  Save,
  Check,
  Star,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { UserSession } from '../../types';
import { StorageService } from '../../services/storageService';
import { HABIT_DEFINITIONS } from '../../data/habitDefinitions';

interface SiswaProfilProps {
  session: UserSession;
  onOpenPiagam: () => void;
  streakCount: number;
  totalMisiCompleted: number;
  onLogout?: () => void;
}

export const SiswaProfil: React.FC<SiswaProfilProps> = ({
  session,
  onOpenPiagam,
  streakCount,
  totalMisiCompleted,
  onLogout
}) => {
  const [motto, setMotto] = useState<string>('');
  const [isEditingMotto, setIsEditingMotto] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const currentMotto = StorageService.getSiswaMotto(session.username);
    setMotto(currentMotto);
  }, [session.username]);

  const handleSaveMotto = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.setSiswaMotto(session.username, motto);
    setIsEditingMotto(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Character rank title
  const getRankBadge = (count: number) => {
    if (count >= 30) return { title: 'Bintang Emas Teladan Nasional', level: 'Tingkat IV', color: 'from-amber-500 to-yellow-600' };
    if (count >= 15) return { title: 'Agen Teladan Karakter Unggul', level: 'Tingkat III', color: 'from-emerald-500 to-teal-600' };
    if (count >= 7) return { title: 'Agen Pembelajar Disiplin', level: 'Tingkat II', color: 'from-sky-500 to-indigo-600' };
    return { title: 'Agen Cilik Penjelajah Kebiasaan', level: 'Tingkat I', color: 'from-indigo-500 to-purple-600' };
  };

  const rank = getRankBadge(totalMisiCompleted);

  // Badges of 7 Habits
  const habitBadges = [
    { id: 1, title: 'Bintang Fajar', habit: 'Bangun Pagi', desc: 'Disiplin menyambut pagi hari' },
    { id: 2, title: 'Bintang Taqwa', habit: 'Beribadah', desc: 'Taat dan berbakti kepada Sang Pencipta' },
    { id: 3, title: 'Bintang Bugar', habit: 'Berolahraga', desc: 'Tubuh kuat dan berenergi' },
    { id: 4, title: 'Bintang Literasi', habit: 'Gemar Membaca', desc: 'Wawasan luas dan haus ilmu' },
    { id: 5, title: 'Bintang Nutrisi', habit: 'Makan Sehat', desc: 'Konsumsi makanan bergizi seimbang' },
    { id: 6, title: 'Bintang Berbakti', habit: 'Bantu Orang Tua', desc: 'Penuh empati meringankan keluarga' },
    { id: 7, title: 'Bintang Disiplin', habit: 'Tidur Tepat Waktu', desc: 'Tidur cukup dan teratur' },
  ];

  const habitCounts = StorageService.getSiswaAnalytics(session.username, 'semua').habitCounts;

  return (
    <div className="space-y-6">
      {/* 1. Header Profile Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar Big */}
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-amber-400 p-1 shadow-md">
              <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-emerald-700 font-extrabold text-3xl">
                {session.nama ? session.nama.slice(0, 2).toUpperCase() : 'AG'}
              </div>
            </div>
            {streakCount > 0 && (
              <div
                className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-extrabold flex items-center gap-1 shadow-md border-2 border-white"
                title={`${streakCount} Hari Aktif`}
              >
                <Flame className="w-3.5 h-3.5 fill-white" />
                <span>{streakCount} Hari</span>
              </div>
            )}
          </div>

          {/* Info Details */}
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`text-[11px] font-extrabold text-white px-3 py-1 rounded-full bg-gradient-to-r ${rank.color} shadow-xs`}>
                {rank.title} • {rank.level}
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                {session.kelas}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {session.nama}
            </h2>

            <div className="text-xs text-slate-500 flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 font-medium">
              <span>NISN / Akun: <strong className="text-slate-800 font-mono">{session.username}</strong></span>
              <span>•</span>
              <span>Total Misi: <strong className="text-emerald-700">{totalMisiCompleted} Selesai</strong></span>
            </div>

            {/* Motto Box */}
            <div className="pt-3">
              {isEditingMotto ? (
                <form onSubmit={handleSaveMotto} className="space-y-2 max-w-lg">
                  <textarea
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    rows={2}
                    placeholder="Tuliskan motto atau motivasi belajarmu..."
                    className="w-full p-2.5 bg-slate-50 border border-emerald-300 rounded-xl text-xs text-slate-800 outline-hidden focus:bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Motto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingMotto(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <blockquote className="italic text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 inline-block">
                    &ldquo;{motto}&rdquo;
                  </blockquote>
                  <button
                    onClick={() => setIsEditingMotto(true)}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Ubah motto diri"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {savedSuccess && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Tersimpan!
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Certificate Action */}
          <div className="shrink-0 self-center sm:self-start pt-2">
            <button
              onClick={onOpenPiagam}
              className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs shadow-md transition-all inline-flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-slate-900" />
              <span>Buka Piagam Penghargaan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Tujuh Bintang Karakter (Lencana Kebiasaan) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Lencana 7 Bintang Karakter Emas
            </h3>
            <p className="text-xs text-slate-500">
              Setiap kebiasaan yang rutin kamu lakukan akan membuka lencana kehormatan karakter
            </p>
          </div>
          <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Koleksi Bintang
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {habitBadges.map((badge) => {
            const count = habitCounts[badge.id] || 0;
            const isUnlocked = count > 0;

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/30 border-amber-200/80 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                    isUnlocked ? 'bg-amber-400 text-slate-900 shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isUnlocked ? <Star className="w-5 h-5 fill-slate-900" /> : badge.id}
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isUnlocked ? `${count}x Dituntaskan` : 'Belum Terbuka'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-slate-900">
                    {badge.title}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700">
                    Misi #{badge.id}: {badge.habit}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    {badge.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

