export type UserRole = 'Siswa' | 'Guru' | 'Kepala Sekolah';

export interface UserSession {
  role: UserRole;
  username: string;
  nama: string;
  kelas: string;
}

export interface PengaturanConfig {
  namaSekolah: string;
  logoSekolah: string;
  linkYoutube: string;
  usernameKepsek: string;
  passwordKepsek: string;
}

export interface SiswaRecord {
  id: string;
  nisn: string;
  nama: string;
  panggilan: string;
  kelas: string;
  tahunAjaran: string;
  password?: string;
}

export interface GuruRecord {
  id: string;
  username: string;
  nama: string;
  kelas: string;
  password?: string;
  linkYoutube?: string;
  kontenKuisJson?: string;
  tempatCetak?: string;
  tanggalCetak?: string;
  status?: 'Aktif' | 'Nonaktif';
}

export interface HabitItemData {
  id: string;
  tanggal: string; // YYYY-MM-DD
  waktuSubmit: string; // HH:mm:ss
  username: string;
  namaSiswa: string;
  kelas: string;
  detail: string; // Jam Bangun for Habit 1, or Catatan for Habit 2-7
  fotoBukti: string; // URL or Base64
}

export interface HabitMateri {
  materiTeks: string;
  linkYt: string;
  kuisAktif: boolean;
  pertanyaan: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  jawaban: 'A' | 'B' | 'C' | string;
}

export interface DailySummaryRow {
  tanggal: string;
  nama: string;
  kelas: string;
  username?: string;
  h1: { detail: string; url: string } | null;
  h2: { detail: string; url: string } | null;
  h3: { detail: string; url: string } | null;
  h4: { detail: string; url: string } | null;
  h5: { detail: string; url: string } | null;
  h6: { detail: string; url: string } | null;
  h7: { detail: string; url: string } | null;
}

export interface DashboardStats {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
  h7: number;
}

export interface HabitDefinition {
  id: number;
  number: number;
  title: string;
  shortTitle: string;
  quote: string;
  description: string;
  actionPrompt: string;
  inputPlaceholder: string;
  iconName: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  badgeText: string;
  examples: string[];
}

export type SiswaMenuTab = 'beranda' | 'misi' | 'grafik' | 'riwayat' | 'piagam' | 'profil' | 'pengaturan';

export type PeriodFilter = 'hari_ini' | '7hari' | 'bulan_ini' | 'bulan_lalu' | 'rentang';

export interface HabitStatItem {
  habitId: number;
  number: number;
  title: string;
  shortTitle: string;
  colorHex: string;
  iconName: string;
  completedCount: number;
  totalOpportunity: number;
  percentage: number;
}

export interface DynamicAnalyticsResult {
  period: PeriodFilter;
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalReports: number;
  completedTodayCount: number;
  todayCompletionRate: number;
  periodCompletionRate: number;
  activeDaysCount: number;
  currentStreak: number;
  mostConsistentHabit: {
    habitId: number;
    title: string;
    shortTitle: string;
    completedCount: number;
    percentage: number;
    colorHex: string;
  } | null;
  previousPeriodReports: number;
  trendDeltaPercent: number;
  habitsSummary: HabitStatItem[];
  dailyTrend: Array<{
    date: string;
    label: string;
    dayName: string;
    completedCount: number;
    maxCount: number;
    habits: number[];
  }>;
  hasData: boolean;
}

export interface SiswaAnalyticsData {
  totalCompleted: number;
  activeDays: number;
  successRate: number;
  currentStreak: number;
  trendDelta: number;
  habitCounts: Record<number, number>;
  dailyTrend: Array<{ date: string; label: string; count: number }>;
}
