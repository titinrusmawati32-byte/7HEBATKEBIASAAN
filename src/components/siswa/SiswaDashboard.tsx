import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  Image as ImageIcon,
  ChevronRight,
  Flame,
  Star,
  Eye,
  ArrowRight,
  Trash2,
  LogOut,
  AlertCircle,
  UserCheck,
  Check,
  BarChart3,
  BookOpenCheck,
  Home,
  TrendingUp
} from 'lucide-react';
import { HabitDefinition, HabitItemData, SiswaMenuTab, UserSession } from '../../types';
import { StorageService, getTodayDateString } from '../../services/storageService';
import { HABIT_DEFINITIONS } from '../../data/habitDefinitions';
import { formatDateIndonesian } from '../../utils/helpers';
import { SiswaGrafikPerkembangan } from './SiswaGrafikPerkembangan';
import { SiswaRiwayatJurnal } from './SiswaRiwayatJurnal';
import { SiswaProfil } from './SiswaProfil';
import { SiswaPengaturan } from './SiswaPengaturan';
import { HabitSubmitModal } from './HabitSubmitModal';
import { PiagamModal } from './PiagamModal';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { HabitAnimatedBadge } from './HabitAnimatedBadge';

interface SiswaDashboardProps {
  session: UserSession;
  onLogout?: () => void;
}

