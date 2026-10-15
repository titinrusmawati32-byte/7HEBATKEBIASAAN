import React, { useState, useMemo } from 'react';
import {
  BookOpenCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  Sparkles,
  Sun,
  HeartHandshake,
  Activity,
  BookOpen,
  Apple,
  HelpingHand,
  Moon,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { HABIT_DEFINITIONS } from '../../data/habitDefinitions';
import { formatDateIndonesian } from '../../utils/helpers';
import { HabitItemData } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface SiswaRiwayatJurnalProps {
  username: string;
  onOpenPhoto: (url: string, title: string, subtitle?: string) => void;
  onNavigateToMisi: () => void;
  onDataChanged?: () => void;
}

export const SiswaRiwayatJurnal: React.FC<SiswaRiwayatJurnalProps> = ({
  username,
  onOpenPhoto,
  onNavigateToMisi,
  onDataChanged
}) => {
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    habitId: number;
    entry: HabitItemData | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    habitId: 1,
    entry: null,
    isLoading: false
  });

  // Load all history entries for this student from StorageService
  const allEntries = useMemo(() => {
    return StorageService.getSiswaAllHabitHistory(username);
  }, [username, refreshTrigger]);


  const filteredEntries = useMemo(() => {
    const now = new Date();

    return allEntries.filter(({ habitId, entry }) => {
      // Habit filter
      if (selectedHabitFilter !== 'all' && habitId.toString() !== selectedHabitFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const entryDate = new Date(entry.tanggal);
        const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dateFilter === '7days' && diffDays > 7) return false;
        if (dateFilter === '30days' && diffDays > 30) return false;
      }

      // Text search in detail or habit title
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const habitDef = HABIT_DEFINITIONS.find(h => h.id === habitId);
        const textToMatch = `${entry.detail} ${entry.tanggal} ${habitDef?.title || ''}`.toLowerCase();
        if (!textToMatch.includes(q)) return false;
      }

      return true;
    });
  }, [allEntries, selectedHabitFilter, dateFilter, searchQuery]);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleDeleteEntry = (habitId: number, entry: HabitItemData) => {
    setDeleteModalState({
      isOpen: true,
      habitId,
      entry,
      isLoading: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.entry) return;
    setDeleteModalState(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await StorageService.hapusEntriJurnal(
        deleteModalState.habitId,
        username,
        deleteModalState.entry.tanggal,
        deleteModalState.entry.id
      );
      showToast(res.message);
      setDeleteModalState({ isOpen: false, habitId: 1, entry: null, isLoading: false });
      setRefreshTrigger(prev => prev + 1);
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err: any) {
      showToast('Gagal menghapus: ' + (err.message || String(err)));
      setDeleteModalState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Controls */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Riwayat Jurnal Karakter Saya
              </h2>
              <p className="text-xs text-slate-500">
                Daftar lengkap catatan misi dan bukti foto pembiasaan yang telah kamu laporkan
              </p>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            Total Tercatat: <span className="text-emerald-700 font-extrabold">{filteredEntries.length}</span> Entri
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari catatan, tanggal, misi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 outline-hidden transition-all"
            />
          </div>

          {/* Filter Kebiasaan Dropdown */}
          <div>
            <select
              value={selectedHabitFilter}
              onChange={(e) => setSelectedHabitFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:border-emerald-500 outline-hidden transition-all"
            >
              <option value="all">Semua 7 Kebiasaan</option>
              {HABIT_DEFINITIONS.map(h => (
                <option key={h.id} value={h.id.toString()}>
                  Misi #{h.id}: {h.shortTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Date Scope Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:border-emerald-500 outline-hidden transition-all"
            >
              <option value="all">Semua Waktu</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Content List / Table */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
            <BookOpenCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-extrabold text-slate-800">
              Tidak Ada Riwayat yang Sesuai
            </h3>
            <p className="text-xs text-slate-500">
              Belum ada catatan jurnal pada filter ini. Coba sesuaikan kata kunci pencarian atau laporkan misimu hari ini!
            </p>
          </div>
          <button
            onClick={onNavigateToMisi}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Lapor Misi Hari Ini</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-600 font-bold">
                  <th className="py-3.5 px-4">Kebiasaan</th>
                  <th className="py-3.5 px-4">Tanggal & Waktu Lapor</th>
                  <th className="py-3.5 px-4">Catatan / Jam Bangun</th>
                  <th className="py-3.5 px-4">Foto Bukti</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map(({ habitId, entry }) => {
                  const habit = HABIT_DEFINITIONS.find(h => h.id === habitId);
                  return (
                    <tr
                      key={`${habitId}-${entry.id || entry.tanggal}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Habit Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl ${habit?.bgColor || 'bg-slate-100'} flex items-center justify-center shrink-0`}>
                            {getHabitIcon(habit?.iconName || 'Sparkles')}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              Misi #{habitId}: {habit?.shortTitle}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {habit?.badgeText}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time Column */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDateIndonesian(entry.tanggal)}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {entry.waktuSubmit ? `${entry.waktuSubmit} WIB` : 'Tercatat'}
                          </span>
                        </div>
                      </td>

                      {/* Detail Column */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-800 font-medium leading-relaxed line-clamp-2">
                          &quot;{entry.detail}&quot;
                        </div>
                      </td>

                      {/* Photo Column */}
                      <td className="py-3.5 px-4">
                        {entry.fotoBukti ? (
                          <button
                            type="button"
                            onClick={() => onOpenPhoto(
                              entry.fotoBukti,
                              habit?.title || `Misi #${habitId}`,
                              `${formatDateIndonesian(entry.tanggal)} • ${entry.detail}`
                            )}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-bold text-[11px] hover:bg-emerald-100 transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Lihat Foto</span>
                            <Eye className="w-3 h-3 ml-0.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">Tanpa foto</span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Selesai</span>
                        </span>
                      </td>

                      {/* Delete Column */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(habitId, entry)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 text-[11px] font-bold transition-all shadow-2xs"
                          title="Hapus permanen misi ini dari server dan database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Jurnal */}
      <ConfirmationModal
        isOpen={deleteModalState.isOpen}
        type="danger"
        title="Hapus Permanen Catatan Jurnal?"
        message={`Apakah Anda yakin ingin menghapus catatan Misi #${deleteModalState.habitId} (${HABIT_DEFINITIONS.find(h => h.id === deleteModalState.habitId)?.shortTitle || ''}) tanggal ${deleteModalState.entry ? formatDateIndonesian(deleteModalState.entry.tanggal) : ''}?\n\nCatatan dan foto bukti ini akan dihapus secara PERMANEN dari database dan tidak dapat dipulihkan.`}
        confirmLabel="Ya, Hapus Permanen"
        isLoading={deleteModalState.isLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deleteModalState.isLoading) {
            setDeleteModalState(prev => ({ ...prev, isOpen: false }));
          }
        }}
      />
    </div>
  );
};

