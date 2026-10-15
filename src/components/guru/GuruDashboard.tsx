import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  ClipboardCheck,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Calendar,
  Search,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  Award,
  Printer,
  Eye,
  Sparkles,
  Save,
  Check,
  AlertCircle,
  Menu,
  ChevronDown,
  Bell,
  User,
  ShieldAlert,
  Database,
  X,
  BarChart3,
  TrendingUp,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  HeartHandshake,
  Activity,
  Apple,
  HelpingHand,
  Moon,
  RefreshCw,
  Info
} from 'lucide-react';
import { DailySummaryRow, HabitMateri, PeriodFilter, SiswaRecord, UserSession } from '../../types';
import { StorageService, getTodayDateString, getDateOffsetString } from '../../services/storageService';
import { HABIT_DEFINITIONS } from '../../data/habitDefinitions';
import { exportToCSV, formatDateIndonesian, parseCSV, getYouTubeEmbedUrl } from '../../utils/helpers';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import { PiagamModal } from '../siswa/PiagamModal';
import { DatabaseConfigModal } from '../common/DatabaseConfigModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface GuruDashboardProps {
  session: UserSession;
  onRefresh?: () => void;
  onLogout?: () => void;
}

type GuruPage = 'beranda' | 'grafik' | 'jurnal' | 'agen' | 'materi' | 'pengaturan';