export const SiswaDashboard: React.FC<SiswaDashboardProps> = ({
  session,
  onLogout = () => {}
}) => {
  // Navigation tab state
  const [activeMenu, setActiveMenu] = useState<SiswaMenuTab>('beranda');

  // Habit progress & details state
  const [completedHabits, setCompletedHabits] = useState<number[]>([]);
  const [habitDetails, setHabitDetails] = useState<Record<number, HabitItemData | null>>({});
  const [selectedHabitForSubmit, setSelectedHabitForSubmit] = useState<HabitDefinition | null>(null);
  const [isPiagamOpen, setIsPiagamOpen] = useState(false);
  const [studentStreak, setStudentStreak] = useState<number>(0);
  const [totalCompletedAllTime, setTotalCompletedAllTime] = useState<number>(0);

  // Quick 7-day sparkline trend data for compact dashboard chart
  const [sparklineData, setSparklineData] = useState<Array<{ date: string; label: string; count: number }>>([]);

  // Modals for delete and logout confirmations
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  const [deleteHabitConfirm, setDeleteHabitConfirm] = useState<{
    isOpen: boolean;
    habitId: number;
    isLoading: boolean;
  }>({
    isOpen: false,
    habitId: 1,
    isLoading: false
  });

  // Photo viewer lightbox
  const [photoViewer, setPhotoViewer] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    subtitle?: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
    subtitle: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const todayStr = getTodayDateString();

  // Load real database data
  const loadData = () => {
    // 1. Today's habit status
    const completed = StorageService.cekStatusMisiHariIni(session.username);
    setCompletedHabits(completed);

    const detailsMap: Record<number, HabitItemData | null> = {};
    for (let i = 1; i <= 7; i++) {
      detailsMap[i] = StorageService.getMisiDetailHariIni(session.username, i);
    }
    setHabitDetails(detailsMap);

    // 2. Real dynamic analytics for streak, all-time count, and sparkline
    const analytics = StorageService.getDynamicAnalytics({
      role: 'Siswa',
      username: session.username,
      period: '7hari'
    });

    setStudentStreak(analytics.currentStreak);
    setTotalCompletedAllTime(analytics.totalReports);
    setSparklineData(analytics.dailyTrend.map(d => ({
      date: d.date,
      label: d.label,
      count: d.completedCount
    })));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleDeleteTodayHabit = (habitId: number) => {
    setDeleteHabitConfirm({
      isOpen: true,
      habitId,
      isLoading: false
    });
  };

  const handleConfirmDeleteTodayHabit = async () => {
    const habitId = deleteHabitConfirm.habitId;
    setDeleteHabitConfirm(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await StorageService.hapusEntriJurnal(habitId, session.username, todayStr);
      loadData();
      showToast(res.message);
      setDeleteHabitConfirm({ isOpen: false, habitId: 1, isLoading: false });
    } catch (err: any) {
      showToast('Gagal menghapus: ' + (err.message || String(err)));
      setDeleteHabitConfirm(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    loadData();
  }, [session.username]);

  // Compute Rank Level based on completed habits today
  const getRankLevel = (count: number) => {
    if (count === 7) return { title: 'Pahlawan Karakter Emas ⭐', color: 'text-amber-800 bg-amber-100 border-amber-300' };
    if (count >= 5) return { title: 'Teladan Hebat 🌟', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' };
    if (count >= 3) return { title: 'Bintang Harapan ✨', color: 'text-sky-800 bg-sky-100 border-sky-300' };
    if (count >= 1) return { title: 'Pejuang Cilik 🚀', color: 'text-indigo-800 bg-indigo-100 border-indigo-300' };
    return { title: 'Siap Beraksi! 💪', color: 'text-slate-700 bg-slate-100 border-slate-300' };
  };

  const rank = getRankLevel(completedHabits.length);
  const progressPercent = Math.round((completedHabits.length / 7) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-24 sm:pb-12 antialiased overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container - Mobile First Max Width (360px - 430px base up to desktop) */}
      <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-6 space-y-4 sm:space-y-6">

        {/* ========================================================================= */}
        {/* B.2.1 HEADER RINGKAS DENGAN NAMA PENGGUNA DAN TOMBOL KELUAR              */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Student Avatar Icon */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
              {session.nama.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {session.nama}
                </h1>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {session.kelas}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 font-medium mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{formatDateIndonesian(todayStr)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPiagamOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs transition-colors flex items-center gap-1.5 border border-amber-200 cursor-pointer"
              title="Lihat Piagam"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Piagam</span>
            </button>


          </div>
        </div>

        {/* Desktop/Tablet Tab Bar Navigation (Synced with Bottom Nav on HP) */}
        <div className="hidden sm:flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveMenu('beranda')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMenu === 'beranda'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('misi')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMenu === 'misi'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>7 Misi</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeMenu === 'misi' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {completedHabits.length}/7
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('profil')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMenu === 'profil'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Profil Saya</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: BERANDA (DASHBOARD HP MOBILE-FIRST DENGAN URUTAN TERBAIK)         */}
        {/* ========================================================================= */}
        {(activeMenu === 'beranda' || activeMenu === 'misi') && (
          <div className="space-y-4 sm:space-y-5">

            {/* B.2.2 RINGKASAN PERKEMBANGAN JURNAL HARI INI */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Progress Circle Visual */}
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500 transition-all duration-700 ease-out"
                        strokeDasharray={`${progressPercent}, 100`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-black">
                      <span className="text-xs text-slate-800 tabular-nums">{completedHabits.length}/7</span>
                    </div>
                  </div>

                  <div>
                    <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border mb-1 ${rank.color}`}>
                      {rank.title}
                    </span>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                      {completedHabits.length === 7
                        ? 'Luar biasa! 7 Misi tuntas sempurna!'
                        : `${completedHabits.length} dari 7 kebiasaan selesai hari ini`}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {completedHabits.length === 7
                        ? 'Karakter emasmu bersinar terang hari ini!'
                        : `Tersisa ${7 - completedHabits.length} kebiasaan lagi untuk diselesaikan.`}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end text-right shrink-0">
                  <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{studentStreak} Hari Beruntun</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">Streak Jurnal</span>
                </div>
              </div>

              {/* B.2.3 INDIKATOR KEMAJUAN 7 KEBIASAAN (7 Quick Action Buttons) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                  <span>Indikator 7 Misi Emas:</span>
                  <span className="text-emerald-700 font-black">{progressPercent}% Tuntas</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {HABIT_DEFINITIONS.map(h => {
                    const done = completedHabits.includes(h.id);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setSelectedHabitForSubmit(h)}
                        className={`h-9 sm:h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer ${
                          done
                            ? 'bg-emerald-600 text-white shadow-2xs scale-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title={`${h.title}: ${done ? 'Selesai' : 'Belum dilaporkan'}`}
                      >
                        {done ? <Check className="w-4 h-4 stroke-[3]" /> : h.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* B.2.4 GRAFIK RINGKAS YANG MUDAH DIBACA DI HP */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Grafik Ringkas Aktivitas 7 Hari Terakhir
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Data riil dari database • Maks 7 misi/hari
                    </p>
                  </div>
                </div>
              </div>

              {/* Sparkline Bar Chart for Mobile */}
              <div className="h-28 flex items-end justify-between gap-1.5 sm:gap-2 pt-2 px-1">
                {sparklineData.map((d, idx) => {
                  const heightPercent = Math.max(8, Math.round((d.count / 7) * 85));
                  const isToday = d.date === todayStr;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      <span className="text-[10px] font-black text-slate-600 mb-1">
                        {d.count}
                      </span>
                      <div
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                          isToday
                            ? 'bg-emerald-500 ring-2 ring-emerald-300'
                            : d.count > 0
                            ? 'bg-sky-400'
                            : 'bg-slate-200'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className={`text-[9px] font-extrabold mt-1.5 ${
                        isToday ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {isToday ? 'Hari ini' : d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* B.2.5 KARTU TUJUH KEBIASAAN (VERTikal / 2-KOLOM MOBILE-FIRST)            */}
            {/* ========================================================================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Daftar 7 Misi Karakter Hari Ini</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {completedHabits.length} Selesai • {7 - completedHabits.length} Menunggu
                </span>
              </div>

              {/* Responsive Cards: 1-col on mobile (360-430px), 2-col on md+ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {HABIT_DEFINITIONS.map(habit => {
                  const isDone = completedHabits.includes(habit.id);
                  const detail = habitDetails[habit.id];

                  return (
                    <div
                      key={habit.id}
                      className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between shadow-xs ${
                        isDone
                          ? 'border-emerald-300 ring-1 ring-emerald-500/20 bg-gradient-to-b from-white to-emerald-50/20'
                          : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Top Row: Habit Number, Animated Badge, and Status */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0 p-1 rounded-2xl bg-slate-50 border border-slate-100">
                              <HabitAnimatedBadge habitId={habit.id} isCompleted={isDone} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block mb-0.5">
                                Misi #{habit.number}
                              </span>
                              <h4 className="text-sm font-black text-slate-900 truncate">
                                {habit.title.replace(/^Misi \d+: /, '')}
                              </h4>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Tuntas</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Belum Lapor</span>
                            </span>
                          )}
                        </div>

                        {/* Description / Prompt */}
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-2">
                          {habit.description}
                        </p>

                        {/* Summary of today's report if completed */}
                        {isDone && detail && (
                          <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 mb-3 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-[10px] font-black text-emerald-800">
                              <span>Catatan Jurnalmu:</span>
                              {detail.waktuSubmit && (
                                <span className="font-mono text-emerald-700 bg-white/90 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                  {detail.waktuSubmit} WIB
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] font-semibold text-slate-800 italic line-clamp-2 bg-white/70 p-2 rounded-xl border border-emerald-100">
                              &ldquo;{detail.detail}&rdquo;
                            </p>

                            {detail.fotoBukti && (
                              <button
                                type="button"
                                onClick={() => setPhotoViewer({
                                  isOpen: true,
                                  url: detail.fotoBukti,
                                  title: habit.title,
                                  subtitle: `${session.nama} • ${detail.detail}`
                                })}
                                className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 hover:text-emerald-900 bg-white px-2 py-1 rounded-xl border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
                              >
                                <ImageIcon className="w-3 h-3 text-emerald-600" />
                                <span>Lihat Foto Bukti</span>
                                <Eye className="w-3 h-3 ml-0.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Min 44px touch target on mobile */}
                      <div className="pt-1">
                        {isDone ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedHabitForSubmit(habit)}
                              className="flex-1 min-h-[44px] py-2.5 px-3 rounded-2xl font-extrabold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Ubah Jurnal</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTodayHabit(habit.id)}
                              className="min-h-[44px] min-w-[44px] py-2.5 px-3 rounded-2xl font-extrabold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all flex items-center justify-center cursor-pointer"
                              title="Hapus permanen jurnal misi ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedHabitForSubmit(habit)}
                            className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Jalankan Misi Sekarang!</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: GRAFIK ANALISIS DINAMIS LENGKAP                                   */}
        {/* ========================================================================= */}
        {activeMenu === 'grafik' && (
          <SiswaGrafikPerkembangan
            username={session.username}
            nama={session.nama}
            onNavigateToMisi={() => setActiveMenu('beranda')}
            onDataChanged={loadData}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: RIWAYAT JURNAL LENGKAP                                            */}
        {/* ========================================================================= */}
        {activeMenu === 'riwayat' && (
          <SiswaRiwayatJurnal
            username={session.username}
            onOpenPhoto={(url, title, subtitle) => setPhotoViewer({ isOpen: true, url, title, subtitle })}
            onNavigateToMisi={() => setActiveMenu('beranda')}
            onDataChanged={loadData}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PROFIL SAYA                                                       */}
        {/* ========================================================================= */}
        {activeMenu === 'profil' && (
          <SiswaProfil
            session={session}
            onOpenPiagam={() => setIsPiagamOpen(true)}
            streakCount={studentStreak}
            totalMisiCompleted={totalCompletedAllTime}
            onLogout={() => setIsLogoutConfirmOpen(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: PENGATURAN SISWA                                                  */}
        {/* ========================================================================= */}
        {activeMenu === 'pengaturan' && (
          <SiswaPengaturan session={session} onLogout={() => setIsLogoutConfirmOpen(true)} />
        )}
      </div>

      {/* ========================================================================= */}
      {/* B.5 BOTTOM NAVIGATION KHUSUS HP (ERGONOMIS, MIN 44PX, TIDAK MENUTUPI KONTEN) */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 sm:hidden no-print">
        <div className="grid grid-cols-3 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveMenu('beranda')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all ${
              activeMenu === 'beranda'
                ? 'text-emerald-600 font-black'
                : 'text-slate-500 font-semibold'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('misi')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all relative ${
              activeMenu === 'misi'
                ? 'text-emerald-600 font-black'
                : 'text-slate-500 font-semibold'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Misi</span>
            <span className="absolute top-1 right-3 w-4 h-4 bg-emerald-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {completedHabits.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('profil')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all ${
              activeMenu === 'profil'
                ? 'text-emerald-600 font-black'
                : 'text-slate-500 font-semibold'
            }`}
          >
            <UserCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Profil</span>
          </button>
        </div>
      </nav>

      {/* Habit Submission Modal */}
      {selectedHabitForSubmit && (
        <HabitSubmitModal
          isOpen={true}
          onClose={() => setSelectedHabitForSubmit(null)}
          habit={selectedHabitForSubmit}
          username={session.username}
          nama={session.nama}
          kelas={session.kelas}
          existingData={habitDetails[selectedHabitForSubmit.id] || null}
          onSubmitted={() => {
            loadData();
            showToast(`Laporan ${selectedHabitForSubmit.shortTitle} berhasil disimpan ke database!`);
          }}
        />
      )}

      {/* Certificate Piagam Modal */}
      {isPiagamOpen && (
        <PiagamModal
          isOpen={true}
          onClose={() => setIsPiagamOpen(false)}
          siswaNama={session.nama}
          siswaKelas={session.kelas}
          siswaNisn={session.username}
        />
      )}

      {/* Photo Viewer Lightbox */}
      {photoViewer.isOpen && (
        <PhotoViewerModal
          isOpen={true}
          onClose={() => setPhotoViewer(prev => ({ ...prev, isOpen: false }))}
          photoUrl={photoViewer.url}
          title={photoViewer.title}
          subtitle={photoViewer.subtitle}
        />
      )}

      {/* Modal Konfirmasi Hapus Misi Hari Ini */}
      <ConfirmationModal
        isOpen={deleteHabitConfirm.isOpen}
        type="danger"
        title="Hapus Laporan Misi Hari Ini?"
        message={`Apakah Anda yakin ingin membatalkan dan menghapus laporan Misi #${deleteHabitConfirm.habitId} (${HABIT_DEFINITIONS.find(h => h.id === deleteHabitConfirm.habitId)?.shortTitle || ''}) untuk hari ini?\n\nCatatan dan foto bukti yang telah diunggah akan dihapus secara permanen.`}
        confirmLabel="Ya, Hapus Misi"
        isLoading={deleteHabitConfirm.isLoading}
        onConfirm={handleConfirmDeleteTodayHabit}
        onClose={() => {
          if (!deleteHabitConfirm.isLoading) {
            setDeleteHabitConfirm(prev => ({ ...prev, isOpen: false }));
          }
        }}
      />

      {/* Modal Konfirmasi Keluar Akun Siswa */}
      <ConfirmationModal
        isOpen={isLogoutConfirmOpen}
        type="warning"
        title="Keluar dari Akun Siswa?"
        message={`Apakah kamu yakin ingin keluar dari akun ${session.nama}?\nSemua catatan pembiasaanmu telah tersimpan dengan aman.`}
        confirmLabel="Ya, Keluar Akun"
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          onLogout();
        }}
        onClose={() => setIsLogoutConfirmOpen(false)}
      />
    </div>
  );
};
