import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  GraduationCap,
  School,
  BookOpen,
  BarChart3,
  Settings,
  Database,
  User,
  LogOut,
  Award,
  Printer,
  Sparkles,
  Plus,
  Search,
  Download,
  Trash2,
  Pencil,
  Power,
  X,
  Check,
  Save,
  ShieldCheck,
  AlertCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Landmark,
  BookText,
  Calculator,
  FlaskConical,
  Activity,
  Palette,
  Languages,
  Menu,
  ChevronDown,
  Lock,
  Clock,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  RefreshCw,
  Info
} from 'lucide-react';
import { DailySummaryRow, DashboardStats, GuruRecord, PengaturanConfig, PeriodFilter, SiswaRecord, UserSession } from '../../types';
import { StorageService, getTodayDateString, getDateOffsetString } from '../../services/storageService';
import { exportToCSV, formatDateIndonesian, fileToBase64 } from '../../utils/helpers';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import { DatabaseConfigModal } from '../common/DatabaseConfigModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { HABIT_DEFINITIONS } from '../../data/habitDefinitions';

interface KepsekDashboardProps {
  session: UserSession;
  onRefresh?: () => void;
  onLogout?: () => void;
}

type AdminPage =
  | 'dashboard'
  | 'monitoring'
  | 'guru'
  | 'siswa'
  | 'kelas'
  | 'mapel'
  | 'laporan'
  | 'kop'
  | 'database'
  | 'profil';

interface ClassData {
  name: string;
  students: number;
  teacher: string;
  value: number;
}

const DEFAULT_SUBJECTS = [
  { title: 'Pendidikan Agama', icon: BookOpen, bg: '#e8f0ff', color: '#2563eb' },
  { title: 'Pendidikan Pancasila', icon: Landmark, bg: '#e3faf0', color: '#059669' },
  { title: 'Bahasa Indonesia', icon: BookText, bg: '#fff0df', color: '#d97706' },
  { title: 'Matematika', icon: Calculator, bg: '#eee8ff', color: '#7c3aed' },
  { title: 'IPAS', icon: FlaskConical, bg: '#e1f8f6', color: '#0d9488' },
  { title: 'PJOK', icon: Activity, bg: '#ffe8ef', color: '#e11d48' },
  { title: 'Seni Budaya', icon: Palette, bg: '#f1eaff', color: '#9333ea' },
  { title: 'Bahasa Inggris', icon: Languages, bg: '#e5efff', color: '#3b82f6' }
];

