import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Sparkles,
  Award,
  Sun,
  HeartHandshake,
  Activity,
  BookOpen,
  Apple,
  HelpingHand,
  Moon,
  Info,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { StorageService, getTodayDateString, getDateOffsetString } from '../../services/storageService';
import { formatDateIndonesian } from '../../utils/helpers';
import { DynamicAnalyticsResult, PeriodFilter } from '../../types';

interface SiswaGrafikPerkembanganProps {
  username: string;
  nama: string;
  onNavigateToMisi: () => void;
  onDataChanged?: () => void;
}

export const SiswaGrafikPerkembangan: React.FC<SiswaGrafikPerkembanganProps> = ({
  username,
  nama,
  onNavigateToMisi
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('7hari');
  const [customStart, setCustomStart] = useState<string>(getDateOffsetString(14));
  const [customEnd, setCustomEnd] = useState<string>(getTodayDateString());
  const [analytics, setAnalytics] = useState<DynamicAnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Tooltip & Touch Active States (Mobile Friendly)
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const fetchAnalytics = () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const data = StorageService.getDynamicAnalytics({
        role: 'Siswa',
        username,
        period,
        startDate: period === 'rentang' ? customStart : undefined,
        endDate: period === 'rentang' ? customEnd : undefined
      });
      setAnalytics(data);
    } catch (err) {
      console.error('Gagal menghitung statistik analitik siswa:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [username, period, customStart, customEnd]);

  const getHabitIcon = (name: string) => {
    switch (name) {
      case 'Sun': return <Sun className="w-4 h-4 text-amber-500" />;
      case 'HeartHandshake': return <HeartHandshake className="w-4 h-4 text-emerald-500" />;
      case 'Activity': return <Activity className="w-4 h-4 text-sky-500" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'Apple': return <Apple className="w-4 h-4 text-rose-500" />;
      case 'HelpingHand': return <HelpingHand className="w-4 h-4 text-violet-500" />;
      case 'Moon': return <Moon className="w-4 h-4 text-cyan-500" />;
      default: return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  if (hasError) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-900 text-base">Gagal Memuat Grafik</h3>
          <p className="text-xs text-slate-500">Terjadi kendala saat menghitung data statistik jurnalmu.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  if (isLoading || !analytics) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500">Memuat data grafik riil dari database...</p>
      </div>
    );
  }

  // Graph measurements
  const totalDays = analytics.totalDays || 1;
  const svgWidth = 560;
  const svgHeight = 200;
  const paddingLeft = 32;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const graphWidth = svgWidth - paddingLeft - paddingRight;
  const graphHeight = svgHeight - paddingTop - paddingBottom;
  const maxY = 7;

  // Calculate SVG points for Daily Trend (Chart B)
  const points = analytics.dailyTrend.map((item, index) => {
    const x = analytics.dailyTrend.length > 1
      ? paddingLeft + (index / (analytics.dailyTrend.length - 1)) * graphWidth
      : paddingLeft + graphWidth / 2;
    const y = paddingTop + graphHeight - (Math.min(7, item.completedCount) / maxY) * graphHeight;
    return { x, y, item };
  });

  const linePath = points.length > 0
    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`
    : '';

  // Filter periods configuration
  const filterOptions: Array<{ id: PeriodFilter; label: string }> = [
    { id: 'hari_ini', label: 'Hari Ini' },
    { id: '7hari', label: '7 Hari Terakhir' },
    { id: 'bulan_ini', label: 'Bulan Ini' },
    { id: 'bulan_lalu', label: 'Bulan Lalu' },
    { id: 'rentang', label: 'Rentang Khusus' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Quick Period Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
              <BarChart3 className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                Grafik Perkembangan Karakter
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Data aktivitas riil jurnal 7 kebiasaan {nama} • {analytics.periodLabel}
              </p>
            </div>
          </div>

          {/* Quick Indicator Badge */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 px-3 py-1 rounded-xl text-xs font-bold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{analytics.startDate} s/d {analytics.endDate}</span>
          </div>
        </div>

        {/* 5-Period Filter Buttons (Mobile-first wrapped pills) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {filterOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  period === opt.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers when 'rentang' is active */}
          {period === 'rentang' && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-500">Mulai:</span>
              <input
                type="date"
                value={customStart}
                max={customEnd}
                onChange={e => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
              />
              <span className="font-bold text-slate-500">Sampai:</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={getTodayDateString()}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. D. Ringkasan Statistik (4 Compact Stat Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1: Total Laporan */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Total Laporan</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {analytics.totalReports}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
            Misi tuntas dalam periode ini
          </p>
        </div>

        {/* Stat 2: Laporan Hari Ini */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Hari Ini</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
            {analytics.completedTodayCount} <span className="text-xs font-extrabold text-slate-400">/ 7 Misi</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
            {analytics.todayCompletionRate}% capaian hari ini
          </p>
        </div>

        {/* Stat 3: Persentase Penyelesaian Periode */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Capaian Periode</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-600 tabular-nums">
            {analytics.periodCompletionRate}%
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
            {analytics.activeDaysCount} dari {totalDays} hari aktif
          </p>
        </div>

        {/* Stat 4: Streak & Perbandingan Periode */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Streak & Tren</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xl sm:text-2xl font-black text-amber-500 tabular-nums">
              {analytics.currentStreak} <span className="text-xs font-bold text-amber-600">Hari</span>
            </div>
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
              analytics.trendDeltaPercent >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {analytics.trendDeltaPercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(analytics.trendDeltaPercent)}%
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
            {analytics.mostConsistentHabit ? `Terbaik: ${analytics.mostConsistentHabit.shortTitle}` : 'Pertahankan kebiasaan!'}
          </p>
        </div>
      </div>

      {/* 3. Empty State Handling (When 0 reports in selected period) */}
      {!analytics.hasData ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Belum Ada Data Jurnal di Periode Ini
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tidak ada catatan laporan 7 kebiasaan yang ditemukan pada rentang waktu <strong>{analytics.periodLabel}</strong>.
              Ayo jalankan misi pembiasaanmu sekarang untuk melihat grafiknya terisi!
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToMisi}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Lapor Misi Hari Ini Sekarang</span>
          </button>
        </div>
      ) : (
        /* Grid of 2 Main Dynamic Charts */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* CHART A: Grafik Penyelesaian 7 Kebiasaan */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>A. Penyelesaian 7 Kebiasaan</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Jumlah dan persentase laporan selesai per butir kebiasaan
                </p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                Peluang: {totalDays} Hari
              </span>
            </div>

            {/* List of 7 Habits with exact colors and progress */}
            <div className="space-y-2.5 pt-1">
              {analytics.habitsSummary.map(habit => {
                const isSelected = selectedHabitId === habit.habitId;
                return (
                  <div
                    key={habit.habitId}
                    onClick={() => setSelectedHabitId(isSelected ? null : habit.habitId)}
                    className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50 border-emerald-400 shadow-2xs'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${habit.colorHex}18` }}
                        >
                          {getHabitIcon(habit.iconName)}
                        </div>
                        <span className="text-xs font-extrabold text-slate-800 truncate">
                          #{habit.habitId} {habit.shortTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                          {habit.completedCount}{' '}
                          <span className="text-[10px] font-semibold text-slate-400">kali</span>
                        </span>
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: habit.colorHex }}
                        >
                          {habit.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(habit.percentage, habit.completedCount > 0 ? 5 : 0)}%`,
                          backgroundColor: habit.colorHex
                        }}
                      />
                    </div>

                    {/* Interactive detail on click/touch */}
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Diselesaikan {habit.completedCount} dari {totalDays} hari dalam periode</span>
                        <span className="font-extrabold text-emerald-700">
                          {habit.completedCount === totalDays ? 'Sempurna 100% ⭐' : `${totalDays - habit.completedCount} hari belum lapor`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHART B: Grafik Aktivitas Harian */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-600" />
                    <span>B. Grafik Aktivitas Harian</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Jumlah laporan riil tercatat setiap hari (Skala 0 s/d 7 Kebiasaan)
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span>Maks: 7/hari</span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="relative mt-3 w-full overflow-hidden bg-slate-50/60 rounded-2xl p-2 border border-slate-100">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-52 sm:h-56 overflow-visible"
                >
                  <defs>
                    <linearGradient id="siswaAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  {[0, 2, 4, 7].map(val => {
                    const y = paddingTop + graphHeight - (val / maxY) * graphHeight;
                    return (
                      <g key={val}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={svgWidth - paddingRight}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray={val === 7 ? '3 3' : 'none'}
                          strokeWidth="1"
                        />
                        <text
                          x={paddingLeft - 8}
                          y={y + 3}
                          textAnchor="end"
                          fontSize="9"
                          fill="#94a3b8"
                          fontWeight="bold"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {areaPath && (
                    <path d={areaPath} fill="url(#siswaAreaGrad)" />
                  )}

                  {/* Trendline */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Points with touch interaction */}
                  {points.map((pt, idx) => {
                    const isSelected = selectedPointIndex === idx;
                    const isZero = pt.item.completedCount === 0;

                    // Decimate labels on small screens so they never overlap
                    const showLabel = points.length <= 7 || idx % Math.ceil(points.length / 6) === 0 || idx === points.length - 1;

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onClick={() => setSelectedPointIndex(isSelected ? null : idx)}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? 6.5 : (isZero ? 3.5 : 4.5)}
                          fill={isZero ? '#f1f5f9' : '#ffffff'}
                          stroke={isZero ? '#94a3b8' : '#0284c7'}
                          strokeWidth={isSelected ? '3.5' : '2.5'}
                        />
                        {showLabel && (
                          <text
                            x={pt.x}
                            y={svgHeight - 10}
                            textAnchor="middle"
                            fontSize="8.5"
                            fill="#64748b"
                            fontWeight="bold"
                          >
                            {pt.item.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Touch/Click Detail Modal for Point */}
                {selectedPointIndex !== null && points[selectedPointIndex] && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs space-y-1">
                    <div className="flex items-center justify-between font-extrabold text-[11px] text-sky-300">
                      <span>{formatDateIndonesian(points[selectedPointIndex].item.date)}</span>
                      <span>{points[selectedPointIndex].item.completedCount} / 7 Selesai</span>
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {points[selectedPointIndex].item.completedCount === 0
                        ? 'Tidak ada aktivitas jurnal tercatat pada hari ini.'
                        : `Misi selesai: #${points[selectedPointIndex].item.habits.join(', #')}`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informational Guidance */}
            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 flex items-start gap-2 text-xs text-sky-900">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                Hari tanpa laporan ditampilkan sebagai <strong className="text-slate-800">0</strong>. Lakukan pembiasaan setiap hari secara konsisten agar kurva aktivitasmu tetap tinggi!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