export const GuruDashboard: React.FC<GuruDashboardProps> = ({ session, onRefresh, onLogout }) => {
  const [activePage, setActivePage] = useState<GuruPage>('beranda');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filters & State
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [studentSearch, setStudentSearch] = useState('');
  const [chartPeriod, setChartPeriod] = useState<PeriodFilter>('7hari');
  const [customStart, setCustomStart] = useState<string>(getDateOffsetString(14));
  const [customEnd, setCustomEnd] = useState<string>(getTodayDateString());
  const [chartViewMode, setChartViewMode] = useState<'bar' | 'trend'>('bar');
  const [hoveredBarHabit, setHoveredBarHabit] = useState<{ id: number; short: string; full: string; value: number; count: number; color: string } | null>(null);
  const [selectedStudentForGraph, setSelectedStudentForGraph] = useState<string>('all');
  const [selectedGraphHabitId, setSelectedGraphHabitId] = useState<number | null>(null);
  const [selectedGraphPointIndex, setSelectedGraphPointIndex] = useState<number | null>(null);

  // Data states
  const [rekapList, setRekapList] = useState<DailySummaryRow[]>([]);
  const [siswaList, setSiswaList] = useState<SiswaRecord[]>([]);
  const [schoolName, setSchoolName] = useState('Nama Sekolah');

  // Selected student for Piagam print
  const [selectedSiswaForPiagam, setSelectedSiswaForPiagam] = useState<SiswaRecord | null>(null);

  // Photo viewer lightbox
  const [photoViewer, setPhotoViewer] = useState<{ isOpen: boolean; url: string; title: string; subtitle?: string }>({
    isOpen: false,
    url: '',
    title: '',
    subtitle: ''
  });

  // Modal: Database Config
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // Modal: Tambah Siswa
  const [isAddSiswaOpen, setIsAddSiswaOpen] = useState(false);
  const [newSiswa, setNewSiswa] = useState({
    nisn: '',
    nama: '',
    panggilan: '',
    kelas: session.kelas,
    tahunAjaran: '2026/2027'
  });

  // Modal: Import Siswa CSV
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Selected Siswa checkboxes for bulk action
  const [selectedNisn, setSelectedNisn] = useState<string[]>([]);

  // Materi Habit State (Habit 1..7)
  const [selectedHabitId, setSelectedHabitId] = useState<number>(1);
  const [materiForm, setMateriForm] = useState<HabitMateri>({
    materiTeks: '',
    linkYt: '',
    kuisAktif: false,
    pertanyaan: '',
    opsiA: '',
    opsiB: '',
    opsiC: '',
    jawaban: 'A'
  });
  const [materiSaveStatus, setMateriSaveStatus] = useState<string | null>(null);

  // Pengaturan Guru
  const [guruConfig, setGuruConfig] = useState({
    namaGuru: session.nama,
    tempatCetak: 'Jakarta',
    tanggalCetak: getTodayDateString()
  });
  const [configSaveStatus, setConfigSaveStatus] = useState<string | null>(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning';
    title: string;
    message: string;
    confirmLabel: string;
    isLoading: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    confirmLabel: 'Ya, Lanjutkan',
    isLoading: false,
    onConfirm: async () => {}
  });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3000);
  };

  const isGasConnected = Boolean(StorageService.getAppsScriptUrl());

  const loadAll = () => {
    // 1. Rekap Jurnal
    const dataGabungan = StorageService.ambilDataGabungan('Guru', session.kelas, selectedDate);
    setRekapList(dataGabungan);

    // 2. Siswa List
    const students = StorageService.ambilDataSiswa('Guru', session.kelas);
    setSiswaList(students);

    // 3. Guru settings
    const gConf = StorageService.getPengaturanGuru(session.kelas);
    if (gConf.success && gConf.data) {
      setGuruConfig({
        namaGuru: gConf.data.namaGuru || session.nama,
        tempatCetak: gConf.data.tempatCetak || 'Jakarta',
        tanggalCetak: gConf.data.tanggalCetak || getTodayDateString()
      });
    }

    // 4. KOP School Name
    const kop = StorageService.getPengaturanKop().data;
    if (kop.namaSekolah) setSchoolName(kop.namaSekolah);

    // 5. Materi for current selected habit
    loadMateri(selectedHabitId);
  };

  const loadMateri = (hId: number) => {
    const res = StorageService.getMateriHabit(session.kelas, hId);
    if (res.success && res.data) {
      setMateriForm(res.data);
    } else {
      setMateriForm({
        materiTeks: '',
        linkYt: '',
        kuisAktif: false,
        pertanyaan: '',
        opsiA: '',
        opsiB: '',
        opsiC: '',
        jawaban: 'A'
      });
    }
  };

  useEffect(() => {
    loadAll();
  }, [session.kelas, selectedDate]);

  useEffect(() => {
    loadMateri(selectedHabitId);
  }, [selectedHabitId]);

  // Calculations for stats and charts
  // Dynamic analytics from database strictly scoped to Guru's class and optional student
  const classAnalytics = useMemo(() => {
    return StorageService.getDynamicAnalytics({
      role: 'Guru',
      kelas: session.kelas,
      username: selectedStudentForGraph === 'all' ? undefined : selectedStudentForGraph,
      period: chartPeriod,
      startDate: chartPeriod === 'rentang' ? customStart : undefined,
      endDate: chartPeriod === 'rentang' ? customEnd : undefined
    });
  }, [session.kelas, selectedStudentForGraph, chartPeriod, customStart, customEnd, rekapList, siswaList]);

  // Dynamic student ranking in class for the selected period
  const studentRankings = useMemo(() => {
    return siswaList.map(s => {
      const sAnalytics = StorageService.getDynamicAnalytics({
        role: 'Guru',
        kelas: session.kelas,
        username: s.nisn,
        period: chartPeriod,
        startDate: chartPeriod === 'rentang' ? customStart : undefined,
        endDate: chartPeriod === 'rentang' ? customEnd : undefined
      });
      return {
        siswa: s,
        totalCompleted: sAnalytics.totalReports,
        rate: sAnalytics.periodCompletionRate,
        streak: sAnalytics.currentStreak
      };
    }).sort((a, b) => b.totalCompleted - a.totalCompleted);
  }, [siswaList, session.kelas, chartPeriod, customStart, customEnd, rekapList]);

  // Calculations for stats and charts based strictly on real database data
  const statsSummary = useMemo(() => {
    const total = siswaList.length;
    const filledToday = rekapList.filter(r => r.h1 || r.h2 || r.h3 || r.h4 || r.h5 || r.h6 || r.h7).length;
    const filledPercent = total > 0 ? Math.round((filledToday / total) * 100) : 0;
    
    // Count students who completed at least 5 habits today
    const readyForPiagam = rekapList.filter(r => {
      let c = 0;
      if (r.h1) c++; if (r.h2) c++; if (r.h3) c++; if (r.h4) c++;
      if (r.h5) c++; if (r.h6) c++; if (r.h7) c++;
      return c >= 5;
    }).length;

    return {
      totalSiswa: total,
      jurnalTerisi: `${filledPercent}%`,
      tuntas: `${classAnalytics.completedTodayCount}/${Math.max(1, total * 7)}`,
      piagamSiap: readyForPiagam
    };
  }, [siswaList, rekapList, classAnalytics]);

  // Real Habit metrics breakdown from database
  const habitPerformance = useMemo(() => {
    return classAnalytics.habitsSummary.map(h => ({
      id: h.habitId,
      short: h.shortTitle,
      full: h.title,
      value: h.percentage,
      count: h.completedCount,
      color: h.colorHex
    }));
  }, [classAnalytics]);

  const avgCompletion = useMemo(() => {
    return classAnalytics.periodCompletionRate;
  }, [classAnalytics]);

  // Filtered Rekap
  const filteredRekap = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return rekapList;
    return rekapList.filter(row => row.nama.toLowerCase().includes(q));
  }, [rekapList, studentSearch]);

  // Filtered Siswa
  const filteredSiswa = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return siswaList;
    return siswaList.filter(
      s =>
        s.nama.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (s.panggilan && s.panggilan.toLowerCase().includes(q))
    );
  }, [siswaList, studentSearch]);

  // Handlers: Add Student
  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiswa.nisn || !newSiswa.nama) {
      showToast('NISN dan Nama Lengkap wajib diisi!');
      return;
    }

    const res = await StorageService.simpanDataSiswa({
      ...newSiswa,
      panggilan: newSiswa.panggilan || newSiswa.nama.split(' ')[0]
    });

    showToast(res.message);
    if (res.success) {
      setIsAddSiswaOpen(false);
      setNewSiswa({
        nisn: '',
        nama: '',
        panggilan: '',
        kelas: session.kelas,
        tahunAjaran: '2026/2027'
      });
      loadAll();
      if (onRefresh) onRefresh();
    }
  };

  // Handlers: Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async evt => {
      const text = evt.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        showToast('File CSV kosong atau format header tidak sesuai.');
        return;
      }

      parsed.forEach(row => {
        if (!row.Kelas && !row.kelas) row.Kelas = session.kelas;
      });

      const res = await StorageService.simpanDataSiswaBulk(parsed);
      setImportStatus(res.message);
      showToast(res.message);
      setTimeout(() => {
        setImportStatus(null);
        setIsImportOpen(false);
      }, 2500);
      loadAll();
      if (onRefresh) onRefresh();
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        NISN: '0123456789',
        'Nama Lengkap': 'Contoh Siswa Hebat',
        Panggilan: 'Contoh',
        Kelas: session.kelas,
        'Tahun Ajaran': '2026/2027'
      }
    ];
    exportToCSV(template, `template-import-siswa-${session.kelas}.csv`);
    showToast('Template CSV berhasil diunduh.');
  };

  const handleDeleteBulkSiswa = () => {
    if (selectedNisn.length === 0) return;
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Massal Agen Siswa?',
      message: `Apakah Anda yakin ingin menghapus ${selectedNisn.length} siswa terpilih secara permanen dari server dan database?\n\nData akun dan riwayat pembiasaan siswa yang dipilih akan dihapus permanen.`,
      confirmLabel: `Ya, Hapus (${selectedNisn.length}) Siswa`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const res = await StorageService.hapusDataSiswaBulk(selectedNisn, session);
          showToast(res.message);
          setSelectedNisn([]);
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          loadAll();
          if (onRefresh) onRefresh();
        } catch (err: any) {
          showToast('Gagal menghapus siswa: ' + (err.message || String(err)));
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleDeleteSingleSiswa = (siswa: SiswaRecord) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Permanen Agen Siswa?',
      message: `Apakah Anda yakin ingin menghapus data agen siswa ${siswa.nama} (NISN: ${siswa.nisn}) dari kelas ${session.kelas}?\n\nCatatan siswa akan dihapus secara PERMANEN dari database.`,
      confirmLabel: 'Ya, Hapus Siswa',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const res = await StorageService.hapusDataSiswa(siswa.nisn, session);
          showToast(res.message);
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          loadAll();
          if (onRefresh) onRefresh();
        } catch (err: any) {
          showToast('Gagal menghapus siswa: ' + (err.message || String(err)));
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleDeleteJurnalRow = (row: DailySummaryRow) => {
    const username = row.username || (siswaList.find(s => s.nama.trim().toLowerCase() === row.nama.trim().toLowerCase())?.nisn) || '';
    if (!username) {
      showToast('Gagal mendeteksi NISN agen siswa untuk menghapus jurnal.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Laporan Jurnal Harian?',
      message: `Apakah Anda yakin ingin menghapus seluruh catatan 7 Kebiasaan untuk ${row.nama} pada tanggal ${formatDateIndonesian(selectedDate)}?\n\nLaporan catatan dan foto bukti akan dihapus secara PERMANEN dari database.`,
      confirmLabel: 'Ya, Hapus Jurnal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const res = await StorageService.hapusSeluruhJurnalSiswa(username, selectedDate, session);
          showToast(res.message);
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          loadAll();
          if (onRefresh) onRefresh();
        } catch (err: any) {
          showToast('Gagal menghapus jurnal: ' + (err.message || String(err)));
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  // Handlers: Save Materi
  const handleSaveMateri = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await StorageService.simpanMateriHabit({
      kelas: session.kelas,
      habitId: selectedHabitId,
      ...materiForm
    });

    if (res.success) {
      setMateriSaveStatus(res.message);
      showToast('Materi dan Kuis berhasil disinkronkan ke Google Spreadsheet!');
      setTimeout(() => setMateriSaveStatus(null), 3000);
      if (onRefresh) onRefresh();
    } else {
      showToast(res.message);
    }
  };

  // Handlers: Save Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await StorageService.simpanPengaturanGuru({
      kelas: session.kelas,
      ...guruConfig
    });

    if (res.success) {
      setConfigSaveStatus(res.message);
      showToast('Pengaturan administrasi kelas tersimpan di Google Spreadsheet!');
      setTimeout(() => setConfigSaveStatus(null), 3000);
      if (onRefresh) onRefresh();
    } else {
      showToast(res.message);
    }
  };

  // Handlers: Export Rekap CSV
  const handleExportRekapCSV = () => {
    const exportRows = filteredRekap.map((r, idx) => ({
      No: idx + 1,
      'Nama Siswa': r.nama,
      Kelas: r.kelas,
      Tanggal: r.tanggal,
      'Misi 1 (Bangun Pagi)': r.h1 ? r.h1.detail : 'Belum',
      'Misi 2 (Beribadah)': r.h2 ? r.h2.detail : 'Belum',
      'Misi 3 (Olahraga)': r.h3 ? r.h3.detail : 'Belum',
      'Misi 4 (Belajar)': r.h4 ? r.h4.detail : 'Belum',
      'Misi 5 (Makan Sehat)': r.h5 ? r.h5.detail : 'Belum',
      'Misi 6 (Membantu Sesama)': r.h6 ? r.h6.detail : 'Belum',
      'Misi 7 (Tidur Tepat Waktu)': r.h7 ? r.h7.detail : 'Belum'
    }));

    exportToCSV(exportRows, `rekap-jurnal-7kebiasaan-${session.kelas}-${selectedDate}.csv`);
    showToast('File CSV rekap jurnal berhasil dibuat.');
  };

  const handlePrint = () => {
    window.print();
  };

  const currentHabitDef = HABIT_DEFINITIONS.find(h => h.id === selectedHabitId) || HABIT_DEFINITIONS[0];
  const ytEmbedUrl = materiForm.linkYt ? getYouTubeEmbedUrl(materiForm.linkYt) : null;

  return (
    <div className="min-h-screen bg-[#f2f7fc] text-[#172b4d] flex font-sans antialiased pb-20 sm:pb-0">
      {/* ========================================================
          SIDEBAR GURU
      ======================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 w-[252px] bg-gradient-to-b from-[#12366b] to-[#0b2853] text-white flex flex-col z-50 transition-transform duration-300 ease-in-out overflow-y-auto no-print ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ffe07a] to-[#00d0a2] text-[#11366a] flex items-center justify-center font-black text-xs shadow-md border-2 border-white/50 shrink-0">
            7KAH
          </div>
          <div className="min-w-0">
            <strong className="block text-sm font-black leading-tight text-white tracking-tight">
              7 Kebiasaan Anak<br />Indonesia Hebat
            </strong>
            <small className="block mt-1 text-[#c7d8ef] text-[10px] truncate">
              {schoolName}
            </small>
          </div>
        </div>

        {/* Profile Card */}
        <div className="mx-3.5 my-4 p-3 rounded-2xl bg-white/5 border border-white/15 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d6efff] to-white text-[#12366b] text-lg flex items-center justify-center shrink-0 border-2 border-[#d9f5f0] font-bold">
            👨🏻‍🏫
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-xs font-black text-white truncate">{session.nama}</strong>
            <small className="block text-[11px] text-[#c8d9ee]">Guru {session.kelas}</small>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#d2e2f4] shrink-0" />
        </div>

        {/* Nav Label */}
        <div className="px-5 py-2 text-[10px] font-black tracking-wider text-[#8faed4] uppercase">
          Menu Guru
        </div>

        <nav className="px-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActivePage('beranda');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'beranda'
                ? 'bg-gradient-to-r from-[#00c9d8] to-[#1767d2] text-white shadow-lg shadow-sky-950/40'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('grafik');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'grafik'
                ? 'bg-gradient-to-r from-[#00c9d8] to-[#1767d2] text-white shadow-lg shadow-sky-950/40'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Grafik &amp; Analisis Kelas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('jurnal');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'jurnal'
                ? 'bg-gradient-to-r from-[#00c9d8] to-[#1767d2] text-white shadow-lg shadow-sky-950/40'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span>Rekap Jurnal Harian Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('agen');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'agen'
                ? 'bg-gradient-to-r from-[#00c9d8] to-[#1767d2] text-white shadow-lg shadow-sky-950/40'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="flex-1">Manajemen Agen Siswa</span>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-extrabold">
              {siswaList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('materi');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'materi'
                ? 'bg-gradient-to-r from-[#00c9d8] to-[#1767d2] text-white shadow-lg shadow-sky-950/40'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Materi &amp; Kuis 7 Kebiasaan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('pengaturan');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'pengaturan'
                ? 'bg-gradient-to-r from-[#00c9d8] to-[#1767d2] text-white shadow-lg shadow-sky-950/40'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Pengaturan Kelas &amp; Piagam</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Keluar</span>
          </button>
        </nav>

        {/* Sidebar Bottom Note */}
        <div className="mt-auto p-4">
          <div className="rounded-2xl p-3.5 bg-white/10 text-[11px] text-[#c9d9ed] leading-relaxed">
            <strong className="text-white block text-xs font-bold mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              Area Guru
            </strong>
            Kelola jurnal dan pantau perkembangan kebiasaan siswa kelas Anda secara terstruktur.
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* ========================================================
          MAIN AREA
      ======================================================== */}
      <main className="flex-1 lg:ml-[252px] min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-19 bg-white/95 backdrop-blur-md border-b border-[#e3ebf5] flex items-center justify-between px-4 sm:px-8 gap-4 no-print">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              className="lg:hidden w-10 h-10 rounded-xl border border-[#e3ebf5] bg-white text-[#12366b] flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ffe07a] to-[#00d0a2] text-[#11366a] flex items-center justify-center font-black text-xs shrink-0 shadow-xs border border-white/60">
                7KAH
              </div>
              <div className="min-w-0">
                <strong className="block text-xs sm:text-sm font-black text-[#12366b] truncate">
                  7 Kebiasaan Anak Indonesia Hebat
                </strong>
                <small className="block text-[11px] text-[#71819b] truncate">{schoolName}</small>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Database indicator */}
            <button
              type="button"
              onClick={() => setIsDbModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all shadow-xs ${
                isGasConnected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
              title="Kelola Integrasi Google Apps Script & Spreadsheet"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isGasConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="hidden sm:inline">
                {isGasConnected ? 'Google Sheets Aktif' : 'Hubungkan Apps Script'}
              </span>
            </button>

            {/* Notification */}
            <button
              type="button"
              onClick={() => showToast('Belum ada notifikasi baru.')}
              className="relative w-10 h-10 rounded-xl border border-[#e3ebf5] bg-white text-[#12366b] flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ff506b] ring-2 ring-white" />
            </button>

            {/* User Chip */}
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d6efff] to-white text-[#12366b] text-base flex items-center justify-center font-bold border border-slate-200">
                👨🏻‍🏫
              </div>
              <div className="text-left">
                <strong className="block text-xs font-black text-[#12366b] leading-tight truncate max-w-[150px]">
                  {session.nama}
                </strong>
                <small className="block text-[10px] text-[#71819b] font-semibold">Guru {session.kelas}</small>
              </div>
            </div>


          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-8">
          {/* ========================================================
              PAGE 1: BERANDA
          ======================================================== */}
          {activePage === 'beranda' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Hero Banner */}
              <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white bg-gradient-to-r from-[#05b77e] via-[#008fa8] to-[#1949d5] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
                <div className="relative z-10 space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-200 text-xs font-black border border-white/20">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Pusat Kendali Guru Pembina • {session.kelas}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    Selamat Bertugas, {session.nama} 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-[#efffff] leading-relaxed">
                    Pantau jurnal harian siswa, kelola materi edukasi karakter, serta terbitkan piagam penghargaan
                    bagi siswa berprestasi.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-blue-100 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateIndonesian(getTodayDateString())}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {session.kelas} • {schoolName}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="relative z-10 px-5 py-3 rounded-2xl bg-white text-[#07518a] hover:bg-slate-100 font-black text-xs shadow-md transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Laporan / Rekap</span>
                </button>
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <article className="bg-white border border-[#e3ebf5] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#5c6f8c]">Total Siswa</span>
                    <div className="w-10 h-10 rounded-xl bg-[#e4f2ff] text-[#1478d4] flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#12366b] mt-2 mb-0.5">{statsSummary.totalSiswa}</div>
                  <div className="text-[10px] text-[#71819b] flex items-center gap-1 font-bold">
                    <span className="text-[#009e76] bg-[#e2fbf1] px-2 py-0.5 rounded-full">↑ 5%</span>
                    <span>dari bulan lalu</span>
                  </div>
                </article>

                <article className="bg-white border border-[#e3ebf5] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#5c6f8c]">Jurnal Terisi</span>
                    <div className="w-10 h-10 rounded-xl bg-[#eee8ff] text-[#7853d8] flex items-center justify-center font-bold">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#12366b] mt-2 mb-0.5">{statsSummary.jurnalTerisi}</div>
                  <div className="text-[10px] text-[#71819b] flex items-center gap-1 font-bold">
                    <span className="text-[#009e76] bg-[#e2fbf1] px-2 py-0.5 rounded-full">↑ 8%</span>
                    <span>minggu ini</span>
                  </div>
                </article>

                <article className="bg-white border border-[#e3ebf5] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#5c6f8c]">Kebiasaan Tuntas</span>
                    <div className="w-10 h-10 rounded-xl bg-[#dffaf0] text-[#009e76] flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#12366b] mt-2 mb-0.5">{statsSummary.tuntas}</div>
                  <div className="text-[10px] text-[#71819b] flex items-center gap-1 font-bold">
                    <span className="text-[#009e76] bg-[#e2fbf1] px-2 py-0.5 rounded-full">↑ 4%</span>
                    <span>rata-rata kelas</span>
                  </div>
                </article>

                <article className="bg-white border border-[#e3ebf5] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#5c6f8c]">Piagam Siap</span>
                    <div className="w-10 h-10 rounded-xl bg-[#fff0dd] text-[#f18b20] flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#12366b] mt-2 mb-0.5">{statsSummary.piagamSiap}</div>
                  <div className="text-[10px] text-[#71819b] font-bold">Siswa berprestasi</div>
                </article>
              </section>

              {/* 2-Column Panels */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Panel 1: Ringkasan 7 Kebiasaan */}
                <article className="bg-white border border-[#e3ebf5] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-black text-[#173b70] flex items-center gap-2">
                        <span className="text-[#00a98a]">●</span>
                        Ringkasan 7 Kebiasaan
                      </h2>
                      <p className="text-[11px] text-[#71819b] mt-0.5">
                        Persentase penyelesaian siswa {session.kelas}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Ring Chart */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            stroke="#e5edf7"
                            strokeWidth="11"
                            fill="transparent"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            stroke="#00aa87"
                            strokeWidth="11"
                            fill="transparent"
                            strokeDasharray="238.7"
                            strokeDashoffset={238.7 - (238.7 * avgCompletion) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <strong className="text-2xl font-black text-[#12366b]">{avgCompletion}%</strong>
                          <span className="text-[9px] font-bold text-[#667b99] leading-tight">
                            Rata-rata<br />Penyelesaian
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Habits List */}
                    <div className="sm:col-span-7 space-y-2">
                      {habitPerformance.map((h, i) => (
                        <div key={h.short} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-5 h-5 rounded-full text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: h.color }}
                          >
                            {i + 1}
                          </span>
                          <span className="font-bold text-[11px] text-[#36516f] truncate min-w-[75px] flex-1" title={h.full}>
                            {h.short}
                          </span>
                          <div className="w-20 bg-[#e7eff8] h-2 rounded-full overflow-hidden shrink-0">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${h.value}%`, backgroundColor: h.color }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-[#5d7190] w-8 text-right shrink-0">
                            {h.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                {/* Panel 2: Grafik Perkembangan */}
                <article className="bg-white border border-[#e3ebf5] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-black text-[#173b70] flex items-center gap-2">
                        <span className="text-[#00a98a]">●</span>
                        Grafik Perkembangan 7 Kebiasaan
                      </h2>
                      <p className="text-[11px] text-[#71819b] mt-0.5">Persentase jurnal yang diselesaikan</p>
                    </div>

                    <select
                      value={chartPeriod}
                      onChange={e => setChartPeriod(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl border border-[#e3ebf5] bg-white text-xs font-bold text-[#49617f] focus:outline-none"
                    >
                      <option value="7hari">7 Hari Terakhir</option>
                      <option value="14hari">14 Hari Terakhir</option>
                      <option value="30hari">30 Hari Terakhir</option>
                    </select>
                  </div>

                  <div className="h-56 w-full flex items-end gap-3 pt-4 px-2">
                    {habitPerformance.map(h => (
                      <div key={h.short} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-black text-slate-600 group-hover:scale-110 transition-transform">
                          {h.value}%
                        </span>
                        <div className="w-full max-w-[38px] bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden">
                          <div
                            className="w-full rounded-t-xl transition-all duration-500 hover:brightness-110"
                            style={{ height: `${h.value}%`, backgroundColor: h.color }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#59708f] truncate w-full text-center" title={h.full}>
                          {h.short.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </div>
          )}

          {/* ========================================================
              PAGE 2: GRAFIK & ANALISIS PERKEMBANGAN KELAS
          ======================================================== */}
          {activePage === 'grafik' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Filter & Period Controls Header */}
              <section className="bg-white border border-[#e3ebf5] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#173b70] leading-tight">
                        Grafik &amp; Analisis Perkembangan Kelas {session.kelas}
                      </h2>
                      <p className="text-[11px] sm:text-xs text-[#71819b] font-medium">
                        Data aktivitas riil jurnal 7 kebiasaan siswa • {classAnalytics.periodLabel}
                      </p>
                    </div>
                  </div>

                  {/* Student selector filter */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f8fc] border border-[#dce6f2] rounded-xl text-xs font-bold text-[#1a3860]">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={selectedStudentForGraph}
                        onChange={e => setSelectedStudentForGraph(e.target.value)}
                        className="bg-transparent focus:outline-none cursor-pointer max-w-[200px] truncate"
                      >
                        <option value="all">Seluruh Siswa ({siswaList.length} Siswa)</option>
                        {siswaList.map(s => (
                          <option key={s.nisn} value={s.nisn}>
                            {s.nama} ({s.nisn})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadAll()}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Perbarui data"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Segarkan</span>
                    </button>
                  </div>
                </div>

                {/* 5 Period Filter Pills */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { id: 'hari_ini', label: 'Hari Ini' },
                      { id: '7hari', label: '7 Hari Terakhir' },
                      { id: 'bulan_ini', label: 'Bulan Ini' },
                      { id: 'bulan_lalu', label: 'Bulan Lalu' },
                      { id: 'rentang', label: 'Rentang Khusus' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setChartPeriod(opt.id as PeriodFilter)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                          chartPeriod === opt.id
                            ? 'bg-[#00a982] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Pickers */}
                  {chartPeriod === 'rentang' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-bold text-slate-500">Mulai:</span>
                      <input
                        type="date"
                        value={customStart}
                        max={customEnd}
                        onChange={e => setCustomStart(e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                      />
                      <span className="font-bold text-slate-500">Sampai:</span>
                      <input
                        type="date"
                        value={customEnd}
                        min={customStart}
                        max={getTodayDateString()}
                        onChange={e => setCustomEnd(e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* 4 Summary Stat Cards */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <article className="bg-white border border-[#e3ebf5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Total Laporan</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                    {classAnalytics.totalReports}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
                    Misi tersimpan di periode ini
                  </p>
                </article>

                <article className="bg-white border border-[#e3ebf5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Laporan Hari Ini</span>
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums">
                    {classAnalytics.completedTodayCount}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
                    {classAnalytics.todayCompletionRate}% capaian hari ini
                  </p>
                </article>

                <article className="bg-white border border-[#e3ebf5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Capaian Periode</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-sky-600 tabular-nums">
                    {classAnalytics.periodCompletionRate}%
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
                    {classAnalytics.activeDaysCount} dari {classAnalytics.totalDays} hari aktif
                  </p>
                </article>

                <article className="bg-white border border-[#e3ebf5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Tren &amp; Terkuat</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl sm:text-2xl font-black text-amber-500 tabular-nums truncate">
                      {classAnalytics.mostConsistentHabit ? classAnalytics.mostConsistentHabit.shortTitle : 'Belum Ada'}
                    </div>
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      classAnalytics.trendDeltaPercent >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {classAnalytics.trendDeltaPercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(classAnalytics.trendDeltaPercent)}%
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
                    Dibanding periode sebelumnya
                  </p>
                </article>
              </section>

              {/* Empty State vs Charts */}
              {!classAnalytics.hasData ? (
                <article className="bg-white border border-[#e3ebf5] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Belum Ada Catatan Jurnal di Periode Ini
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tidak ada laporan misi 7 kebiasaan dari siswa {session.kelas} pada rentang <strong>{classAnalytics.periodLabel}</strong>.
                      Grafik akan terisi secara otomatis begitu siswa mengirim laporan jurnal mereka.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePage('jurnal')}
                    className="px-5 py-2.5 rounded-2xl bg-[#00a982] hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Lihat Rekap Jurnal Kelas</span>
                  </button>
                </article>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* CHART A: Penyelesaian 7 Kebiasaan */}
                  <article className="bg-white border border-[#e3ebf5] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-[#173b70] flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#00a982]" />
                          <span>A. Penyelesaian 7 Kebiasaan Siswa</span>
                        </h3>
                        <p className="text-[11px] text-[#71819b] mt-0.5">
                          Jumlah dan persentase laporan selesai per kebiasaan di {session.kelas}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {classAnalytics.totalDays} Hari
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {classAnalytics.habitsSummary.map(habit => {
                        const isSelected = selectedGraphHabitId === habit.habitId;
                        return (
                          <div
                            key={habit.habitId}
                            onClick={() => setSelectedGraphHabitId(isSelected ? null : habit.habitId)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-50 border-emerald-400 shadow-2xs'
                                : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-6 h-6 rounded-lg text-white font-black text-[10px] flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: habit.colorHex }}
                                >
                                  {habit.habitId}
                                </span>
                                <span className="text-xs font-black text-slate-800 truncate">
                                  {habit.shortTitle}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                                  {habit.completedCount} <span className="text-[10px] font-medium text-slate-400">laporan</span>
                                </span>
                                <span
                                  className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: habit.colorHex }}
                                >
                                  {habit.percentage}%
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.max(habit.percentage, habit.completedCount > 0 ? 5 : 0)}%`,
                                  backgroundColor: habit.colorHex
                                }}
                              />
                            </div>

                            {isSelected && (
                              <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                                <span>Total tuntas: {habit.completedCount} kali</span>
                                <span className="font-extrabold text-emerald-700">
                                  Capaian {habit.percentage}%
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </article>

                  {/* CHART B: Aktivitas Harian Siswa */}
                  <article className="bg-white border border-[#e3ebf5] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-[#173b70] flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sky-600" />
                            <span>B. Grafik Aktivitas Jurnal Harian</span>
                          </h3>
                          <p className="text-[11px] text-[#71819b] mt-0.5">
                            Jumlah laporan riil yang dicatat setiap hari di kelas
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 shrink-0">
                          {classAnalytics.activeDaysCount} Hari Aktif
                        </span>
                      </div>

                      {/* SVG Trendline */}
                      <div className="relative mt-3 w-full overflow-hidden bg-slate-50/70 rounded-2xl p-2 border border-slate-100">
                        {(() => {
                          const svgW = 560;
                          const svgH = 220;
                          const padL = 36;
                          const padR = 20;
                          const padT = 25;
                          const padB = 35;
                          const gW = svgW - padL - padR;
                          const gH = svgH - padT - padB;
                          const maxVal = Math.max(1, ...classAnalytics.dailyTrend.map(d => d.completedCount), 7);

                          const pts = classAnalytics.dailyTrend.map((item, idx) => {
                            const x = classAnalytics.dailyTrend.length > 1
                              ? padL + (idx / (classAnalytics.dailyTrend.length - 1)) * gW
                              : padL + gW / 2;
                            const y = padT + gH - (item.completedCount / maxVal) * gH;
                            return { x, y, item };
                          });

                          const lPath = pts.length > 0
                            ? pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
                            : '';
                          const aPath = pts.length > 0
                            ? `${lPath} L ${pts[pts.length - 1].x} ${padT + gH} L ${pts[0].x} ${padT + gH} Z`
                            : '';

                          return (
                            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-52 sm:h-56 overflow-visible">
                              <defs>
                                <linearGradient id="guruAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>

                              {/* Grid lines */}
                              {[0, Math.round(maxVal / 2), maxVal].map(val => {
                                const y = padT + gH - (val / maxVal) * gH;
                                return (
                                  <g key={val}>
                                    <line
                                      x1={padL}
                                      y1={y}
                                      x2={svgW - padR}
                                      y2={y}
                                      stroke="#e2e8f0"
                                      strokeDasharray={val === maxVal ? '3 3' : 'none'}
                                      strokeWidth="1"
                                    />
                                    <text
                                      x={padL - 8}
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

                              {aPath && <path d={aPath} fill="url(#guruAreaGrad)" />}
                              {lPath && (
                                <path
                                  d={lPath}
                                  fill="none"
                                  stroke="#0284c7"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              )}

                              {pts.map((pt, idx) => {
                                const isSelected = selectedGraphPointIndex === idx;
                                const isZero = pt.item.completedCount === 0;
                                const showLabel = pts.length <= 7 || idx % Math.ceil(pts.length / 6) === 0 || idx === pts.length - 1;

                                return (
                                  <g
                                    key={idx}
                                    className="cursor-pointer"
                                    onClick={() => setSelectedGraphPointIndex(isSelected ? null : idx)}
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
                                        y={svgH - 10}
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
                          );
                        })()}

                        {/* Interactive tooltip when tapped */}
                        {selectedGraphPointIndex !== null && classAnalytics.dailyTrend[selectedGraphPointIndex] && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs space-y-1">
                            <div className="flex items-center justify-between font-extrabold text-[11px] text-sky-300">
                              <span>{formatDateIndonesian(classAnalytics.dailyTrend[selectedGraphPointIndex].date)}</span>
                              <span>{classAnalytics.dailyTrend[selectedGraphPointIndex].completedCount} Laporan Masuk</span>
                            </div>
                            <div className="text-[10px] text-slate-300">
                              {classAnalytics.dailyTrend[selectedGraphPointIndex].completedCount === 0
                                ? 'Tidak ada siswa yang mengisi jurnal pada hari ini.'
                                : `Misi tercatat: #${classAnalytics.dailyTrend[selectedGraphPointIndex].habits.join(', #')}`}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 flex items-start gap-2 text-xs text-sky-900">
                      <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        Data ini mencerminkan aktivitas riil dari database. Hari tanpa pengisian bernilai <strong>0</strong>.
                      </div>
                    </div>
                  </article>
                </div>
              )}

              {/* SECTION C: Peringkat & Konsistensi Siswa di Kelas */}
              {studentRankings.length > 0 && (
                <section className="bg-white border border-[#e3ebf5] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-[#173b70] flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>C. Peringkat Konsistensi Siswa ({session.kelas})</span>
                      </h3>
                      <p className="text-[11px] text-[#71819b] mt-0.5">
                        Urutan keaktifan pengisian jurnal siswa selama {classAnalytics.periodLabel}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-[#f0f4fa] text-[#536984] font-black">
                          <th className="py-3 px-3">No</th>
                          <th className="py-3 px-3">Nama Siswa</th>
                          <th className="py-3 px-3">NISN</th>
                          <th className="py-3 px-3 text-center">Laporan Tuntas</th>
                          <th className="py-3 px-3 text-center">Capaian</th>
                          <th className="py-3 px-3 text-center">Streak Hari</th>
                          <th className="py-3 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {studentRankings.map((item, idx) => (
                          <tr key={item.siswa.nisn} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-400">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                            </td>
                            <td className="py-3 px-3 font-black text-slate-900">
                              {item.siswa.nama}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                              {item.siswa.nisn}
                            </td>
                            <td className="py-3 px-3 text-center font-black text-slate-800">
                              {item.totalCompleted} misi
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                {item.rate}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-amber-600">
                              🔥 {item.streak} hari
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForGraph(item.siswa.nisn);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-[10px] font-black transition-all cursor-pointer"
                              >
                                Lihat Grafik Siswa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ========================================================
              PAGE 3: REKAP JURNAL HARIAN
          ======================================================== */}
          {activePage === 'jurnal' && (
            <section className="bg-white border border-[#e3ebf5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#173b70] flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-[#00a982]" />
                    Rekap Jurnal Harian Siswa
                  </h2>
                  <p className="text-xs text-[#71819b]">
                    Pantau tujuh kebiasaan siswa berdasarkan tanggal pilihan.
                  </p>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3 py-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#dce6f2] rounded-xl text-xs font-bold text-[#25466f] min-w-[180px]">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="bg-transparent focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#dce6f2] rounded-xl text-xs text-[#25466f] flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Cari nama siswa..."
                    className="bg-transparent focus:outline-none w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportRekapCSV}
                  className="px-4 py-2.5 rounded-xl bg-[#eff5fc] hover:bg-blue-100 text-[#25466f] font-black text-xs transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh CSV Rekap</span>
                </button>
              </div>

              {/* Desktop Table View */}
              <div className="overflow-x-auto rounded-xl border border-[#edf1f7] hidden sm:block">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#edf4fb] text-[#25466f] font-black">
                      <th className="py-3 px-3">No</th>
                      <th className="py-3 px-3">Nama Siswa</th>
                      <th className="py-3 px-2 text-center" title="Misi 1: Bangun Pagi">H1: Bangun</th>
                      <th className="py-3 px-2 text-center" title="Misi 2: Beribadah">H2: Ibadah</th>
                      <th className="py-3 px-2 text-center" title="Misi 3: Berolahraga">H3: Olahraga</th>
                      <th className="py-3 px-2 text-center" title="Misi 4: Gemar Belajar">H4: Belajar</th>
                      <th className="py-3 px-2 text-center" title="Misi 5: Makan Sehat">H5: Makan</th>
                      <th className="py-3 px-2 text-center" title="Misi 6: Membantu Sesama">H6: Bantu</th>
                      <th className="py-3 px-2 text-center" title="Misi 7: Tidur Cepat">H7: Tidur</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1f7] font-semibold text-slate-800">
                    {filteredRekap.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          Belum ada data jurnal laporan masuk untuk tanggal {formatDateIndonesian(selectedDate)} di {session.kelas}.
                        </td>
                      </tr>
                    ) : (
                      filteredRekap.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#f8fbff] transition-colors">
                          <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-black text-[#183a6d]">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-[#e4f4ff] text-[#1a78b8] flex items-center justify-center font-bold text-xs">
                                👦🏻
                              </span>
                              <span>{row.nama}</span>
                            </div>
                          </td>
                          {[row.h1, row.h2, row.h3, row.h4, row.h5, row.h6, row.h7].map((hData, hIndex) => (
                            <td key={hIndex} className="py-3 px-2 text-center">
                              {hData ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (hData.url) {
                                      setPhotoViewer({
                                        isOpen: true,
                                        url: hData.url,
                                        title: `Misi #${hIndex + 1} - ${row.nama}`,
                                        subtitle: `Catatan: ${hData.detail}`
                                      });
                                    } else {
                                      showToast(`Catatan Misi #${hIndex + 1}: ${hData.detail}`);
                                    }
                                  }}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-[#d9faec] text-[#00996e] hover:bg-emerald-200 transition-colors"
                                  title={`Catatan: ${hData.detail}${hData.url ? ' (Klik lihat foto)' : ''}`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  {hData.url && <Eye className="w-2.5 h-2.5 ml-0.5" />}
                                </button>
                              ) : (
                                <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-[#eef3f8] text-[#a3b4c8]">
                                  <XCircle className="w-4 h-4" />
                                </span>
                              )}
                            </td>
                          ))}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const found = siswaList.find(s => s.nama.toLowerCase() === row.nama.toLowerCase());
                                  setSelectedSiswaForPiagam({
                                    id: 's-' + idx,
                                    nisn: found ? found.nisn : '0123456789',
                                    nama: row.nama,
                                    panggilan: row.nama.split(' ')[0],
                                    kelas: session.kelas,
                                    tahunAjaran: '2026/2027'
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#fff9e9] text-[#db8100] border border-[#ffcc57] hover:bg-amber-100 text-[10px] font-black transition-colors inline-flex items-center gap-1 shadow-xs"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Piagam</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteJurnalRow(row)}
                                className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white text-[10px] font-black transition-colors inline-flex items-center gap-1 shadow-xs"
                                title="Hapus permanen laporan jurnal siswa ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="grid sm:hidden gap-3">
                {filteredRekap.map((s, i) => {
                  const completed = [s.h1, s.h2, s.h3, s.h4, s.h5, s.h6, s.h7].filter(Boolean).length;
                  return (
                    <article key={i} className="border border-[#e3ebf5] rounded-2xl p-4 bg-white shadow-xs space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-[#e4f4ff] text-[#1a78b8] flex items-center justify-center font-bold text-xs">
                            👦🏻
                          </span>
                          <span className="font-black text-xs text-[#183a6d]">{s.nama}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const found = siswaList.find(x => x.nama.toLowerCase() === s.nama.toLowerCase());
                              setSelectedSiswaForPiagam({
                                id: 's-' + i,
                                nisn: found ? found.nisn : '0123456789',
                                nama: s.nama,
                                panggilan: s.nama.split(' ')[0],
                                kelas: session.kelas,
                                tahunAjaran: '2026/2027'
                              });
                            }}
                            className="px-2 py-1 rounded-lg bg-[#fff9e9] text-[#db8100] border border-[#ffcc57] text-[10px] font-black inline-flex items-center gap-1"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Piagam</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJurnalRow(s)}
                            className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black inline-flex items-center gap-1 hover:bg-rose-600 hover:text-white transition-colors"
                            title="Hapus permanen jurnal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-1.5 flex-wrap">
                        {[s.h1, s.h2, s.h3, s.h4, s.h5, s.h6, s.h7].map((v, j) => (
                          <span
                            key={j}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              v ? 'bg-[#d9faec] text-[#00996e]' : 'bg-[#eef3f8] text-[#a3b4c8]'
                            }`}
                            title={`Misi #${j + 1}`}
                          >
                            {v ? '✓' : '-'}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#71819b] pt-1 border-t border-slate-100 font-bold">
                        <span>{completed} dari 7 kebiasaan selesai</span>
                        <span className="text-emerald-600">{Math.round((completed / 7) * 100)}%</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* ========================================================
              PAGE 3: MANAJEMEN AGEN SISWA
          ======================================================== */}
          {activePage === 'agen' && (
            <section className="bg-white border border-[#e3ebf5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#173b70] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#00a982]" />
                    Manajemen Agen Siswa
                  </h2>
                  <p className="text-xs text-[#71819b]">
                    Daftar siswa dan status agen kelas {session.kelas}.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSiswaOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#08b985] to-[#009b88] hover:brightness-105 text-white font-black text-xs transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Siswa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImportOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#1478d4] hover:bg-[#1166b5] text-white font-black text-xs transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import CSV / Excel</span>
                  </button>
                  {selectedNisn.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteBulkSiswa}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus ({selectedNisn.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-[#edf1f7]">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#edf4fb] text-[#25466f] font-black">
                      <th className="py-3 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedNisn.length > 0 && selectedNisn.length === siswaList.length}
                          onChange={e => {
                            if (e.target.checked) setSelectedNisn(siswaList.map(s => s.nisn));
                            else setSelectedNisn([]);
                          }}
                          className="rounded text-emerald-600"
                        />
                      </th>
                      <th className="py-3 px-3">NISN</th>
                      <th className="py-3 px-3">Nama Lengkap</th>
                      <th className="py-3 px-3">Panggilan</th>
                      <th className="py-3 px-3">Kelas</th>
                      <th className="py-3 px-3">Tahun Ajaran</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1f7] font-semibold text-slate-800">
                    {filteredSiswa.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Belum ada siswa terdaftar di {session.kelas}. Silakan klik Tambah Siswa atau Import CSV.
                        </td>
                      </tr>
                    ) : (
                      filteredSiswa.map(siswa => (
                        <tr key={siswa.nisn} className="hover:bg-[#f8fbff] transition-colors">
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={selectedNisn.includes(siswa.nisn)}
                              onChange={e => {
                                if (e.target.checked) setSelectedNisn([...selectedNisn, siswa.nisn]);
                                else setSelectedNisn(selectedNisn.filter(n => n !== siswa.nisn));
                              }}
                              className="rounded text-emerald-600"
                            />
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{siswa.nisn}</td>
                          <td className="py-3 px-3 font-black text-slate-900">{siswa.nama}</td>
                          <td className="py-3 px-3 text-slate-600">{siswa.panggilan || '-'}</td>
                          <td className="py-3 px-3 text-slate-600">{siswa.kelas}</td>
                          <td className="py-3 px-3 text-slate-600">{siswa.tahunAjaran}</td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedSiswaForPiagam(siswa)}
                                className="px-3 py-1 rounded-lg bg-[#fff9e9] text-[#db8100] border border-[#ffcc57] text-[11px] font-black inline-flex items-center gap-1 shadow-xs hover:bg-amber-100"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Piagam</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleSiswa(siswa)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white text-[11px] font-black inline-flex items-center gap-1 shadow-xs transition-colors"
                                title="Hapus permanen agen siswa dari database"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ========================================================
              PAGE 4: MATERI & KUIS 7 KEBIASAAN
          ======================================================== */}
          {activePage === 'materi' && (
            <section className="bg-white border border-[#e3ebf5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#173b70] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#00a982]" />
                    Materi &amp; Kuis 7 Kebiasaan
                  </h2>
                  <p className="text-xs text-[#71819b]">
                    Kelola bahan edukasi karakter dan kuis interaktif yang ditampilkan pada modal pengisian jurnal siswa.
                  </p>
                </div>
              </div>

              {/* Habit Selector Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {HABIT_DEFINITIONS.map(h => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedHabitId(h.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedHabitId === h.id
                        ? 'border-[#00a982] bg-emerald-50 text-[#12366b] font-black shadow-xs'
                        : 'border-[#e3ebf5] bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold">Misi #{h.number}</span>
                    <span className="text-[11px] truncate max-w-full font-medium">{h.shortTitle}</span>
                  </button>
                ))}
              </div>

              {/* Form Editor */}
              <form onSubmit={handleSaveMateri} className="space-y-5 pt-2">
                <div className="p-4 bg-[#f8fbff] rounded-2xl border border-[#e3ebf5]">
                  <span className="text-xs font-bold text-slate-400">Sedang Mengedit:</span>
                  <h4 className="font-black text-base text-slate-900 mt-0.5">
                    {currentHabitDef.title} ({currentHabitDef.badgeText})
                  </h4>
                </div>

                {/* Materi Teks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Teks Artikel / Pesan Karakter Guru:
                  </label>
                  <textarea
                    rows={3}
                    value={materiForm.materiTeks}
                    onChange={e => setMateriForm({ ...materiForm, materiTeks: e.target.value })}
                    placeholder="Tuliskan motivasi, dalil/kutipan bijak, atau arahan singkat untuk anak-anak..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed bg-white"
                  />
                </div>

                {/* Link YouTube */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-rose-500" />
                    Link Video YouTube Edukatif (Opsional):
                  </label>
                  <input
                    type="url"
                    value={materiForm.linkYt}
                    onChange={e => setMateriForm({ ...materiForm, linkYt: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                  />
                  {ytEmbedUrl && (
                    <div className="mt-3 max-w-md aspect-video rounded-xl overflow-hidden shadow-sm">
                      <iframe src={ytEmbedUrl} title="Preview YouTube" className="w-full h-full border-0" />
                    </div>
                  )}
                </div>

                {/* Quiz Toggle */}
                <div className="p-4 bg-[#f8fbff] rounded-2xl border border-[#e3ebf5] flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">Aktifkan Kuis Pilihan Ganda</h5>
                    <p className="text-xs text-slate-500">
                      Siswa dapat menjawab kuis ini langsung di modal misi harian mereka
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={materiForm.kuisAktif}
                      onChange={e => setMateriForm({ ...materiForm, kuisAktif: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                {/* Quiz Fields */}
                {materiForm.kuisAktif && (
                  <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
                        Pertanyaan Kuis:
                      </label>
                      <input
                        type="text"
                        value={materiForm.pertanyaan}
                        onChange={e => setMateriForm({ ...materiForm, pertanyaan: e.target.value })}
                        placeholder="Contoh: Mengapa kita harus sarapan bergizi sebelum ke sekolah?"
                        className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pilihan A:</label>
                        <input
                          type="text"
                          value={materiForm.opsiA}
                          onChange={e => setMateriForm({ ...materiForm, opsiA: e.target.value })}
                          placeholder="Jawaban A..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pilihan B:</label>
                        <input
                          type="text"
                          value={materiForm.opsiB}
                          onChange={e => setMateriForm({ ...materiForm, opsiB: e.target.value })}
                          placeholder="Jawaban B..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pilihan C:</label>
                        <input
                          type="text"
                          value={materiForm.opsiC}
                          onChange={e => setMateriForm({ ...materiForm, opsiC: e.target.value })}
                          placeholder="Jawaban C..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
                        Kunci Jawaban Benar:
                      </label>
                      <div className="flex gap-4">
                        {['A', 'B', 'C'].map(k => (
                          <label key={k} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                            <input
                              type="radio"
                              name="kunciJawaban"
                              value={k}
                              checked={materiForm.jawaban === k}
                              onChange={e => setMateriForm({ ...materiForm, jawaban: e.target.value })}
                              className="text-indigo-600"
                            />
                            <span>Pilihan {k}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {materiSaveStatus && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{materiSaveStatus}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Materi &amp; Kuis Misi #{selectedHabitId}</span>
                </button>
              </form>
            </section>
          )}

          {/* ========================================================
              PAGE 5: PENGATURAN KELAS & PIAGAM
          ======================================================== */}
          {activePage === 'pengaturan' && (
            <section className="bg-white border border-[#e3ebf5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#173b70] flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#00a982]" />
                  Pengaturan Kelas &amp; Piagam
                </h2>
                <p className="text-xs text-[#71819b]">
                  Atur identitas kelas dan preferensi penerbitan piagam penghargaan.
                </p>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Lengkap &amp; Gelar Guru Pengampu:
                  </label>
                  <input
                    type="text"
                    value={guruConfig.namaGuru}
                    onChange={e => setGuruConfig({ ...guruConfig, namaGuru: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tempat Cetak Piagam:
                    </label>
                    <input
                      type="text"
                      value={guruConfig.tempatCetak}
                      onChange={e => setGuruConfig({ ...guruConfig, tempatCetak: e.target.value })}
                      placeholder="Contoh: Jakarta"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tanggal Cetak Piagam:
                    </label>
                    <input
                      type="date"
                      value={guruConfig.tanggalCetak}
                      onChange={e => setGuruConfig({ ...guruConfig, tanggalCetak: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                    />
                  </div>
                </div>

                {configSaveStatus && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{configSaveStatus}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan Kelas</span>
                </button>
              </form>
            </section>
          )}

          {/* Footer */}
          <footer className="text-center pt-8 pb-4 text-[11px] text-[#71819b] font-semibold no-print">
            © {new Date().getFullYear()} 7 Kebiasaan Anak Indonesia Hebat • Pusat Kendali Guru Pembina ({session.kelas})
          </footer>
        </div>
      </main>

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION
      ======================================================== */}
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#e3ebf5] flex items-center justify-around z-40 sm:hidden no-print">
        <button
          type="button"
          onClick={() => setActivePage('beranda')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activePage === 'beranda' ? 'text-[#00a879]' : 'text-[#8a9ab0]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePage('jurnal')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activePage === 'jurnal' ? 'text-[#00a879]' : 'text-[#8a9ab0]'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Jurnal</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePage('agen')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activePage === 'agen' ? 'text-[#00a879]' : 'text-[#8a9ab0]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Agen</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePage('materi')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activePage === 'materi' ? 'text-[#00a879]' : 'text-[#8a9ab0]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Materi</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePage('pengaturan')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activePage === 'pengaturan' ? 'text-[#00a879]' : 'text-[#8a9ab0]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Lainnya</span>
        </button>
      </nav>

      {/* ========================================================
          MODAL: TAMBAH SISWA
      ======================================================== */}
      {isAddSiswaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-base">Tambah Agen Siswa Baru</h4>
              <button
                type="button"
                onClick={() => setIsAddSiswaOpen(false)}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSiswa} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NISN / Nomor Induk *</label>
                <input
                  type="text"
                  value={newSiswa.nisn}
                  onChange={e => setNewSiswa({ ...newSiswa, nisn: e.target.value })}
                  placeholder="Contoh: 0123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  value={newSiswa.nama}
                  onChange={e => setNewSiswa({ ...newSiswa, nama: e.target.value })}
                  placeholder="Nama lengkap..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Panggilan</label>
                <input
                  type="text"
                  value={newSiswa.panggilan}
                  onChange={e => setNewSiswa({ ...newSiswa, panggilan: e.target.value })}
                  placeholder="Nama panggilan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas:</label>
                  <input
                    type="text"
                    value={newSiswa.kelas}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Ajaran:</label>
                  <input
                    type="text"
                    value={newSiswa.tahunAjaran}
                    onChange={e => setNewSiswa({ ...newSiswa, tahunAjaran: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 pt-1">
                Data akan otomatis disinkronkan ke Google Spreadsheet melalui Google Apps Script Web App.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSiswaOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: IMPORT CSV
      ======================================================== */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-base">Import Siswa dari CSV / Excel</h4>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Unggah file CSV dengan kolom: <strong>NISN, Nama Lengkap, Panggilan, Kelas, Tahun Ajaran</strong>.
            </p>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Format Template CSV</span>
            </button>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-emerald-500 transition-colors bg-slate-50/50">
              <label className="cursor-pointer block">
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">Pilih File CSV Siswa</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Format .csv (UTF-8)</span>
                <input type="file" accept=".csv,text/csv" onChange={handleImportCSV} className="hidden" />
              </label>
            </div>

            {importStatus && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold">
                {importStatus}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PIAGAM PENGHARGAAN
      ======================================================== */}
      {selectedSiswaForPiagam && (
        <PiagamModal
          isOpen={Boolean(selectedSiswaForPiagam)}
          onClose={() => setSelectedSiswaForPiagam(null)}
          siswaNama={selectedSiswaForPiagam.nama}
          siswaKelas={selectedSiswaForPiagam.kelas}
          siswaNisn={selectedSiswaForPiagam.nisn}
        />
      )}

      {/* ========================================================
          MODAL: PHOTO VIEWER
      ======================================================== */}
      {photoViewer.isOpen && (
        <PhotoViewerModal
          isOpen={true}
          onClose={() => setPhotoViewer(prev => ({ ...prev, isOpen: false }))}
          photoUrl={photoViewer.url}
          title={photoViewer.title}
          subtitle={photoViewer.subtitle}
        />
      )}

      {/* ========================================================
          MODAL: DATABASE CONFIG
      ======================================================== */}
      {isDbModalOpen && (
        <DatabaseConfigModal
          isOpen={true}
          onClose={() => {
            setIsDbModalOpen(false);
            loadAll();
            if (onRefresh) onRefresh();
          }}
          onDataChanged={() => {
            loadAll();
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION (HP FRIENDLY, MIN 48PX TARGETS)
      ======================================================== */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e3ebf5] shadow-lg px-2 py-1.5 lg:hidden no-print">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActivePage('beranda')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePage === 'beranda' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Beranda</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('grafik')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePage === 'grafik' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Grafik</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('jurnal')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePage === 'jurnal' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
            }`}
          >
            <ClipboardCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Jurnal</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('agen')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePage === 'agen' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('pengaturan')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePage === 'pengaturan' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Profil</span>
          </button>
        </div>
      </nav>

      {/* ========================================================
          TOAST NOTIFICATION
      ======================================================== */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 bottom-5 z-50 bg-[#12366b] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================
          MODAL: KONFIRMASI HAPUS DATA (JURNAL / SISWA)
      ======================================================== */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onClose={() => {
          if (!confirmModal.isLoading) {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        }}
      />

      {/* ========================================================
          MODAL: KONFIRMASI KELUAR SESI GURU
      ======================================================== */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        type="warning"
        title="Keluar dari Sesi Guru?"
        message={`Apakah Anda yakin ingin keluar dari akun Guru ${session.nama} (${session.kelas})?\nSeluruh data jurnal dan rekap tersimpan aman.`}
        confirmLabel="Ya, Keluar Akun"
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          if (onLogout) onLogout();
        }}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};