export const KepsekDashboard: React.FC<KepsekDashboardProps> = ({ session, onRefresh, onLogout }) => {
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Selected date & filters
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('all');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<'all' | 'Aktif' | 'Nonaktif'>('all');
  const [chartRange, setChartRange] = useState<'week' | 'month'>('week');
  const [reportPeriod, setReportPeriod] = useState<PeriodFilter>('7hari');
  const [customStart, setCustomStart] = useState<string>(getDateOffsetString(14));
  const [customEnd, setCustomEnd] = useState<string>(getTodayDateString());
  const [selectedHabitDetailId, setSelectedHabitDetailId] = useState<number | null>(null);
  const [selectedTrendPointIndex, setSelectedTrendPointIndex] = useState<number | null>(null);

  // Student list search & filter
  const [siswaSearch, setSiswaSearch] = useState('');
  const [siswaKelasFilter, setSiswaKelasFilter] = useState('all');

  // Data state
  const [totalSiswaCount, setTotalSiswaCount] = useState<number>(0);
  const [siswaList, setSiswaList] = useState<SiswaRecord[]>([]);
  const [guruList, setGuruList] = useState<GuruRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<{ total: number; stats: DashboardStats; tanggal: string }>({
    total: 0,
    stats: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0, h7: 0 },
    tanggal: getTodayDateString()
  });
  const [rekapList, setRekapList] = useState<DailySummaryRow[]>([]);
  const [classesData, setClassesData] = useState<ClassData[]>([]);

  // Selected teachers for bulk operations
  const [selectedGuruUsernames, setSelectedGuruUsernames] = useState<string[]>([]);

  // KOP Configuration
  const [kopConfig, setKopConfig] = useState<PengaturanConfig>(StorageService.getPengaturanKop().data);
  const [kopSaveStatus, setKopSaveStatus] = useState<string | null>(null);

  // Modals
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherFormData, setTeacherFormData] = useState({
    username: '',
    nama: '',
    kelas: 'Kelas 1A',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    password: ''
  });

  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [photoViewer, setPhotoViewer] = useState<{ isOpen: boolean; url: string; title: string; subtitle?: string }>({
    isOpen: false,
    url: '',
    title: '',
    subtitle: ''
  });

  // Modals for confirmation (Delete & Logout)
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

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3200);
  };

  const isGasConnected = Boolean(StorageService.getAppsScriptUrl());

  const loadData = () => {
    // 1. Stats
    const statsRes = StorageService.getDashboardKepsekData('Kepala Sekolah', selectedKelasFilter === 'all' ? '' : selectedKelasFilter);
    if (statsRes.success) {
      setDashboardStats({
        total: statsRes.total,
        stats: statsRes.stats,
        tanggal: statsRes.tanggal
      });
    }

    // 2. Rekap Jurnal
    const rekapData = StorageService.ambilDataGabungan(
      'Kepala Sekolah',
      selectedKelasFilter === 'all' ? '' : selectedKelasFilter,
      selectedDate
    );
    setRekapList(rekapData);

    // 3. Guru
    const gurus = StorageService.ambilDataGuru();
    setGuruList(gurus);

    // 4. Siswa
    const siswas = StorageService.ambilDataSiswa('Kepala Sekolah');
    setSiswaList(siswas);
    setTotalSiswaCount(siswas.length);

    // 5. KOP
    const kop = StorageService.getPengaturanKop().data;
    setKopConfig(kop);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedKelasFilter]);

  // Dynamic analytics strictly from real database
  const adminAnalytics = useMemo(() => {
    return StorageService.getDynamicAnalytics({
      role: 'Kepala Sekolah',
      kelas: selectedKelasFilter,
      period: reportPeriod,
      startDate: reportPeriod === 'rentang' ? customStart : undefined,
      endDate: reportPeriod === 'rentang' ? customEnd : undefined
    });
  }, [selectedKelasFilter, reportPeriod, customStart, customEnd, rekapList, siswaList]);

  // Real habit metrics calculation based strictly on saved database records
  const habitPerformance = useMemo(() => {
    return adminAnalytics.habitsSummary.map(h => ({
      id: h.habitId,
      name: h.shortTitle,
      value: h.percentage,
      count: h.completedCount,
      color: h.colorHex
    }));
  }, [adminAnalytics]);

  const avgProgress = useMemo(() => {
    return adminAnalytics.periodCompletionRate;
  }, [adminAnalytics]);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase();
    return guruList.filter(t => {
      const matchFilter = teacherFilter === 'all' || (t.status || 'Aktif') === teacherFilter;
      const matchQuery =
        t.nama.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q) ||
        t.kelas.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
  }, [guruList, teacherSearch, teacherFilter]);

  // Filtered students list
  const filteredSiswa = useMemo(() => {
    const q = siswaSearch.toLowerCase();
    return siswaList.filter(s => {
      const matchFilter = siswaKelasFilter === 'all' || s.kelas.toLowerCase().includes(siswaKelasFilter.toLowerCase());
      const matchQuery =
        s.nama.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (s.panggilan && s.panggilan.toLowerCase().includes(q));
      return matchFilter && matchQuery;
    });
  }, [siswaList, siswaSearch, siswaKelasFilter]);

  // Dynamic classes computation based on actual students and teachers in DB
  const dynamicClasses = useMemo(() => {
    const rawClassNames = Array.from(
      new Set([
        ...siswaList.map(s => (s.kelas || '').trim()),
        ...guruList.filter(g => (g.kelas || '').toLowerCase() !== 'kepsek').map(g => (g.kelas || '').trim())
      ].filter(Boolean))
    ).sort();

    if (rawClassNames.length === 0) {
      return [];
    }

    return rawClassNames.map(cName => {
      const studentCount = siswaList.filter(s => (s.kelas || '').trim().toUpperCase() === cName.toUpperCase()).length;
      const teacher = guruList.find(g => (g.kelas || '').trim().toUpperCase() === cName.toUpperCase())?.nama || 'Guru Pembina';
      const cAnalytics = StorageService.getDynamicAnalytics({
        role: 'Guru',
        kelas: cName,
        period: reportPeriod,
        startDate: reportPeriod === 'rentang' ? customStart : undefined,
        endDate: reportPeriod === 'rentang' ? customEnd : undefined
      });
      return {
        name: cName,
        students: studentCount,
        teacher,
        value: cAnalytics.periodCompletionRate
      };
    });
  }, [siswaList, guruList, reportPeriod, customStart, customEnd, rekapList]);

  // Class filtering
  const filteredClasses = useMemo(() => {
    if (selectedKelasFilter === 'all') return dynamicClasses;
    return dynamicClasses.filter(c => c.name.toLowerCase() === selectedKelasFilter.toLowerCase());
  }, [dynamicClasses, selectedKelasFilter]);

  const monitorAverage = useMemo(() => {
    if (dynamicClasses.length === 0) return '0%';
    const avg = Math.round(dynamicClasses.reduce((acc, c) => acc + c.value, 0) / dynamicClasses.length);
    return `${avg}%`;
  }, [dynamicClasses]);

  const monitorAttention = useMemo(() => {
    return dynamicClasses.filter(c => c.value < 65).length;
  }, [dynamicClasses]);

  // Teacher handlers
  const handleOpenAddTeacher = () => {
    setEditingTeacherId(null);
    setTeacherFormData({
      username: '',
      nama: '',
      kelas: 'Kelas 1A',
      status: 'Aktif',
      password: ''
    });
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (teacher: GuruRecord) => {
    setEditingTeacherId(teacher.id || teacher.username);
    setTeacherFormData({
      username: teacher.username,
      nama: teacher.nama,
      kelas: teacher.kelas,
      status: teacher.status || 'Aktif',
      password: teacher.password || ''
    });
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFormData.username.trim() || !teacherFormData.nama.trim()) {
      showToast('NIP / Username dan Nama Lengkap wajib diisi!');
      return;
    }

    if (editingTeacherId) {
      const res = await StorageService.updateDataGuru({
        id: editingTeacherId,
        username: teacherFormData.username.trim(),
        nama: teacherFormData.nama.trim(),
        kelas: teacherFormData.kelas,
        status: teacherFormData.status,
        password: teacherFormData.password
      });
      showToast(res.message);
    } else {
      const duplicate = guruList.some(g => g.username.toLowerCase() === teacherFormData.username.trim().toLowerCase());
      if (duplicate) {
        showToast('NIP / Username sudah digunakan!');
        return;
      }
      const res = await StorageService.simpanDataGuru({
        username: teacherFormData.username.trim(),
        nama: teacherFormData.nama.trim(),
        kelas: teacherFormData.kelas,
        status: teacherFormData.status,
        password: teacherFormData.password
      });
      showToast(res.message);
    }

    setIsTeacherModalOpen(false);
    loadData();
    if (onRefresh) onRefresh();
  };

  const handleToggleTeacherStatus = (teacher: GuruRecord) => {
    if (teacher.kelas.toLowerCase() === 'kepsek') {
      showToast('Akun Kepala Sekolah dilindungi dan tidak dapat dinonaktifkan.');
      return;
    }
    const res = StorageService.toggleStatusGuru(teacher.username);
    showToast(res.message);
    loadData();
  };

  const handleDeleteTeacher = (teacher: GuruRecord) => {
    if (teacher.kelas.toLowerCase() === 'kepsek') {
      showToast('Akun Kepala Sekolah dilindungi dan tidak dapat dihapus!');
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Akun Guru?',
      message: `Apakah Anda yakin ingin menghapus akun guru ${teacher.nama} (NIP/Username: ${teacher.username}) dari kelas ${teacher.kelas}?\n\nAkun guru dan riwayat aktivitasnya akan dihapus secara PERMANEN dari database.`,
      confirmLabel: 'Ya, Hapus Akun Guru',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const res = await StorageService.hapusDataGuruBulk([teacher.username], session);
          showToast(res.message);
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          loadData();
          if (onRefresh) onRefresh();
        } catch (err: any) {
          showToast('Gagal menghapus guru: ' + (err.message || String(err)));
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleDeleteSelectedTeachers = () => {
    if (selectedGuruUsernames.length === 0) return;
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Massal Akun Guru?',
      message: `HAPUS PERMANEN?\n\nApakah Anda yakin ingin menghapus ${selectedGuruUsernames.length} akun guru terpilih secara permanen dari server dan database?\n\nSeluruh akun yang dipilih tidak akan dapat login kembali.`,
      confirmLabel: `Ya, Hapus (${selectedGuruUsernames.length}) Guru`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const res = await StorageService.hapusDataGuruBulk(selectedGuruUsernames, session);
          showToast(res.message);
          setSelectedGuruUsernames([]);
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          loadData();
          if (onRefresh) onRefresh();
        } catch (err: any) {
          showToast('Gagal menghapus guru terpilih: ' + (err.message || String(err)));
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleDeleteMonitoringJurnal = (row: DailySummaryRow) => {
    const student = siswaList.find(s => s.nama.trim().toLowerCase() === row.nama.trim().toLowerCase());
    const username = row.username || (student ? student.nisn : '');
    if (!username) {
      showToast('Gagal mendeteksi NISN siswa untuk penghapusan jurnal.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Laporan Jurnal Siswa?',
      message: `HAPUS PERMANEN JURNAL SISWA?\n\nApakah Anda yakin ingin menghapus seluruh catatan 7 Kebiasaan untuk ${row.nama} (${row.kelas}) pada tanggal ${formatDateIndonesian(selectedDate)}?\n\nLaporan catatan dan foto bukti akan dihapus secara PERMANEN dari server dan database.`,
      confirmLabel: 'Ya, Hapus Jurnal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const res = await StorageService.hapusSeluruhJurnalSiswa(username, selectedDate, session);
          showToast(res.message);
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          loadData();
          if (onRefresh) onRefresh();
        } catch (err: any) {
          showToast('Gagal menghapus jurnal: ' + (err.message || String(err)));
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleDeleteSiswa = (s: SiswaRecord) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Permanen Agen Siswa?',
      message: `HAPUS PERMANEN AGEN SISWA?\n\nApakah Anda yakin ingin menghapus data agen siswa ${s.nama} (NISN: ${s.nisn}) dari kelas ${s.kelas}?\n\nData akun dan riwayat pembiasaan siswa akan dihapus secara PERMANEN dari server dan database.`,
      confirmLabel: 'Ya, Hapus Siswa',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const res = await StorageService.hapusDataSiswa(s.nisn, session);
          showToast(res.message);
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          loadData();
          if (onRefresh) onRefresh();
        } catch (err: any) {
          showToast('Gagal menghapus siswa: ' + (err.message || String(err)));
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  // KOP handlers
  const handleSaveKop = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await StorageService.simpanPengaturanKop({
      namaSekolah: kopConfig.namaSekolah,
      logoSekolah: kopConfig.logoSekolah,
      linkYoutube: kopConfig.linkYoutube,
      usernameKepsek: kopConfig.usernameKepsek,
      passwordKepsek: kopConfig.passwordKepsek
    });

    if (res.success) {
      setKopSaveStatus(res.message);
      showToast('Pengaturan KOP Sekolah & Akun berhasil disimpan ke database Google Sheets!');
      setTimeout(() => setKopSaveStatus(null), 3000);
      if (onRefresh) onRefresh();
    } else {
      showToast(res.message);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setKopConfig(prev => ({ ...prev, logoSekolah: base64 }));
      showToast('Logo baru siap disimpan.');
    } catch {
      showToast('Gagal memproses file gambar logo.');
    }
  };

  // Export CSV
  const handleExportTeachersCSV = () => {
    const rows = guruList.map(g => ({
      Username: g.username,
      'Nama Lengkap': g.nama,
      Kelas: g.kelas,
      Status: g.status || 'Aktif',
      'Tanggal Cetak': g.tanggalCetak || '-'
    }));
    exportToCSV(rows, `daftar-guru-${getTodayDateString()}.csv`);
    showToast('Daftar guru berhasil diekspor ke CSV.');
  };

  const handleExportRekapCSV = () => {
    const rows = rekapList.map(r => ({
      Tanggal: r.tanggal,
      Kelas: r.kelas,
      'Nama Siswa': r.nama,
      'H1 Bangun Pagi': r.h1 ? r.h1.detail : 'Belum',
      'H2 Beribadah': r.h2 ? r.h2.detail : 'Belum',
      'H3 Berolahraga': r.h3 ? r.h3.detail : 'Belum',
      'H4 Gemar Belajar': r.h4 ? r.h4.detail : 'Belum',
      'H5 Makan Sehat': r.h5 ? r.h5.detail : 'Belum',
      'H6 Membantu Sesama': r.h6 ? r.h6.detail : 'Belum',
      'H7 Tidur Tepat Waktu': r.h7 ? r.h7.detail : 'Belum'
    }));
    exportToCSV(rows, `laporan-monitoring-7kebiasaan-${selectedDate}.csv`);
    showToast('Laporan monitoring berhasil diekspor ke CSV.');
  };

  const handlePrint = () => {
    window.print();
  };

  const pageTitles: Record<AdminPage, string> = {
    dashboard: 'Dashboard Monitoring Kepala Sekolah',
    monitoring: 'Monitoring Seluruh Kelas',
    guru: 'Manajemen Guru',
    siswa: 'Manajemen Siswa',
    kelas: 'Kelas & Rombel',
    mapel: 'Mata Pelajaran',
    laporan: 'Laporan & Statistik',
    kop: 'KOP Sekolah & Akun',
    database: 'Integrasi Database & Backup',
    profil: 'Profil Admin'
  };

  const bestClass = useMemo(() => {
    return [...classesData].sort((a, b) => b.value - a.value)[0]?.name || '4A';
  }, [classesData]);

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-[#172c50] flex font-sans antialiased">
      {/* ========================================================
          SIDEBAR
      ======================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 w-[255px] bg-gradient-to-b from-[#173969] via-[#102b56] to-[#15396a] text-white flex flex-col z-50 transition-transform duration-300 ease-in-out overflow-y-auto no-print ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-white text-2xl flex items-center justify-center shrink-0 shadow-md">
            🏫
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-sm leading-tight text-white tracking-tight">
              7 Kebiasaan Anak<br />Indonesia Hebat
            </h1>
            <p className="text-[11px] text-blue-200 truncate mt-1">
              {kopConfig.namaSekolah || 'Nama Sekolah'}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="mx-3.5 my-4 p-3 rounded-2xl bg-white/5 border border-white/15 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-slate-800 text-xl flex items-center justify-center shrink-0 font-bold">
            👨🏻‍💼
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-xs text-white truncate">
              {kopConfig.usernameKepsek || session.nama || 'Admin Sekolah'}
            </div>
            <div className="text-[10px] text-blue-200">Kepala Sekolah</div>
          </div>
          <ChevronDown className="w-4 h-4 text-blue-200/70 shrink-0" />
        </div>

        {/* Nav Label: MENU UTAMA */}
        <div className="px-5 py-2 text-[10px] font-black tracking-wider text-blue-300/80 uppercase">
          Menu Utama
        </div>

        <nav className="px-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActivePage('dashboard');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'dashboard'
                ? 'bg-gradient-to-r from-[#00b995] to-[#1488d9] text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('monitoring');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'monitoring'
                ? 'bg-gradient-to-r from-[#00b995] to-[#1488d9] text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Monitoring Kelas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('guru');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'guru'
                ? 'bg-gradient-to-r from-[#00b995] to-[#1488d9] text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="flex-1">Manajemen Guru</span>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-extrabold">
              {guruList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('siswa');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'siswa'
                ? 'bg-gradient-to-r from-[#00b995] to-[#1488d9] text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>Manajemen Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('kelas');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'kelas'
                ? 'bg-gradient-to-r from-[#00b995] to-[#1488d9] text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <School className="w-4 h-4 shrink-0" />
            <span>Kelas &amp; Rombel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('laporan');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'laporan'
                ? 'bg-gradient-to-r from-[#00b995] to-[#1488d9] text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Laporan &amp; Statistik</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('kop');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'kop'
                ? 'bg-gradient-to-r from-[#00b995] to-[#1488d9] text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>KOP Sekolah &amp; Akun</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('database');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'database'
                ? 'bg-gradient-to-r from-[#00b995] to-[#1488d9] text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Database &amp; Backup</span>
          </button>
        </nav>

        {/* Nav Label: AKUN */}
        <div className="px-5 pt-4 pb-2 text-[10px] font-black tracking-wider text-blue-300/80 uppercase">
          Akun
        </div>

        <nav className="px-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActivePage('profil');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
              activePage === 'profil'
                ? 'bg-gradient-to-r from-[#00b995] to-[#1488d9] text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Profil Saya</span>
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

        {/* Sidebar Bottom Banner */}
        <div className="mt-auto p-4">
          <div className="bg-gradient-to-br from-[#214b82] to-[#17345e] border border-white/15 rounded-2xl p-4 text-white shadow-sm">
            <div className="text-2xl mb-1.5">🌟</div>
            <strong className="text-xs font-extrabold block">Bersama Membangun Generasi Hebat!</strong>
            <p className="text-[11px] text-blue-100/90 leading-relaxed mt-1">
              Pantau kebiasaan baik siswa dan dukung perkembangan karakter mereka setiap hari.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* ========================================================
          MAIN VIEW
      ======================================================== */}
      <main className="flex-1 lg:ml-[255px] min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-18 bg-white/95 backdrop-blur-md border-b border-[#e2eaf5] flex items-center justify-between px-4 sm:px-8 gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              className="lg:hidden w-9 h-9 rounded-xl border border-[#e2eaf5] bg-white text-[#153568] flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-500 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-xs">
              🏫
            </div>

            <div className="min-w-0">
              <div className="font-extrabold text-xs sm:text-sm text-[#172c50] truncate">
                7 Kebiasaan Anak Indonesia Hebat
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#7c8da8] truncate">
                {kopConfig.namaSekolah || 'Nama Sekolah'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Database indicator (Google Apps Script) */}
            <button
              type="button"
              onClick={() => setIsDbModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all shadow-xs ${
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

            {/* User Chip */}
            <div className="flex items-center gap-2 sm:gap-2.5 pl-1 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-slate-800 text-base flex items-center justify-center font-bold">
                👨🏻‍💼
              </div>
              <div className="hidden sm:block text-left">
                <strong className="block text-xs font-extrabold text-slate-900 leading-tight">
                  {kopConfig.usernameKepsek || session.nama || 'Admin Sekolah'}
                </strong>
                <span className="block text-[10px] text-slate-500 font-medium">Kepala Sekolah</span>
              </div>
            </div>


          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-8">
          {/* Hero Banner */}
          <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white bg-gradient-to-r from-[#ed8500] via-[#008b70] to-[#4330c8] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[#fff2bd] text-[11px] font-black">
                <Award className="w-3.5 h-3.5" />
                Ruang Komandan Sekolah • Kepemimpinan Karakter
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                {pageTitles[activePage]}
              </h1>
              <p className="text-xs sm:text-sm text-slate-100 max-w-2xl leading-relaxed">
                Pantau ketercapaian 7 Kebiasaan Anak Indonesia Hebat di seluruh rombongan belajar secara komprehensif.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-blue-100 font-bold">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDateIndonesian(getTodayDateString())}
                </span>
                <span className="flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5" />
                  {kopConfig.namaSekolah || 'Nama Sekolah'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="relative z-10 px-5 py-3 rounded-2xl bg-white text-[#183764] hover:bg-slate-100 font-black text-xs shadow-md transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan Sekolah</span>
            </button>
          </section>

          {/* Quick Tabs */}
          <nav className="flex items-center gap-1.5 border-b border-[#e2eaf5] overflow-x-auto no-print scrollbar-none pb-0.5">
            {[
              { id: 'dashboard', label: 'Ringkasan Eksekutif', icon: Sparkles },
              { id: 'monitoring', label: 'Monitoring Seluruh Kelas', icon: Building2 },
              { id: 'guru', label: 'Manajemen Guru', icon: GraduationCap },
              { id: 'kop', label: 'KOP Sekolah & Akun', icon: Settings },
              { id: 'database', label: 'Integrasi Database & Backup', icon: Database }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activePage === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePage(tab.id as AdminPage)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-black border-b-2 whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'border-[#00aa7b] text-[#00996d] bg-white rounded-t-xl'
                      : 'border-transparent text-[#607492] hover:text-[#00996d]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ========================================================
              PAGE 1: RINGKASAN EKSEKUTIF (DASHBOARD)
          ======================================================== */}
          {activePage === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <article className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#e7f2ff] text-[#3484f5] flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#e5efff] text-[#2e68c1]">
                      Siswa
                    </span>
                  </div>
                  <div className="text-[11px] font-extrabold text-[#6d7f9c] mt-3">Total Siswa</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    {totalSiswaCount}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#8291a7] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-[#e2f9ee] text-[#009f70]">Aktif</span>
                    <span>Terdaftar di sekolah</span>
                  </div>
                </article>

                <article className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#f0eaff] text-[#8159ef] flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#e5efff] text-[#2e68c1]">
                      Guru
                    </span>
                  </div>
                  <div className="text-[11px] font-extrabold text-[#6d7f9c] mt-3">Total Guru</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    {guruList.length}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#8291a7] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-[#e2f9ee] text-[#009f70]">
                      {guruList.filter(g => (g.status || 'Aktif') === 'Aktif').length} akun
                    </span>
                    <span>Dalam daftar akun</span>
                  </div>
                </article>

                <article className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#e2faf0] text-[#00a979] flex items-center justify-center font-bold">
                      <School className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#dff9ed] text-[#008b63]">
                      Kelas
                    </span>
                  </div>
                  <div className="text-[11px] font-extrabold text-[#6d7f9c] mt-3">Total Kelas</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    {classesData.length}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#8291a7] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-[#e2f9ee] text-[#009f70]">Rombel</span>
                    <span>Tahun pelajaran aktif</span>
                  </div>
                </article>

                <article className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#fff0dd] text-[#f18c20] flex items-center justify-center font-bold">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#fff3c7] text-[#996600]">
                      Mapel
                    </span>
                  </div>
                  <div className="text-[11px] font-extrabold text-[#6d7f9c] mt-3">Mata Pelajaran</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    {DEFAULT_SUBJECTS.length}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#8291a7] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-[#e2f9ee] text-[#009f70]">Kurikulum</span>
                    <span>Mata pelajaran terdaftar</span>
                  </div>
                </article>
              </div>

              {/* 2-Column: Donut & Habits + Bar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Donut & Habit Progress list */}
                <article className="lg:col-span-5 p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <span className="text-[#009e8a]">●</span>
                        Ringkasan 7 Kebiasaan
                      </h3>
                      <p className="text-[11px] text-[#7c8da8] mt-0.5">Persentase penyelesaian seluruh siswa</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Visual Donut representation */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#edf2f8"
                            strokeWidth="12"
                            fill="transparent"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#00ac84"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * avgProgress) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-black text-slate-900">{avgProgress}%</span>
                          <span className="text-[9px] font-bold text-[#7c8da8] leading-tight">
                            Rata-rata<br />Penyelesaian
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Habit list rows */}
                    <div className="sm:col-span-7 space-y-2">
                      {habitPerformance.map((h, i) => (
                        <div key={h.name} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-5 h-5 rounded-full text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: h.color }}
                          >
                            {i + 1}
                          </span>
                          <span className="font-extrabold text-[11px] text-slate-700 truncate min-w-[85px] flex-1">
                            {h.name}
                          </span>
                          <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${h.value}%`, backgroundColor: h.color }}
                            />
                          </div>
                          <span className="text-[11px] font-black text-[#60738f] w-8 text-right shrink-0">
                            {h.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                {/* Bar Chart: Grafik Perkembangan */}
                <article className="lg:col-span-7 p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#009e8a]" />
                        Grafik Perkembangan
                      </h3>
                      <p className="text-[11px] text-[#7c8da8] mt-0.5">Capaian masing-masing kebiasaan</p>
                    </div>

                    <select
                      value={chartRange}
                      onChange={e => setChartRange(e.target.value as 'week' | 'month')}
                      className="px-3 py-1.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-extrabold text-slate-700 focus:outline-none"
                    >
                      <option value="week">7 Hari Terakhir</option>
                      <option value="month">30 Hari Terakhir</option>
                    </select>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="h-56 w-full flex items-end gap-3 pt-4 px-2">
                    {habitPerformance.map(h => (
                      <div key={h.name} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-black text-slate-600 opacity-90 group-hover:scale-110 transition-transform">
                          {h.value}%
                        </span>
                        <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden">
                          <div
                            className="w-full rounded-t-xl transition-all duration-500 hover:brightness-110"
                            style={{ height: `${h.value}%`, backgroundColor: h.color }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center" title={h.name}>
                          {h.name.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              {/* Panel Guru Table on Dashboard */}
              <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#009e8a]" />
                      Daftar Akun Dewan Guru &amp; Pengampu
                    </h3>
                    <p className="text-[11px] text-[#7c8da8] mt-0.5">Kelola akun guru dan pantau status akun</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddTeacher}
                    className="px-4 py-2 rounded-xl bg-[#00a777] hover:bg-[#008f66] text-white font-black text-xs transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Guru</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#f7f9fc] border border-[#e2eaf5] rounded-xl flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={e => setTeacherSearch(e.target.value)}
                      placeholder="Cari nama atau username..."
                      className="bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none w-full"
                    />
                  </div>

                  <select
                    value={teacherFilter}
                    onChange={e => setTeacherFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-[#e2eaf5] bg-white text-xs font-extrabold text-slate-700 focus:outline-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleExportTeachersCSV}
                    className="px-3.5 py-2 rounded-xl bg-[#edf4ff] hover:bg-blue-100 text-[#28558f] font-black text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Ekspor CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#f0f4fa] text-[#536984] font-black">
                        <th className="py-3 px-3 rounded-l-xl">Username</th>
                        <th className="py-3 px-3">Nama Lengkap</th>
                        <th className="py-3 px-3">Kelas Diampu</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right rounded-r-xl">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f7] font-semibold text-slate-800">
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Tidak ada akun guru yang cocok dengan pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredTeachers.map(t => {
                          const isLocked = t.kelas.toLowerCase() === 'kepsek';
                          const status = t.status || 'Aktif';
                          return (
                            <tr key={t.username} className="hover:bg-[#f8fbff] transition-colors">
                              <td className="py-3 px-3">
                                {isLocked && <span className="mr-1 text-[11px]">🔒</span>}
                                <strong>{t.username}</strong>
                              </td>
                              <td className="py-3 px-3">
                                <span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-[#e9f3ff] text-base mr-2 align-middle">
                                  👩🏻‍🏫
                                </span>
                                <strong>{t.nama}</strong>
                              </td>
                              <td className="py-3 px-3 font-medium text-slate-600">{t.kelas}</td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                    status === 'Aktif'
                                      ? 'bg-[#dff9ed] text-[#008b63]'
                                      : 'bg-[#ffebeb] text-[#be4343]'
                                  }`}
                                >
                                  {status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditTeacher(t)}
                                    className="w-7 h-7 rounded-lg border border-[#e2eaf5] bg-[#f1f5fb] hover:bg-white text-slate-600 flex items-center justify-center transition-colors"
                                    title="Edit data guru"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {!isLocked && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleTeacherStatus(t)}
                                        className="w-7 h-7 rounded-lg border border-[#e2eaf5] bg-[#f1f5fb] hover:bg-white text-slate-600 flex items-center justify-center transition-colors"
                                        title="Ubah status Aktif / Nonaktif"
                                      >
                                        <Power className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTeacher(t)}
                                        className="w-7 h-7 rounded-lg border border-[#e2eaf5] bg-[#fff0f0] hover:bg-rose-100 text-[#cf4545] flex items-center justify-center transition-colors"
                                        title="Hapus akun guru"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          )}

          {/* ========================================================
              PAGE 2: MONITORING SELURUH KELAS
          ======================================================== */}
          {activePage === 'monitoring' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Monitoring Seluruh Kelas</h2>
                  <p className="text-xs text-[#7c8da8]">
                    Pantau ketercapaian kebiasaan baik berdasarkan rombongan belajar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-[#edf4ff] hover:bg-blue-100 text-[#28558f] font-black text-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak</span>
                </button>
              </div>

              {/* 4 Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <article className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#e2faf0] text-[#00a979] flex items-center justify-center font-bold mb-3">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-extrabold text-[#6d7f9c]">Rata-rata Capaian</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{monitorAverage}</div>
                </article>

                <article className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#e7f2ff] text-[#3484f5] flex items-center justify-center font-bold mb-3">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-extrabold text-[#6d7f9c]">Kelas Dipantau</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{dynamicClasses.length}</div>
                </article>

                <article className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#fff0dd] text-[#f18c20] flex items-center justify-center font-bold mb-3">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-extrabold text-[#6d7f9c]">Perlu Pemantauan</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{monitorAttention}</div>
                </article>

                <article className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#f0eaff] text-[#8159ef] flex items-center justify-center font-bold mb-3">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-extrabold text-[#6d7f9c]">Kebiasaan Terbaik</div>
                  <div className="text-xl font-black text-slate-900 mt-2 truncate">
                    {adminAnalytics.mostConsistentHabit ? adminAnalytics.mostConsistentHabit.shortTitle : 'Belum Ada Data'}
                  </div>
                </article>
              </div>

              {/* Rekapitulasi per Kelas */}
              <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <School className="w-4 h-4 text-[#009e8a]" />
                      Rekapitulasi Per Kelas
                    </h3>
                    <p className="text-[11px] text-[#7c8da8] mt-0.5">Pilih kelas untuk melihat capaian kebiasaan.</p>
                  </div>

                  <select
                    value={selectedKelasFilter}
                    onChange={e => setSelectedKelasFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-extrabold text-slate-700 focus:outline-none"
                  >
                    <option value="all">Semua Kelas</option>
                    {classesData.map(c => (
                      <option key={c.name} value={c.name}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#f0f4fa] text-[#536984] font-black">
                        <th className="py-3 px-3 rounded-l-xl">Kelas</th>
                        <th className="py-3 px-3">Jumlah Siswa</th>
                        <th className="py-3 px-3">Rata-rata Capaian</th>
                        <th className="py-3 px-3">Progres</th>
                        <th className="py-3 px-3 text-right rounded-r-xl">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f7] font-semibold text-slate-800">
                      {filteredClasses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            Belum ada data kelas atau siswa terdaftar.
                          </td>
                        </tr>
                      ) : (
                        filteredClasses.map(c => {
                        const isGood = c.value >= 70;
                        return (
                          <tr key={c.name} className="hover:bg-[#f8fbff] transition-colors">
                            <td className="py-3 px-3 font-black text-slate-900">Kelas {c.name}</td>
                            <td className="py-3 px-3 font-medium text-slate-600">{c.students} siswa</td>
                            <td className="py-3 px-3">
                              <div className="w-28 bg-[#edf2f8] h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${c.value}%`,
                                    backgroundColor: isGood ? '#00a777' : '#ffad2d'
                                  }}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-3 font-black text-slate-900">{c.value}%</td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  isGood ? 'bg-[#dff9ed] text-[#008b63]' : 'bg-[#fff3c7] text-[#996600]'
                                }`}
                              >
                                {isGood ? 'Baik' : 'Perlu perhatian'}
                              </span>
                            </td>
                          </tr>
                        );
                      }))}
                    </tbody>
                  </table>
                </div>
              </article>

              {/* 2-Col: Chart & Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-[#009e8a]" />
                    Perbandingan Capaian Kelas
                  </h3>
                  <div className="h-56 w-full flex items-end gap-3 pt-4 px-2">
                    {classesData.map(c => (
                      <div key={c.name} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-black text-slate-600 group-hover:scale-110 transition-transform">
                          {c.value}%
                        </span>
                        <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden">
                          <div
                            className="w-full rounded-t-xl transition-all duration-500 hover:brightness-110"
                            style={{
                              height: `${c.value}%`,
                              backgroundColor: c.value >= 70 ? '#13b98a' : '#ffb13b'
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs flex flex-col justify-between space-y-3">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#009e8a]" />
                    Catatan Monitoring
                  </h3>
                  <div className="p-4 bg-[#e5faf1] rounded-2xl border border-emerald-200">
                    <strong className="text-xs font-black text-[#008d64] block">✓ Capaian terbaik</strong>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      Kelas dengan persentase tertinggi saat ini adalah Kelas <strong>{bestClass}</strong>. Pertahankan
                      semangat para siswa dan apresiasi wali kelasnya!
                    </p>
                  </div>
                  <div className="p-4 bg-[#fff5df] rounded-2xl border border-amber-200">
                    <strong className="text-xs font-black text-[#986600] block">! Perlu pendampingan</strong>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {classesData.filter(c => c.value < 65).map(c => `Kelas ${c.name}`).join(', ') ||
                        'Belum ada kelas di bawah target'}{' '}
                      perlu mendapatkan perhatian dan motivasi tambahan dalam pelaksanaan 7 Kebiasaan Anak Indonesia Hebat.
                    </p>
                  </div>
                </article>
              </div>

              {/* Detail Jurnal Siswa & Foto Bukti */}
              <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Jurnal Masuk Berdasarkan Tanggal</h3>
                    <p className="text-[11px] text-[#7c8da8]">
                      Klik tombol ceklis untuk melihat catatan dan foto bukti pelaksanaan misi
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#f7f9fc] border border-[#e2eaf5] px-3 py-1.5 rounded-xl text-xs font-bold">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="bg-transparent text-slate-800 focus:outline-none font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleExportRekapCSV}
                      className="px-3.5 py-2 rounded-xl bg-[#edf4ff] hover:bg-blue-100 text-[#28558f] font-black text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ekspor Jurnal</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#f0f4fa] text-[#536984] font-black">
                        <th className="py-3 px-3 rounded-l-xl">No</th>
                        <th className="py-3 px-3">Nama Siswa</th>
                        <th className="py-3 px-3">Kelas</th>
                        <th className="py-3 px-2 text-center" title="Misi 1: Bangun Pagi">H1: Bangun</th>
                        <th className="py-3 px-2 text-center" title="Misi 2: Beribadah">H2: Ibadah</th>
                        <th className="py-3 px-2 text-center" title="Misi 3: Berolahraga">H3: Olahraga</th>
                        <th className="py-3 px-2 text-center" title="Misi 4: Gemar Belajar">H4: Belajar</th>
                        <th className="py-3 px-2 text-center" title="Misi 5: Makan Sehat">H5: Makan</th>
                        <th className="py-3 px-2 text-center" title="Misi 6: Membantu Sesama">H6: Bantu</th>
                        <th className="py-3 px-2 text-center" title="Misi 7: Tidur Cepat">H7: Tidur</th>
                        <th className="py-3 px-3 text-center rounded-r-xl">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f7] font-semibold text-slate-800">
                      {rekapList.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-slate-400">
                            Belum ada laporan jurnal masuk untuk tanggal {formatDateIndonesian(selectedDate)}.
                          </td>
                        </tr>
                      ) : (
                        rekapList.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#f8fbff] transition-colors">
                            <td className="py-3 px-3 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-3 px-3 font-black text-slate-900">{row.nama}</td>
                            <td className="py-3 px-3 text-slate-600 font-bold">{row.kelas}</td>
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
                                          title: `Misi #${hIndex + 1} - ${row.nama} (${row.kelas})`,
                                          subtitle: `Catatan: ${hData.detail}`
                                        });
                                      } else {
                                        showToast(`Catatan Misi #${hIndex + 1}: ${hData.detail}`);
                                      }
                                    }}
                                    className="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                                    title={`Catatan: ${hData.detail}${hData.url ? ' (Klik lihat foto)' : ''}`}
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    {hData.url && <Eye className="w-2.5 h-2.5 ml-0.5 text-emerald-800" />}
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 text-slate-300">
                                    <XCircle className="w-4 h-4 text-slate-300" />
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteMonitoringJurnal(row)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white text-[11px] font-black transition-colors inline-flex items-center gap-1 shadow-xs"
                                title="Hapus permanen laporan jurnal siswa ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          )}

          {/* ========================================================
              PAGE 3: MANAJEMEN GURU
          ======================================================== */}
          {activePage === 'guru' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Manajemen Dewan Guru</h2>
                  <p className="text-xs text-[#7c8da8]">Kelola akun dewan guru dan pengampu kelas.</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedGuruUsernames.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelectedTeachers}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus ({selectedGuruUsernames.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenAddTeacher}
                    className="px-4 py-2 rounded-xl bg-[#00a777] hover:bg-[#008f66] text-white font-black text-xs transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Guru</span>
                  </button>
                </div>
              </div>

              <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#f7f9fc] border border-[#e2eaf5] rounded-xl flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={e => setTeacherSearch(e.target.value)}
                      placeholder="Cari nama atau username..."
                      className="bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none w-full"
                    />
                  </div>

                  <select
                    value={teacherFilter}
                    onChange={e => setTeacherFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-[#e2eaf5] bg-white text-xs font-extrabold text-slate-700 focus:outline-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleExportTeachersCSV}
                    className="px-3.5 py-2 rounded-xl bg-[#edf4ff] hover:bg-blue-100 text-[#28558f] font-black text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Ekspor CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#f0f4fa] text-[#536984] font-black">
                        <th className="py-3 px-3 rounded-l-xl w-8">
                          <input
                            type="checkbox"
                            checked={
                              selectedGuruUsernames.length > 0 &&
                              selectedGuruUsernames.length ===
                                guruList.filter(g => g.kelas.toLowerCase() !== 'kepsek').length
                            }
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedGuruUsernames(
                                  guruList
                                    .filter(g => g.kelas.toLowerCase() !== 'kepsek')
                                    .map(g => g.username)
                                );
                              } else {
                                setSelectedGuruUsernames([]);
                              }
                            }}
                            className="rounded text-emerald-600"
                          />
                        </th>
                        <th className="py-3 px-3">Username / NIP</th>
                        <th className="py-3 px-3">Nama Lengkap</th>
                        <th className="py-3 px-3">Kelas Diampu</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right rounded-r-xl">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f7] font-semibold text-slate-800">
                      {filteredTeachers.map(t => {
                        const isLocked = t.kelas.toLowerCase() === 'kepsek';
                        const status = t.status || 'Aktif';
                        return (
                          <tr key={t.username} className="hover:bg-[#f8fbff] transition-colors">
                            <td className="py-3 px-3">
                              {!isLocked ? (
                                <input
                                  type="checkbox"
                                  checked={selectedGuruUsernames.includes(t.username)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedGuruUsernames([...selectedGuruUsernames, t.username]);
                                    } else {
                                      setSelectedGuruUsernames(
                                        selectedGuruUsernames.filter(u => u !== t.username)
                                      );
                                    }
                                  }}
                                  className="rounded text-emerald-600"
                                />
                              ) : (
                                <span className="text-[11px] text-slate-300 font-bold">🔒</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {isLocked && <span className="mr-1 text-[11px]">🔒</span>}
                              <strong>{t.username}</strong>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-[#e9f3ff] text-base mr-2 align-middle">
                                👩🏻‍🏫
                              </span>
                              <strong>{t.nama}</strong>
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-600">{t.kelas}</td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  status === 'Aktif'
                                    ? 'bg-[#dff9ed] text-[#008b63]'
                                    : 'bg-[#ffebeb] text-[#be4343]'
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTeacher(t)}
                                  className="w-7 h-7 rounded-lg border border-[#e2eaf5] bg-[#f1f5fb] hover:bg-white text-slate-600 flex items-center justify-center transition-colors"
                                  title="Edit data guru"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {!isLocked && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTeacherStatus(t)}
                                      className="w-7 h-7 rounded-lg border border-[#e2eaf5] bg-[#f1f5fb] hover:bg-white text-slate-600 flex items-center justify-center transition-colors"
                                      title="Ubah status Aktif / Nonaktif"
                                    >
                                      <Power className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTeacher(t)}
                                      className="w-7 h-7 rounded-lg border border-[#e2eaf5] bg-[#fff0f0] hover:bg-rose-100 text-[#cf4545] flex items-center justify-center transition-colors"
                                      title="Hapus akun guru"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          )}

          {/* ========================================================
              PAGE 4: MANAJEMEN SISWA
          ======================================================== */}
          {activePage === 'siswa' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Manajemen Siswa</h2>
                  <p className="text-xs text-[#7c8da8]">Ringkasan siswa menurut rombongan belajar sekolah.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <article className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#e7f2ff] text-[#3484f5] flex items-center justify-center font-bold mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-extrabold text-[#6d7f9c]">Total Siswa Terdaftar</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{totalSiswaCount}</div>
                </article>

                <article className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#e2faf0] text-[#00a979] flex items-center justify-center font-bold mb-3">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-extrabold text-[#6d7f9c]">Kelas Aktif</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{classesData.length}</div>
                </article>
              </div>

              <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#009e8a]" />
                    Daftar Siswa Sekolah
                  </h3>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f7f9fc] border border-[#e2eaf5] rounded-xl text-xs font-bold">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={siswaSearch}
                        onChange={e => setSiswaSearch(e.target.value)}
                        placeholder="Cari NISN / Nama..."
                        className="bg-transparent focus:outline-none"
                      />
                    </div>

                    <select
                      value={siswaKelasFilter}
                      onChange={e => setSiswaKelasFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Semua Kelas</option>
                      {classesData.map(c => (
                        <option key={c.name} value={c.name}>
                          Kelas {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#f0f4fa] text-[#536984] font-black">
                        <th className="py-3 px-3 rounded-l-xl">No</th>
                        <th className="py-3 px-3">NISN</th>
                        <th className="py-3 px-3">Nama Lengkap</th>
                        <th className="py-3 px-3">Panggilan</th>
                        <th className="py-3 px-3">Kelas</th>
                        <th className="py-3 px-3">Tahun Ajaran</th>
                        <th className="py-3 px-3 text-center rounded-r-xl">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f7] font-semibold text-slate-800">
                      {filteredSiswa.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Tidak ada data siswa yang cocok.
                          </td>
                        </tr>
                      ) : (
                        filteredSiswa.map((s, idx) => (
                          <tr key={s.id || s.nisn} className="hover:bg-[#f8fbff] transition-colors">
                            <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">{s.nisn}</td>
                            <td className="py-3 px-3 font-black text-slate-900">{s.nama}</td>
                            <td className="py-3 px-3 text-slate-600">{s.panggilan || '-'}</td>
                            <td className="py-3 px-3 font-bold text-emerald-700">{s.kelas}</td>
                            <td className="py-3 px-3 text-slate-500">{s.tahunAjaran || '2026/2027'}</td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteSiswa(s)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white text-[11px] font-black transition-colors inline-flex items-center gap-1 shadow-xs"
                                title="Hapus permanen agen siswa ini dari database"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          )}

          {/* ========================================================
              PAGE 5: KELAS & ROMBEL
          ======================================================== */}
          {activePage === 'kelas' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Kelas &amp; Rombongan Belajar</h2>
                  <p className="text-xs text-[#7c8da8]">Ringkasan rombongan belajar dan guru pengampu sekolah.</p>
                </div>
              </div>

              <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#f0f4fa] text-[#536984] font-black">
                        <th className="py-3 px-3 rounded-l-xl">Nama Kelas</th>
                        <th className="py-3 px-3">Jumlah Siswa</th>
                        <th className="py-3 px-3">Guru Pengampu</th>
                        <th className="py-3 px-3 text-right rounded-r-xl">Capaian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f7] font-semibold text-slate-800">
                      {classesData.map(c => (
                        <tr key={c.name} className="hover:bg-[#f8fbff] transition-colors">
                          <td className="py-3.5 px-3 font-black text-slate-900">Kelas {c.name}</td>
                          <td className="py-3.5 px-3 text-slate-600 font-bold">{c.students} siswa</td>
                          <td className="py-3.5 px-3 text-slate-800">{c.teacher}</td>
                          <td className="py-3.5 px-3 text-right font-black text-emerald-600">{c.value}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          )}

          {/* ========================================================
              PAGE 6: MATA PELAJARAN
          ======================================================== */}
          {activePage === 'mapel' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Mata Pelajaran</h2>
                  <p className="text-xs text-[#7c8da8]">Ringkasan mata pelajaran yang terintegrasi dengan pembiasaan karakter.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {DEFAULT_SUBJECTS.map(s => {
                  const Icon = s.icon;
                  return (
                    <article
                      key={s.title}
                      className="p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow"
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: s.bg, color: s.color }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-xs sm:text-sm text-slate-900 truncate">{s.title}</h3>
                        <p className="text-[11px] text-[#7c8da8] mt-0.5">Kurikulum Nasional SD</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              PAGE 7: LAPORAN & STATISTIK
          ======================================================== */}
          {activePage === 'laporan' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header with Period & Class Filter */}
              <section className="p-5 sm:p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        Laporan &amp; Analisis Statistik Karakter Sekolah
                      </h2>
                      <p className="text-[11px] sm:text-xs text-[#7c8da8]">
                        Data riil 7 kebiasaan siswa • {adminAnalytics.periodLabel} • {selectedKelasFilter === 'all' ? 'Seluruh Kelas' : `Kelas ${selectedKelasFilter}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Class Filter */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f8fc] border border-[#dce6f2] rounded-xl text-xs font-bold text-[#1a3860]">
                      <School className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={selectedKelasFilter}
                        onChange={e => setSelectedKelasFilter(e.target.value)}
                        className="bg-transparent focus:outline-none cursor-pointer"
                      >
                        <option value="all">Semua Kelas</option>
                        {dynamicClasses.map(c => (
                          <option key={c.name} value={c.name}>
                            Kelas {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportRekapCSV}
                      className="px-3.5 py-1.5 rounded-xl bg-[#edf4ff] hover:bg-blue-100 text-[#28558f] font-black text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ekspor CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-white font-black text-xs hover:bg-slate-900 transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
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
                        onClick={() => setReportPeriod(opt.id as PeriodFilter)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                          reportPeriod === opt.id
                            ? 'bg-[#00aa7b] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Pickers */}
                  {reportPeriod === 'rentang' && (
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
                <article className="p-4 sm:p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Total Laporan</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                    {adminAnalytics.totalReports}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
                    Misi tuntas di periode ini
                  </p>
                </article>

                <article className="p-4 sm:p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Laporan Hari Ini</span>
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums">
                    {adminAnalytics.completedTodayCount}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
                    {adminAnalytics.todayCompletionRate}% capaian hari ini
                  </p>
                </article>

                <article className="p-4 sm:p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Capaian Periode</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-sky-600 tabular-nums">
                    {adminAnalytics.periodCompletionRate}%
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
                    {adminAnalytics.activeDaysCount} dari {adminAnalytics.totalDays} hari aktif
                  </p>
                </article>

                <article className="p-4 sm:p-5 rounded-2xl border border-[#e2eaf5] bg-white shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Tren &amp; Terkuat</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl sm:text-2xl font-black text-amber-500 tabular-nums truncate">
                      {adminAnalytics.mostConsistentHabit ? adminAnalytics.mostConsistentHabit.shortTitle : 'Belum Ada'}
                    </div>
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      adminAnalytics.trendDeltaPercent >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {adminAnalytics.trendDeltaPercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(adminAnalytics.trendDeltaPercent)}%
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
                    Dibanding periode sebelumnya
                  </p>
                </article>
              </section>

              {/* Charts Section */}
              {!adminAnalytics.hasData ? (
                <article className="p-8 sm:p-12 rounded-3xl border border-[#e2eaf5] bg-white text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Belum Ada Catatan Jurnal di Periode Ini
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tidak ada laporan misi 7 kebiasaan yang ditemukan pada rentang <strong>{adminAnalytics.periodLabel}</strong>.
                    </p>
                  </div>
                </article>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* CHART A: Penyelesaian 7 Kebiasaan */}
                  <article className="p-5 sm:p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#009e8a]" />
                          <span>A. Capaian 7 Kebiasaan Anak Indonesia Hebat</span>
                        </h3>
                        <p className="text-[11px] text-[#7c8da8] mt-0.5">
                          Persentase penyelesaian laporan per kebiasaan
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {adminAnalytics.totalDays} Hari
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {adminAnalytics.habitsSummary.map(habit => {
                        const isSelected = selectedHabitDetailId === habit.habitId;
                        return (
                          <div
                            key={habit.habitId}
                            onClick={() => setSelectedHabitDetailId(isSelected ? null : habit.habitId)}
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
                                <span>Total terisi: {habit.completedCount} kali</span>
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

                  {/* CHART B: Tren Aktivitas Harian */}
                  <article className="p-5 sm:p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[#009e8a]" />
                            <span>B. Tren Aktivitas Harian Sekolah</span>
                          </h3>
                          <p className="text-[11px] text-[#7c8da8] mt-0.5">
                            Jumlah jurnal yang tercatat setiap hari (Data Riil Database)
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 shrink-0">
                          {adminAnalytics.activeDaysCount} Hari Aktif
                        </span>
                      </div>

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
                          const maxVal = Math.max(1, ...adminAnalytics.dailyTrend.map(d => d.completedCount), 7);

                          const pts = adminAnalytics.dailyTrend.map((item, idx) => {
                            const x = adminAnalytics.dailyTrend.length > 1
                              ? padL + (idx / (adminAnalytics.dailyTrend.length - 1)) * gW
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
                                <linearGradient id="kepsekAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>

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

                              {aPath && <path d={aPath} fill="url(#kepsekAreaGrad)" />}
                              {lPath && (
                                <path
                                  d={lPath}
                                  fill="none"
                                  stroke="#059669"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              )}

                              {pts.map((pt, idx) => {
                                const isSelected = selectedTrendPointIndex === idx;
                                const isZero = pt.item.completedCount === 0;
                                const showLabel = pts.length <= 7 || idx % Math.ceil(pts.length / 6) === 0 || idx === pts.length - 1;

                                return (
                                  <g
                                    key={idx}
                                    className="cursor-pointer"
                                    onClick={() => setSelectedTrendPointIndex(isSelected ? null : idx)}
                                  >
                                    <circle
                                      cx={pt.x}
                                      cy={pt.y}
                                      r={isSelected ? 6.5 : (isZero ? 3.5 : 4.5)}
                                      fill={isZero ? '#f1f5f9' : '#ffffff'}
                                      stroke={isZero ? '#94a3b8' : '#059669'}
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

                        {selectedTrendPointIndex !== null && adminAnalytics.dailyTrend[selectedTrendPointIndex] && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs space-y-1">
                            <div className="flex items-center justify-between font-extrabold text-[11px] text-emerald-300">
                              <span>{formatDateIndonesian(adminAnalytics.dailyTrend[selectedTrendPointIndex].date)}</span>
                              <span>{adminAnalytics.dailyTrend[selectedTrendPointIndex].completedCount} Laporan</span>
                            </div>
                            <div className="text-[10px] text-slate-300">
                              {adminAnalytics.dailyTrend[selectedTrendPointIndex].completedCount === 0
                                ? 'Tidak ada laporan jurnal pada hari ini.'
                                : `Misi tercatat: #${adminAnalytics.dailyTrend[selectedTrendPointIndex].habits.join(', #')}`}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-2 text-xs text-emerald-900">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        Data grafik ini dihitung secara dinamis dari database tanpa angka tiruan. Hari tanpa laporan tercatat sebagai <strong>0</strong>.
                      </div>
                    </div>
                  </article>
                </div>
              )}

              <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm mb-2">
                  <AlertCircle className="w-4 h-4 text-[#009e8a]" />
                  Informasi Data &amp; Integrasi
                </div>
                <p className="text-xs text-[#7c8da8] leading-relaxed">
                  Semua grafik dan rekapitulasi capaian terhubung langsung dengan Google Spreadsheet melalui Google Apps
                  Script Web App. Setiap kali siswa dan guru mengisi jurnal karakter, skor perkembangan dihitung otomatis
                  dan terakumulasi secara real-time.
                </p>
              </article>
            </div>
          )}

          {/* ========================================================
              PAGE 8: KOP SEKOLAH & AKUN
          ======================================================== */}
          {activePage === 'kop' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">KOP Sekolah &amp; Akun</h2>
                  <p className="text-xs text-[#7c8da8]">Informasi identitas sekolah, logo resmi, dan preferensi laporan.</p>
                </div>
              </div>

              <article className="p-6 sm:p-8 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-6">
                <form onSubmit={handleSaveKop} className="space-y-5 max-w-2xl">
                  {/* Nama Sekolah */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-[#e2eaf5]">
                    <div>
                      <strong className="block text-xs font-black text-slate-800">Nama Sekolah</strong>
                      <p className="text-[11px] text-[#7c8da8] mt-0.5">Identitas pada header dan laporan cetak.</p>
                    </div>
                    <input
                      type="text"
                      value={kopConfig.namaSekolah}
                      onChange={e => setKopConfig({ ...kopConfig, namaSekolah: e.target.value })}
                      className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* Nama / Username Kepala Sekolah */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-[#e2eaf5]">
                    <div>
                      <strong className="block text-xs font-black text-slate-800">Nama Kepala Sekolah</strong>
                      <p className="text-[11px] text-[#7c8da8] mt-0.5">Penanggung jawab laporan dan piagam.</p>
                    </div>
                    <input
                      type="text"
                      value={kopConfig.usernameKepsek}
                      onChange={e => setKopConfig({ ...kopConfig, usernameKepsek: e.target.value })}
                      className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* Kata Sandi Kepala Sekolah */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-[#e2eaf5]">
                    <div>
                      <strong className="block text-xs font-black text-slate-800">Kata Sandi Akun</strong>
                      <p className="text-[11px] text-[#7c8da8] mt-0.5">Kredensial login untuk akun Kepala Sekolah.</p>
                    </div>
                    <input
                      type="password"
                      value={kopConfig.passwordKepsek}
                      onChange={e => setKopConfig({ ...kopConfig, passwordKepsek: e.target.value })}
                      className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* Logo Sekolah */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-[#e2eaf5]">
                    <div>
                      <strong className="block text-xs font-black text-slate-800">Logo Resmi Sekolah</strong>
                      <p className="text-[11px] text-[#7c8da8] mt-0.5">Ditampilkan pada piagam dan header laporan.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl border border-[#e2eaf5] bg-slate-50 p-1 flex items-center justify-center overflow-hidden shrink-0">
                        {kopConfig.logoSekolah ? (
                          <img
                            src={kopConfig.logoSekolah.split(',')[0]}
                            alt="Logo Sekolah"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Tanpa Logo</span>
                        )}
                      </div>
                      <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors">
                        <span>Unggah Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Link YouTube Motivasi */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-[#e2eaf5]">
                    <div>
                      <strong className="block text-xs font-black text-slate-800">Video YouTube Utama</strong>
                      <p className="text-[11px] text-[#7c8da8] mt-0.5">Tautan video motivasi 7 Kebiasaan di Beranda.</p>
                    </div>
                    <input
                      type="url"
                      value={kopConfig.linkYoutube}
                      onChange={e => setKopConfig({ ...kopConfig, linkYoutube: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {kopSaveStatus && (
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{kopSaveStatus}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#00a777] hover:bg-[#008f66] text-white font-black text-xs transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Tampilan</span>
                    </button>
                  </div>
                </form>
              </article>
            </div>
          )}

          {/* ========================================================
              PAGE 9: INTEGRASI DATABASE & BACKUP
          ======================================================== */}
          {activePage === 'database' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Integrasi Database &amp; Backup</h2>
                  <p className="text-xs text-[#7c8da8]">
                    Konfigurasi sinkronisasi langsung dengan Google Spreadsheet menggunakan Google Apps Script Web App.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#e2faf0] text-[#00a979] flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Google Spreadsheet &amp; Apps Script</h3>
                    <p className="text-xs text-[#7c8da8] mt-1 leading-relaxed">
                      Sistem ini dirancang khusus untuk terhubung dengan Google Apps Script (`doPost`/`doGet`). Seluruh
                      data jurnal siswa, materi kuis dewan guru, dan profil sekolah tersimpan secara permanen di Google
                      Drive &amp; Spreadsheet Anda.
                    </p>
                  </div>

                  <div className="pt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                        isGasConnected
                          ? 'bg-[#dff9ed] text-[#008b63]'
                          : 'bg-[#fff3c7] text-[#996600]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isGasConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isGasConnected ? 'Terhubung ke Google Apps Script' : 'Belum Terhubung (Lokal Browser)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDbModalOpen(true)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#00a777] hover:bg-[#008f66] text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Konfigurasi Apps Script &amp; Spreadsheet</span>
                  </button>
                </article>

                <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#e7f2ff] text-[#3484f5] flex items-center justify-center font-bold">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Ekspor Laporan &amp; Data</h3>
                    <p className="text-xs text-[#7c8da8] mt-1 leading-relaxed">
                      Unduh salinan data lokal dalam format CSV untuk keperluan administrasi sekolah, pencetakan berkas,
                      dan arsip offline.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleExportTeachersCSV}
                      className="px-4 py-2 rounded-xl bg-[#edf4ff] hover:bg-blue-100 text-[#28558f] font-black text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Ekspor Data Guru (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportRekapCSV}
                      className="px-4 py-2 rounded-xl bg-[#edf4ff] hover:bg-blue-100 text-[#28558f] font-black text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Ekspor Laporan Jurnal (CSV)</span>
                    </button>
                  </div>
                </article>
              </div>

              <article className="p-6 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#009e8a]" />
                  Catatan Keamanan &amp; Integritas Data
                </div>
                <p className="text-xs text-[#7c8da8] leading-relaxed">
                  Konsep database tidak diubah: sistem tetap memprioritaskan integrasi penuh dengan Google Apps Script dan
                  Google Sheets. Token dan data aman di dalam Google Workspace sekolah Anda tanpa risiko kebocoran ke server
                  pihak ketiga.
                </p>
              </article>
            </div>
          )}

          {/* ========================================================
              PAGE 10: PROFIL ADMIN
          ======================================================== */}
          {activePage === 'profil' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Profil Admin</h2>
                  <p className="text-xs text-[#7c8da8]">Informasi akun komandan sekolah yang sedang aktif.</p>
                </div>
              </div>

              <article className="p-6 sm:p-8 rounded-3xl border border-[#e2eaf5] bg-white shadow-xs space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-slate-800 text-3xl flex items-center justify-center font-bold shrink-0">
                    👨🏻‍💼
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {kopConfig.usernameKepsek || session.nama || 'Admin Sekolah'}
                    </h3>
                    <div className="text-xs font-bold text-[#009e8a] mt-0.5">Kepala Sekolah (Komandan)</div>
                    <div className="text-[11px] text-[#7c8da8] mt-0.5">
                      {kopConfig.namaSekolah || 'Nama Sekolah'}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#f8fbff] rounded-2xl border border-[#e2eaf5] space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#edf1f7]">
                    <span className="text-[#6d7f9c] font-bold">Username Login:</span>
                    <strong className="text-slate-900 font-mono">{kopConfig.usernameKepsek || 'kepsek'}</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#edf1f7]">
                    <span className="text-[#6d7f9c] font-bold">Peran Otoritas:</span>
                    <strong className="text-slate-900">Kepala Sekolah (Akses Penuh Seluruh Kelas)</strong>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#6d7f9c] font-bold">Integrasi Database:</span>
                    <strong className="text-emerald-700">Google Apps Script Web App</strong>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActivePage('kop')}
                    className="px-5 py-2.5 rounded-xl bg-[#00a777] hover:bg-[#008f66] text-white font-black text-xs transition-all flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Ubah Kredensial di KOP</span>
                  </button>
                </div>
              </article>
            </div>
          )}

          {/* Footer */}
          <footer className="text-center pt-8 pb-4 text-[11px] text-[#93a0b5] font-semibold no-print">
            © {new Date().getFullYear()} 7 Kebiasaan Anak Indonesia Hebat • Dashboard Monitoring Sekolah
          </footer>
        </div>
      </main>

      {/* ========================================================
          MODAL: TAMBAH / EDIT GURU
      ======================================================== */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d234c]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e2eaf5] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2eaf5]">
              <h3 className="font-black text-slate-900 text-base">
                {editingTeacherId ? 'Edit Akun Guru' : 'Tambah Akun Guru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                className="w-8 h-8 rounded-xl border border-[#e2eaf5] bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-[#506581] mb-1">
                  NIP / Username Guru *
                </label>
                <input
                  type="text"
                  value={teacherFormData.username}
                  onChange={e => setTeacherFormData({ ...teacherFormData, username: e.target.value })}
                  placeholder="Contoh: 1985001"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#506581] mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={teacherFormData.nama}
                  onChange={e => setTeacherFormData({ ...teacherFormData, nama: e.target.value })}
                  placeholder="Contoh: Ibu Siti Rahmah, S.Pd."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-[#506581] mb-1">
                    Kelas Diampu
                  </label>
                  <select
                    value={teacherFormData.kelas}
                    onChange={e => setTeacherFormData({ ...teacherFormData, kelas: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Kelas 1A">Kelas 1A</option>
                    <option value="Kelas 2A">Kelas 2A</option>
                    <option value="Kelas 3A">Kelas 3A</option>
                    <option value="Kelas 4A">Kelas 4A</option>
                    <option value="Kelas 4B">Kelas 4B</option>
                    <option value="Kelas 5A">Kelas 5A</option>
                    <option value="Kepsek">Kepsek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[#506581] mb-1">
                    Status
                  </label>
                  <select
                    value={teacherFormData.status}
                    onChange={e =>
                      setTeacherFormData({
                        ...teacherFormData,
                        status: e.target.value as 'Aktif' | 'Nonaktif'
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#506581] mb-1">
                  Kata Sandi Akun
                </label>
                <input
                  type="password"
                  value={teacherFormData.password}
                  onChange={e => setTeacherFormData({ ...teacherFormData, password: e.target.value })}
                  placeholder="Kata sandi login guru"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2eaf5] bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <p className="text-[10px] text-[#7c8da8] leading-relaxed pt-1">
                Data akan otomatis disimpan dan disinkronkan ke Google Spreadsheet melalui Google Apps Script Web App.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2eaf5]">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00a777] hover:bg-[#008f66] text-white font-black text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DATABASE CONFIG MODAL (Google Apps Script)
      ======================================================== */}
      {isDbModalOpen && (
        <DatabaseConfigModal
          isOpen={true}
          onClose={() => {
            setIsDbModalOpen(false);
            loadData();
            if (onRefresh) onRefresh();
          }}
          onDataChanged={() => {
            loadData();
            if (onRefresh) onRefresh();
          }}
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
          MOBILE BOTTOM NAVIGATION (HP ERGONOMICS, MIN 48PX TARGETS)
      ======================================================== */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2eaf5] shadow-lg px-2 py-1.5 lg:hidden no-print">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActivePage('dashboard')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePage === 'dashboard' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Ringkasan</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('laporan')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePage === 'laporan' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Grafik</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('monitoring')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePage === 'monitoring' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Kelas</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('guru')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePage === 'guru' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
            }`}
          >
            <GraduationCap className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Guru</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('kop')}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePage === 'kop' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Sekolah</span>
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
          className="fixed right-5 bottom-5 z-50 bg-[#173968] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-black animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <Sparkles className="w-4 h-4 text-[#ffbd24] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================
          MODAL: KONFIRMASI HAPUS DATA (GURU / SISWA / JURNAL)
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
          MODAL: KONFIRMASI KELUAR SESI KEPALA SEKOLAH
      ======================================================== */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        type="warning"
        title="Keluar dari Sesi Kepala Sekolah?"
        message={`Apakah Anda yakin ingin keluar dari akun pimpinan (${session.nama})?\nSeluruh data pemantauan dan konfigurasi tersimpan dengan aman.`}
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
