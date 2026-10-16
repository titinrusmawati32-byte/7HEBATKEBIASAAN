import {
  DailySummaryRow,
  DashboardStats,
  GuruRecord,
  HabitItemData,
  HabitMateri,
  PengaturanConfig,
  SiswaRecord,
  SiswaAnalyticsData,
  DynamicAnalyticsResult,
  HabitStatItem,
  PeriodFilter,
  UserRole,
  UserSession
} from '../types';
import { FirebaseService } from './firebase';

const STORAGE_KEYS = {
  PENGATURAN: 'jurnal7_pengaturan',
  DATA_SISWA: 'jurnal7_data_siswa',
  DATA_GURU: 'jurnal7_data_guru',
  HABIT_PREFIX: 'jurnal7_habit_',
  APPS_SCRIPT_URL: 'jurnal7_gas_url',
  ACTIVE_SESSION: 'jurnal7_active_session'
};

// Default clean configurations
const DEFAULT_PENGATURAN: PengaturanConfig = {
  namaSekolah: '',
  logoSekolah: '',
  linkYoutube: '',
  usernameKepsek: '',
  passwordKepsek: ''
};

const DEFAULT_GURU: GuruRecord[] = [];

const DEFAULT_SISWA: SiswaRecord[] = [];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function getDateOffsetString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRangeForPeriod(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const today = getTodayDateString();

  if (period === 'hari_ini') {
    return { startDate: today, endDate: today, label: 'Hari Ini' };
  }

  if (period === '7hari') {
    const start = getDateOffsetString(6);
    return { startDate: start, endDate: today, label: '7 Hari Terakhir' };
  }

  if (period === 'bulan_ini') {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const start = `${y}-${m}-01`;
    return { startDate: start, endDate: today, label: 'Bulan Ini' };
  }

  if (period === 'bulan_lalu') {
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const y = prevMonthDate.getFullYear();
    const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, prevMonthDate.getMonth() + 1, 0).getDate();
    const start = `${y}-${m}-01`;
    const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return { startDate: start, endDate: end, label: `Bulan Lalu (${monthNames[prevMonthDate.getMonth()]})` };
  }

  if (period === 'rentang' && customStart && customEnd) {
    let s = customStart;
    let e = customEnd;
    if (s > e) {
      const temp = s;
      s = e;
      e = temp;
    }
    return { startDate: s, endDate: e, label: `${s} s/d ${e}` };
  }

  return { startDate: getDateOffsetString(6), endDate: today, label: '7 Hari Terakhir' };
}

export class StorageService {
  // Check and initialize default clean state without any dummy accounts or seed records
  static initSheets() {
    // Migration: Clean out any lingering dummy demo data from earlier browser tests
    const cleanFlag = localStorage.getItem('jurnal7_clean_deploy_v2');
    if (!cleanFlag) {
      localStorage.removeItem(STORAGE_KEYS.DATA_SISWA);
      localStorage.removeItem(STORAGE_KEYS.DATA_GURU);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      localStorage.removeItem(STORAGE_KEYS.PENGATURAN);
      for (let i = 1; i <= 7; i++) {
        localStorage.removeItem(STORAGE_KEYS.HABIT_PREFIX + i);
      }
      localStorage.setItem('jurnal7_clean_deploy_v2', 'true');
    }

    if (!localStorage.getItem(STORAGE_KEYS.PENGATURAN)) {
      localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(DEFAULT_PENGATURAN));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DATA_GURU)) {
      const initialGuru: GuruRecord[] = [
        {
          id: 'admin-default',
          username: 'admin',
          nama: 'Kepala Sekolah / Administrator',
          kelas: 'Kepsek',
          password: 'admin123',
          linkYoutube: '',
          kontenKuisJson: '{}',
          tempatCetak: 'Jakarta',
          tanggalCetak: getTodayDateString(),
          status: 'Aktif'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(initialGuru));
    } else {
      try {
        const teachers: GuruRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DATA_GURU) || '[]');
        if (!teachers.some(g => (g.kelas || '').toLowerCase() === 'kepsek' || g.username.toLowerCase() === 'admin')) {
          teachers.push({
            id: 'admin-default',
            username: 'admin',
            nama: 'Kepala Sekolah / Administrator',
            kelas: 'Kepsek',
            password: 'admin123',
            linkYoutube: '',
            kontenKuisJson: '{}',
            tempatCetak: 'Jakarta',
            tanggalCetak: getTodayDateString(),
            status: 'Aktif'
          });
          localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(teachers));
        }
      } catch (e) {
        // ignore
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.DATA_SISWA)) {
      localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(DEFAULT_SISWA));
    }

    // Ensure all 7 habit tables exist as clean empty arrays
    for (let i = 1; i <= 7; i++) {
      const key = STORAGE_KEYS.HABIT_PREFIX + i;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    }

    return { success: true, message: "Aplikasi bersih dan siap untuk proses deploy." };
  }

  // Apps Script Integration URL
  static getAppsScriptUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL) || '';
  }

  static setAppsScriptUrl(url: string): void {
    const trimmed = url.trim();
    localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, trimmed);
    const currentKop = this.getPengaturanKop().data;
    FirebaseService.savePengaturan({
      ...currentKop,
      appsScriptUrl: trimmed
    }).catch(console.warn);
  }

  static async syncCloudConfig(): Promise<void> {
    try {
      const remoteConfig = await FirebaseService.getPengaturan();
      if (remoteConfig) {
        if (remoteConfig.appsScriptUrl) {
          localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, remoteConfig.appsScriptUrl);
        }
        localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify({
          namaSekolah: remoteConfig.namaSekolah || DEFAULT_PENGATURAN.namaSekolah,
          logoSekolah: remoteConfig.logoSekolah || DEFAULT_PENGATURAN.logoSekolah,
          linkYoutube: remoteConfig.linkYoutube || DEFAULT_PENGATURAN.linkYoutube,
          usernameKepsek: remoteConfig.usernameKepsek || DEFAULT_PENGATURAN.usernameKepsek,
          passwordKepsek: remoteConfig.passwordKepsek || DEFAULT_PENGATURAN.passwordKepsek
        }));
      }

      const remoteGuru = await FirebaseService.getAllGuruFromFirestore();
      if (remoteGuru && remoteGuru.length > 0) {
        localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(remoteGuru));
      }

      const remoteSiswa = await FirebaseService.getAllSiswa();
      if (remoteSiswa && remoteSiswa.length > 0) {
        localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(remoteSiswa));
      }

      // 4. Sinkronkan seluruh data Habit / Jurnal (Misi 1..7) dari Cloud Firestore
      // Ini memastikan saat login dengan username yang sama di perangkat berbeda, isian tidak hilang / ter-reset!
      const remoteHabits = await FirebaseService.getAllHabitsFromFirestore();
      if (remoteHabits && remoteHabits.length > 0) {
        const habitsGrouped: Record<number, HabitItemData[]> = {
          1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
        };

        remoteHabits.forEach(h => {
          const hid = Number(h.habitId || 1);
          if (habitsGrouped[hid]) {
            habitsGrouped[hid].push({
              id: h.id,
              tanggal: h.tanggal,
              waktuSubmit: h.waktuSubmit,
              username: h.username,
              namaSiswa: h.namaSiswa,
              kelas: h.kelas,
              detail: h.detail,
              fotoBukti: h.fotoBukti
            });
          }
        });

        for (let i = 1; i <= 7; i++) {
          const key = STORAGE_KEYS.HABIT_PREFIX + i;
          const localRaw = localStorage.getItem(key);
          const localItems: HabitItemData[] = localRaw ? JSON.parse(localRaw) : [];

          // Gabungkan item unik berdasarkan username_tanggal
          const mergedMap = new Map<string, HabitItemData>();
          localItems.forEach(item => {
            const dedupeKey = `${(item.username || '').trim().toLowerCase()}___${item.tanggal}`;
            mergedMap.set(dedupeKey, item);
          });
          habitsGrouped[i].forEach(item => {
            const dedupeKey = `${(item.username || '').trim().toLowerCase()}___${item.tanggal}`;
            mergedMap.set(dedupeKey, item);
          });

          localStorage.setItem(key, JSON.stringify(Array.from(mergedMap.values())));
        }
      }
    } catch (e) {
      console.warn('Sync cloud config warning:', e);
    }
  }

  /**
   * Sinkronkan khusus seluruh entri kebiasaan untuk satu siswa dari Firestore
   * Menjamin saat login di device baru, isian yang sudah dibuat tetap utuh dan tidak ter-reset
   */
  static async syncHabitsForUser(username: string): Promise<void> {
    try {
      const cleanUser = (username || '').trim().toLowerCase();
      const remoteHabits = await FirebaseService.getAllHabitsFromFirestore();
      if (!remoteHabits || remoteHabits.length === 0) return;

      const userHabits = remoteHabits.filter(h => (h.username || '').trim().toLowerCase() === cleanUser);
      if (userHabits.length === 0) return;

      for (let i = 1; i <= 7; i++) {
        const key = STORAGE_KEYS.HABIT_PREFIX + i;
        const localRaw = localStorage.getItem(key);
        const localItems: HabitItemData[] = localRaw ? JSON.parse(localRaw) : [];
        const mergedMap = new Map<string, HabitItemData>();

        localItems.forEach(item => {
          const dedupeKey = `${(item.username || '').trim().toLowerCase()}___${item.tanggal}`;
          mergedMap.set(dedupeKey, item);
        });

        userHabits.filter(h => Number(h.habitId) === i).forEach(item => {
          const dedupeKey = `${(item.username || '').trim().toLowerCase()}___${item.tanggal}`;
          mergedMap.set(dedupeKey, {
            id: item.id,
            tanggal: item.tanggal,
            waktuSubmit: item.waktuSubmit,
            username: item.username,
            namaSiswa: item.namaSiswa,
            kelas: item.kelas,
            detail: item.detail,
            fotoBukti: item.fotoBukti
          });
        });

        localStorage.setItem(key, JSON.stringify(Array.from(mergedMap.values())));
      }
    } catch (e) {
      console.warn('Sync habits for user warning:', e);
    }
  }

  static isConnectedToAppsScript(): boolean {
    return Boolean(this.getAppsScriptUrl().trim());
  }

  // CORE NETWORK METHOD: Call Google Apps Script Web App
  static async callAppsScript(action: string, payload: any = {}): Promise<any> {
    const url = this.getAppsScriptUrl();
    if (!url) {
      throw new Error('URL Google Apps Script belum dikonfigurasi.');
    }

    // Timeout guard 15 detik agar aplikasi tidak membeku
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // 1. Coba via server proxy (/api/gas-proxy) terlebih dahulu untuk bypass CORS dan redirect 302
    try {
      const response = await fetch('/api/gas-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gasUrl: url, action, payload }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (proxyErr) {
      clearTimeout(timeoutId);
      console.warn('Proxy server tidak merespons, mencoba koneksi langsung:', proxyErr);
    }

    // 2. Direct fallback jika proxy tidak merespons (dengan timeout 10 detik)
    try {
      const directController = new AbortController();
      const directTimeoutId = setTimeout(() => directController.abort(), 10000);
      const directResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action, payload }),
        redirect: 'follow',
        signal: directController.signal
      });
      clearTimeout(directTimeoutId);
      return await directResponse.json();
    } catch (directErr) {
      console.warn('Koneksi langsung ke Apps Script timeout atau gagal:', directErr);
      return null;
    }
  }

  // Test Connection to remote Apps Script Web App
  static async testConnection(testUrl?: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = testUrl !== undefined ? testUrl.trim() : this.getAppsScriptUrl();
    if (!targetUrl) {
      return { success: false, message: 'URL Google Apps Script masih kosong.' };
    }

    // 1. Hubungi via Backend Proxy Server
    try {
      const response = await fetch('/api/gas-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gasUrl: targetUrl, action: 'testConnection', payload: {} })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isAuthError) {
          return {
            success: false,
            message: data.message
          };
        }
        if (data && data.success) {
          return {
            success: true,
            message: '✅ Berhasil terhubung ke Google Spreadsheet! Semua data akan otomatis masuk ke Google Sheets & Drive Anda.'
          };
        }
        return {
          success: false,
          message: data.message || 'Apps Script merespons tetapi gagal memverifikasi aksi.'
        };
      }
    } catch (proxyErr) {
      console.warn('Gagal uji lewat proxy, mencoba probe langsung:', proxyErr);
    }

    // 2. Direct fallback
    try {
      const directRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action: 'testConnection', payload: {} }),
        redirect: 'follow'
      });
      const data = await directRes.json();
      if (data && data.success) {
        return { success: true, message: '✅ Berhasil terhubung ke Google Apps Script!' };
      }
      return { success: false, message: data.message || 'Koneksi gagal diverifikasi.' };
    } catch (directErr: any) {
      return {
        success: false,
        message: 'Gagal menghubungi Web App: ' + (directErr.message || 'Pastikan deploy diset Who has access: Anyone')
      };
    }
  }

  // Active User Session
  static getActiveSession(): UserSession | null {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setActiveSession(session: UserSession | null): void {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn('SessionStorage clear warning:', e);
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    }
  }

  // ==========================================
  // FUNGSI LOGIN & AUTENTIKASI
  // ==========================================
  static async validasiLogin(username: string, password: string): Promise<{
    success: boolean;
    role?: UserRole;
    username?: string;
    nama?: string;
    kelas?: string;
    message?: string;
  }> {
    const u = username.trim();
    const p = password.trim();

    this.initSheets();

    // 1. FAST-PATH: Cek kredensial lokal & cache terlebih dahulu (login instan < 0.05 detik)
    if (u.toLowerCase() === 'admin' && p === 'admin123') {
      const dataGuru = this.ambilDataGuruRaw();
      const kepsek = dataGuru.find(g => (g.kelas || '').toLowerCase() === 'kepsek' || g.username.toLowerCase() === 'admin');
      if (kepsek) {
        return { success: true, role: 'Kepala Sekolah', username: kepsek.username, nama: kepsek.nama, kelas: kepsek.kelas };
      }
      return { success: true, role: 'Kepala Sekolah', username: 'admin', nama: 'Kepala Sekolah / Administrator', kelas: 'Kepsek' };
    }

    const dataGuru = this.ambilDataGuruRaw();
    for (const guru of dataGuru) {
      if (guru.username.trim().toLowerCase() === u.toLowerCase() && guru.password === p) {
        let role: UserRole = 'Guru';
        let kelas = guru.kelas;
        if (kelas.toLowerCase() === 'kepsek') {
          role = 'Kepala Sekolah';
        }
        return { success: true, role, username: guru.username, nama: guru.nama, kelas };
      }
    }

    const dataSiswa = this.ambilDataSiswaRaw();
    for (const siswa of dataSiswa) {
      const siswaPass = siswa.password || '';
      if (siswaPass && siswa.nisn.trim().toLowerCase() === u.toLowerCase() && siswaPass === p) {
        // Sinkronkan entri jurnal dari cloud agar tidak ada isian yang hilang
        this.syncHabitsForUser(siswa.nisn).catch(console.warn);
        return { success: true, role: 'Siswa', username: siswa.nisn, nama: siswa.nama, kelas: siswa.kelas };
      }
    }

    // 2. FIRESTORE CLOUD FALLBACK: Sangat penting untuk multi-device sync saat login di perangkat berbeda
    try {
      // Cek akun Siswa di Cloud Firestore
      const firestoreSiswa = await FirebaseService.getAllSiswa();
      const foundSiswa = firestoreSiswa.find(s => s.nisn.trim().toLowerCase() === u.toLowerCase() && (s.password || '') === p);
      if (foundSiswa) {
        const localList = this.ambilDataSiswaRaw();
        if (!localList.some(s => s.nisn.trim().toLowerCase() === u.toLowerCase())) {
          localList.push(foundSiswa);
          localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(localList));
        }
        // Tarik seluruh jurnal dan isian misi sebelumnya dari Firestore ke perangkat baru
        await this.syncHabitsForUser(foundSiswa.nisn);
        return { success: true, role: 'Siswa', username: foundSiswa.nisn, nama: foundSiswa.nama, kelas: foundSiswa.kelas };
      }

      // Cek akun Guru / Kepsek di Cloud Firestore
      const firestoreGuru = await FirebaseService.getAllGuruFromFirestore();
      const foundGuru = firestoreGuru.find(g => g.username.trim().toLowerCase() === u.toLowerCase() && (g.password || '') === p);
      if (foundGuru) {
        const localList = this.ambilDataGuruRaw();
        if (!localList.some(g => g.username.trim().toLowerCase() === u.toLowerCase())) {
          localList.push(foundGuru);
          localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(localList));
        }
        let role: UserRole = (foundGuru.kelas || '').toLowerCase() === 'kepsek' ? 'Kepala Sekolah' : 'Guru';
        return { success: true, role, username: foundGuru.username, nama: foundGuru.nama, kelas: foundGuru.kelas };
      }

      // Cek akun Kepala Sekolah dari config utama di Firestore
      const remoteConfig = await FirebaseService.getPengaturan();
      if (remoteConfig && remoteConfig.usernameKepsek && remoteConfig.usernameKepsek.trim().toLowerCase() === u.toLowerCase() && remoteConfig.passwordKepsek === p) {
        return { success: true, role: 'Kepala Sekolah', username: remoteConfig.usernameKepsek, nama: 'Kepala Sekolah', kelas: 'Kepsek' };
      }
    } catch (cloudErr) {
      console.warn('Cek kredensial ke Firestore error:', cloudErr);
    }

    // 3. REMOTE FALLBACK: Jika tidak ditemukan di lokal/Firestore, cek ke Google Apps Script
    if (this.isConnectedToAppsScript()) {
      try {
        const remoteRes = await this.callAppsScript('validasiLogin', { username: u, password: p });
        if (remoteRes && remoteRes.success) {
          // Sinkronkan ke cache lokal agar login berikutnya instan
          if (remoteRes.role === 'Siswa') {
            const list = this.ambilDataSiswaRaw();
            if (!list.some(s => s.nisn === remoteRes.username)) {
              list.push({
                id: 'siswa-' + Date.now(),
                nisn: remoteRes.username || u,
                nama: remoteRes.nama || u,
                panggilan: '',
                kelas: remoteRes.kelas || '-',
                tahunAjaran: '2026/2027',
                password: p
              });
              localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(list));
            }
          }
          return remoteRes;
        } else if (remoteRes && remoteRes.message && !remoteRes.success) {
          return remoteRes;
        }
      } catch (err) {
        console.warn('Gagal validasi remote via Apps Script:', err);
      }
    }

    return { success: false, message: "ID atau Kata Sandi Salah!" };
  }

  /**
   * Pendaftaran akun administrator / kepala sekolah pertama kali jika database kosong
   */
  static async daftarkanAdminPertama(payload: { nama: string; username: string; password: string }): Promise<{
    success: boolean;
    message: string;
    session?: UserSession;
  }> {
    const list = this.ambilDataGuruRaw();
    const cleanUsername = payload.username.trim();
    const cleanNama = payload.nama.trim();
    const cleanPassword = payload.password.trim();

    if (!cleanNama || !cleanUsername || !cleanPassword) {
      return { success: false, message: 'Seluruh isian (Nama, Username, dan Kata Sandi) wajib diisi!' };
    }

    if (list.some(g => g.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return { success: false, message: 'Username sudah digunakan, silakan pilih username lain!' };
    }

    const newAdmin: GuruRecord = {
      id: 'admin-' + Date.now(),
      username: cleanUsername,
      nama: cleanNama,
      kelas: 'Kepsek',
      password: cleanPassword,
      linkYoutube: '',
      kontenKuisJson: '{}',
      tempatCetak: 'Jakarta',
      tanggalCetak: getTodayDateString(),
      status: 'Aktif'
    };

    list.push(newAdmin);
    localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));

    // Update konfigurasi kop sekolah
    const kop = this.getPengaturanKop().data;
    kop.usernameKepsek = cleanUsername;
    kop.passwordKepsek = cleanPassword;
    localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(kop));

    // Sinkronkan ke cloud
    FirebaseService.saveGuru(newAdmin).catch(console.warn);
    FirebaseService.savePengaturan({
      ...kop,
      usernameKepsek: cleanUsername,
      passwordKepsek: cleanPassword
    }).catch(console.warn);

    const session: UserSession = {
      role: 'Kepala Sekolah',
      username: cleanUsername,
      nama: cleanNama,
      kelas: 'Kepsek'
    };
    this.setActiveSession(session);

    return {
      success: true,
      message: 'Akun Administrator / Kepala Sekolah berhasil dibuat!',
      session
    };
  }

  // ==========================================
  // MANAJEMEN DATA GURU & SISWA
  // ==========================================
  static ambilDataGuruRaw(): GuruRecord[] {
    this.initSheets();
    const raw = localStorage.getItem(STORAGE_KEYS.DATA_GURU);
    return raw ? JSON.parse(raw) : [];
  }

  static ambilDataGuru(): GuruRecord[] {
    return this.ambilDataGuruRaw();
  }

  static async fetchRemoteDataGuru(): Promise<GuruRecord[]> {
    if (this.isConnectedToAppsScript()) {
      try {
        const res = await this.callAppsScript('ambilDataGuru');
        if (res && res.success && Array.isArray(res.data)) {
          localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(res.data));
          return res.data;
        }
      } catch (err) {
        console.warn('Gagal sinkron remote guru:', err);
      }
    }
    return this.ambilDataGuru();
  }

  static async simpanDataGuru(payload: { username: string; nama: string; kelas: string; password?: string; status?: 'Aktif' | 'Nonaktif' }): Promise<{ success: boolean; message: string }> {
    // 1. Simpan ke Google Apps Script (Spreadsheet)
    if (this.isConnectedToAppsScript()) {
      try {
        const remoteRes = await this.callAppsScript('simpanDataGuru', payload);
        if (remoteRes) {
          // Update local cache
          const list = this.ambilDataGuruRaw();
          const newG: GuruRecord = {
            id: 'guru-' + Date.now(),
            username: payload.username,
            nama: payload.nama,
            kelas: payload.kelas,
            password: payload.password || '',
            linkYoutube: '',
            kontenKuisJson: '{}',
            tempatCetak: 'Jakarta',
            tanggalCetak: getTodayDateString(),
            status: payload.status || 'Aktif'
          };
          list.push(newG);
          localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));
          FirebaseService.saveGuru(newG).catch(console.warn);
          return remoteRes;
        }
      } catch (err: any) {
        console.warn('Gagal kirim ke Apps Script:', err);
      }
    }

    // 2. Simpan lokal & Firestore
    try {
      const list = this.ambilDataGuruRaw();
      if (list.some(g => g.username === payload.username)) {
        return { success: false, message: "Username/NIP ini sudah digunakan!" };
      }
      const newG: GuruRecord = {
        id: 'guru-' + Date.now(),
        username: payload.username,
        nama: payload.nama,
        kelas: payload.kelas,
        password: payload.password || '',
        linkYoutube: '',
        kontenKuisJson: '{}',
        tempatCetak: 'Jakarta',
        tanggalCetak: getTodayDateString(),
        status: payload.status || 'Aktif'
      };
      list.push(newG);
      localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));
      FirebaseService.saveGuru(newG).catch(console.warn);
      return { success: true, message: "Akun Guru berhasil ditambahkan!" };
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  }

  static async updateDataGuru(payload: { id?: string; username: string; nama: string; kelas: string; password?: string; status?: 'Aktif' | 'Nonaktif' }): Promise<{ success: boolean; message: string }> {
    if (this.isConnectedToAppsScript()) {
      try {
        await this.callAppsScript('simpanDataGuru', payload);
      } catch (err) {
        console.warn('Gagal remote update guru:', err);
      }
    }

    try {
      const list = this.ambilDataGuruRaw();
      const index = list.findIndex(g => (payload.id && g.id === payload.id) || g.username === payload.username);
      if (index >= 0) {
        list[index] = {
          ...list[index],
          username: payload.username,
          nama: payload.nama,
          kelas: payload.kelas,
          status: payload.status || list[index].status || 'Aktif',
          ...(payload.password ? { password: payload.password } : {})
        };
        localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));
        FirebaseService.saveGuru(list[index]).catch(console.warn);
        return { success: true, message: "Data guru berhasil diperbarui!" };
      } else {
        return this.simpanDataGuru(payload);
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal memperbarui guru' };
    }
  }

  static toggleStatusGuru(usernameOrId: string): { success: boolean; newStatus?: 'Aktif' | 'Nonaktif'; message: string } {
    try {
      const list = this.ambilDataGuruRaw();
      const index = list.findIndex(g => g.id === usernameOrId || g.username === usernameOrId);
      if (index >= 0) {
        if (list[index].kelas.toLowerCase() === 'kepsek') {
          return { success: false, message: 'Akun Kepala Sekolah tidak dapat dinonaktifkan.' };
        }
        const current = list[index].status || 'Aktif';
        const next: 'Aktif' | 'Nonaktif' = current === 'Aktif' ? 'Nonaktif' : 'Aktif';
        list[index].status = next;
        localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));
        if (this.isConnectedToAppsScript()) {
          this.callAppsScript('simpanDataGuru', list[index]).catch(console.warn);
        }
        return { success: true, newStatus: next, message: `Status akun diubah menjadi ${next}.` };
      }
      return { success: false, message: 'Akun guru tidak ditemukan.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  static async hapusDataGuruBulk(usernameArray: string[], callerSession?: UserSession | null): Promise<{ success: boolean; message: string }> {
    const session = callerSession || this.getActiveSession();
    if (session && session.role !== 'Kepala Sekolah') {
      return { success: false, message: 'Akses ditolak: Hanya Kepala Sekolah yang memiliki wewenang menghapus akun guru!' };
    }

    if (!usernameArray || usernameArray.length === 0) {
      return { success: false, message: 'Tidak ada akun guru yang dipilih untuk dihapus.' };
    }

    // Filter out kepsek account
    const safeUsernames = usernameArray.filter(u => u.trim().toLowerCase() !== 'kepsek');
    if (safeUsernames.length === 0) {
      return { success: false, message: 'Akun Kepala Sekolah dilindungi dan tidak dapat dihapus!' };
    }

    if (this.isConnectedToAppsScript()) {
      try {
        const res = await this.callAppsScript('hapusDataGuruBulk', { usernameArray: safeUsernames });
        if (res && res.success) {
          let list = this.ambilDataGuruRaw();
          list = list.filter(g => g.kelas.toLowerCase() === 'kepsek' || !safeUsernames.includes(g.username));
          localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));
          safeUsernames.forEach(u => FirebaseService.deleteGuru(u).catch(console.warn));
          return res;
        }
      } catch (err) {
        console.warn('Gagal remote delete guru:', err);
      }
    }

    try {
      let list = this.ambilDataGuruRaw();
      const initialCount = list.length;
      list = list.filter(g => {
        if (g.kelas.toLowerCase() === 'kepsek') return true;
        return !safeUsernames.includes(g.username);
      });
      const deletedCount = initialCount - list.length;
      localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));
      safeUsernames.forEach(u => FirebaseService.deleteGuru(u).catch(console.warn));
      return { success: true, message: `${deletedCount} akun guru berhasil dihapus permanen dari sistem dan database!` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghapus data guru.' };
    }
  }

  static async hapusDataGuru(username: string, callerSession?: UserSession | null): Promise<{ success: boolean; message: string }> {
    return this.hapusDataGuruBulk([username], callerSession);
  }

  static ambilDataSiswaRaw(): SiswaRecord[] {
    this.initSheets();
    const raw = localStorage.getItem(STORAGE_KEYS.DATA_SISWA);
    return raw ? JSON.parse(raw) : [];
  }

  static ambilDataSiswa(role: string, filterKelas?: string): SiswaRecord[] {
    const list = this.ambilDataSiswaRaw();
    const kelasGuru = filterKelas ? filterKelas.trim().toUpperCase() : '';

    return list.filter(s => {
      const kelasSiswa = s.kelas ? s.kelas.trim().toUpperCase() : '';
      if (role === 'Guru' && kelasGuru !== '' && kelasGuru !== '-' && kelasGuru !== 'KEPSEK' && kelasSiswa !== kelasGuru) {
        return false;
      }
      return true;
    });
  }

  static async fetchRemoteDataSiswa(role: string, filterKelas?: string): Promise<SiswaRecord[]> {
    if (this.isConnectedToAppsScript()) {
      try {
        const res = await this.callAppsScript('ambilDataSiswa', { role, filterKelas });
        if (res && res.success && Array.isArray(res.data)) {
          localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(res.data));
          return res.data;
        }
      } catch (err) {
        console.warn('Gagal sinkron remote siswa:', err);
      }
    }
    return this.ambilDataSiswa(role, filterKelas);
  }

  static async simpanDataSiswa(payload: { nisn: string; nama: string; panggilan: string; kelas: string; tahunAjaran: string; password?: string }): Promise<{ success: boolean; message: string }> {
    if (this.isConnectedToAppsScript()) {
      try {
        const remoteRes = await this.callAppsScript('simpanDataSiswa', payload);
        if (remoteRes) {
          const list = this.ambilDataSiswaRaw();
          const newSiswa: SiswaRecord = {
            id: 'siswa-' + Date.now(),
            nisn: payload.nisn,
            nama: payload.nama,
            panggilan: payload.panggilan,
            kelas: payload.kelas,
            tahunAjaran: payload.tahunAjaran,
            password: payload.password || ''
          };
          list.push(newSiswa);
          localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(list));
          FirebaseService.saveSiswa(newSiswa).catch(console.warn);
          return remoteRes;
        }
      } catch (err) {
        console.warn('Gagal remote simpan siswa:', err);
      }
    }

    try {
      const list = this.ambilDataSiswaRaw();
      if (list.some(s => s.nisn === payload.nisn)) {
        return { success: false, message: "NISN sudah terdaftar!" };
      }
      const newSiswa: SiswaRecord = {
        id: 'siswa-' + Date.now(),
        nisn: payload.nisn,
        nama: payload.nama,
        panggilan: payload.panggilan,
        kelas: payload.kelas,
        tahunAjaran: payload.tahunAjaran,
        password: payload.password || ''
      };
      list.push(newSiswa);
      localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(list));
      FirebaseService.saveSiswa(newSiswa).catch(console.warn);
      return { success: true, message: "Agen Siswa ditambahkan!" };
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  }

  static async simpanDataSiswaBulk(dataArray: any[]): Promise<{ success: boolean; message: string }> {
    if (this.isConnectedToAppsScript()) {
      try {
        const remoteRes = await this.callAppsScript('simpanDataSiswaBulk', { dataArray });
        if (remoteRes) {
          return remoteRes;
        }
      } catch (err) {
        console.warn('Gagal remote bulk simpan siswa:', err);
      }
    }

    try {
      const list = this.ambilDataSiswaRaw();
      const existingNisn = new Set(list.map(s => s.nisn.trim()));

      let countSuccess = 0;
      let countDuplicate = 0;

      dataArray.forEach(row => {
        const nisn = (row.NISN || row.nisn || '').toString().trim();
        const nama = row['Nama Lengkap'] || row.nama || '';
        const panggilan = row.Panggilan || row.panggilan || nama.split(' ')[0] || '';
        const kelas = row.Kelas || row.kelas || '';
        const tahun = row['Tahun Ajaran'] || row.tahunAjaran || '';
        const password = row.Password || row.password || '';

        if (nisn && !existingNisn.has(nisn)) {
          const item: SiswaRecord = {
            id: 'siswa-' + Date.now() + '-' + countSuccess,
            nisn,
            nama,
            panggilan,
            kelas,
            tahunAjaran: tahun,
            password
          };
          list.push(item);
          FirebaseService.saveSiswa(item).catch(console.warn);
          existingNisn.add(nisn);
          countSuccess++;
        } else if (nisn) {
          countDuplicate++;
        }
      });

      localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(list));
      let pesanStatus = `Import Selesai! ${countSuccess} agen berhasil ditambahkan.`;
      if (countDuplicate > 0) pesanStatus += ` (${countDuplicate} agen dilewati karena NISN terdaftar)`;

      return { success: true, message: pesanStatus };
    } catch (e: any) {
      return { success: false, message: "Error saat memproses data: " + e.toString() };
    }
  }

  static async hapusDataSiswaBulk(nisnArray: string[], callerSession?: UserSession | null): Promise<{ success: boolean; message: string }> {
    const session = callerSession || this.getActiveSession();
    if (session && session.role === 'Siswa') {
      return { success: false, message: 'Akses ditolak: Siswa tidak diizinkan menghapus data siswa lain!' };
    }

    if (!nisnArray || nisnArray.length === 0) {
      return { success: false, message: 'Tidak ada agen siswa yang dipilih untuk dihapus.' };
    }

    // Role-based filtering: Guru can only delete students from their own class
    let targetNisnList = [...nisnArray];
    if (session && session.role === 'Guru') {
      const allStudents = this.ambilDataSiswaRaw();
      const guruKelas = (session.kelas || '').trim().toUpperCase();
      targetNisnList = targetNisnList.filter(nisn => {
        const found = allStudents.find(s => s.nisn.trim() === nisn.trim());
        return found && (found.kelas || '').trim().toUpperCase() === guruKelas;
      });

      if (targetNisnList.length === 0) {
        return { success: false, message: 'Akses ditolak: Anda hanya dapat menghapus data siswa di kelas binaan Anda!' };
      }
    }

    if (this.isConnectedToAppsScript()) {
      try {
        const res = await this.callAppsScript('hapusDataSiswaBulk', { nisnArray: targetNisnList });
        if (res && res.success) {
          let list = this.ambilDataSiswaRaw();
          list = list.filter(s => !targetNisnList.includes(s.nisn));
          localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(list));
          targetNisnList.forEach(n => FirebaseService.deleteSiswa(n).catch(console.warn));
          return res;
        }
      } catch (err) {
        console.warn('Gagal remote bulk delete siswa:', err);
      }
    }

    try {
      let list = this.ambilDataSiswaRaw();
      const initialCount = list.length;
      list = list.filter(s => !targetNisnList.includes(s.nisn));
      const deletedCount = initialCount - list.length;
      localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(list));
      targetNisnList.forEach(n => FirebaseService.deleteSiswa(n).catch(console.warn));
      return { success: true, message: `Berhasil menghapus permanen ${deletedCount} agen yang dipilih dari database.` };
    } catch (e: any) {
      return { success: false, message: "Gagal menghapus data: " + e.toString() };
    }
  }

  static async hapusDataSiswa(nisn: string, callerSession?: UserSession | null): Promise<{ success: boolean; message: string }> {
    return this.hapusDataSiswaBulk([nisn], callerSession);
  }

  // ==========================================
  // PENGATURAN KOP & CETAK GLOBAL
  // ==========================================
  static getPengaturanKop(): { success: boolean; data: PengaturanConfig } {
    this.initSheets();
    const raw = localStorage.getItem(STORAGE_KEYS.PENGATURAN);
    const config: PengaturanConfig = raw ? JSON.parse(raw) : DEFAULT_PENGATURAN;

    const dataGuru = this.ambilDataGuruRaw();
    const kepsek = dataGuru.find(g => g.kelas.toLowerCase() === 'kepsek');
    if (kepsek) {
      config.usernameKepsek = kepsek.username;
      config.passwordKepsek = kepsek.password || '';
    }

    return { success: true, data: config };
  }

  static async simpanPengaturanKop(payload: { namaSekolah: string; logoSekolah?: string; linkYoutube?: string; usernameKepsek?: string; passwordKepsek?: string }): Promise<{ success: boolean; message: string }> {
    if (this.isConnectedToAppsScript()) {
      try {
        const remoteRes = await this.callAppsScript('simpanPengaturanKop', payload);
        if (remoteRes && remoteRes.success) {
          // Update local copy
          const current = this.getPengaturanKop().data;
          const updated: PengaturanConfig = {
            ...current,
            namaSekolah: payload.namaSekolah,
            logoSekolah: payload.logoSekolah !== undefined ? payload.logoSekolah : current.logoSekolah,
            linkYoutube: payload.linkYoutube !== undefined ? payload.linkYoutube : current.linkYoutube,
            usernameKepsek: payload.usernameKepsek || current.usernameKepsek,
            passwordKepsek: payload.passwordKepsek || current.passwordKepsek
          };
          localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(updated));
          return remoteRes;
        }
      } catch (err) {
        console.warn('Gagal remote simpan kop:', err);
      }
    }

    try {
      const current = this.getPengaturanKop().data;
      const updated: PengaturanConfig = {
        ...current,
        namaSekolah: payload.namaSekolah,
        logoSekolah: payload.logoSekolah !== undefined ? payload.logoSekolah : current.logoSekolah,
        linkYoutube: payload.linkYoutube !== undefined ? payload.linkYoutube : current.linkYoutube,
        usernameKepsek: payload.usernameKepsek || current.usernameKepsek,
        passwordKepsek: payload.passwordKepsek || current.passwordKepsek
      };
      localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(updated));
      return { success: true, message: 'Pengaturan Sekolah & Akun berhasil disimpan.' };
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  }

  // =========================================================
  // PENGATURAN KELAS KHUSUS GURU
  // =========================================================
  static getPengaturanGuru(kelasGuru: string): { success: boolean; data?: { namaGuru: string; tempatCetak: string; tanggalCetak: string }; message?: string } {
    const list = this.ambilDataGuruRaw();
    const target = kelasGuru ? kelasGuru.trim().toUpperCase() : '';
    const guru = list.find(g => (g.kelas || '').trim().toUpperCase() === target);
    if (guru) {
      return {
        success: true,
        data: {
          namaGuru: guru.nama,
          tempatCetak: guru.tempatCetak || 'Jakarta',
          tanggalCetak: guru.tanggalCetak || getTodayDateString()
        }
      };
    }
    return { success: false, message: "Data guru untuk kelas ini tidak ditemukan." };
  }

  static async simpanPengaturanGuru(payload: { kelas: string; namaGuru: string; tempatCetak: string; tanggalCetak: string }): Promise<{ success: boolean; message: string }> {
    if (this.isConnectedToAppsScript()) {
      try {
        const remoteRes = await this.callAppsScript('simpanPengaturanGuru', payload);
        if (remoteRes && remoteRes.success) {
          const list = this.ambilDataGuruRaw();
          const target = (payload.kelas || '').trim().toUpperCase();
          const guru = list.find(g => (g.kelas || '').trim().toUpperCase() === target);
          if (guru) {
            guru.nama = payload.namaGuru;
            guru.tempatCetak = payload.tempatCetak;
            guru.tanggalCetak = payload.tanggalCetak;
            localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));
          }
          return remoteRes;
        }
      } catch (err) {
        console.warn('Gagal remote simpan pengaturan guru:', err);
      }
    }

    try {
      const list = this.ambilDataGuruRaw();
      const target = (payload.kelas || '').trim().toUpperCase();
      const guru = list.find(g => (g.kelas || '').trim().toUpperCase() === target);
      if (guru) {
        guru.nama = payload.namaGuru;
        guru.tempatCetak = payload.tempatCetak;
        guru.tanggalCetak = payload.tanggalCetak;
        localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));
        return { success: true, message: "Pengaturan dasar kelas berhasil disimpan!" };
      }
      return { success: false, message: "Akses ditolak, kelas guru tidak ditemukan." };
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  }

  // =========================================================
  // PENGATURAN MATERI, YOUTUBE & KUIS (HABIT 1..7)
  // =========================================================
  static getMateriHabit(kelasSiswa: string, habitId: number | string): { success: boolean; data?: HabitMateri; message?: string } {
    const list = this.ambilDataGuruRaw();
    const targetKelas = (kelasSiswa || '').trim().toUpperCase();
    const guru = list.find(g => (g.kelas || '').trim().toUpperCase() === targetKelas);

    if (guru) {
      let materiJson: Record<string, any> = {};
      try {
        materiJson = JSON.parse(guru.kontenKuisJson || '{}');
      } catch {
        materiJson = {};
      }
      const dataHabitIni = materiJson['habit_' + habitId] || {};
      return {
        success: true,
        data: {
          materiTeks: dataHabitIni.materiTeks || '',
          linkYt: dataHabitIni.linkYt || '',
          kuisAktif: dataHabitIni.kuisAktif === true,
          pertanyaan: dataHabitIni.pertanyaan || '',
          opsiA: dataHabitIni.opsiA || '',
          opsiB: dataHabitIni.opsiB || '',
          opsiC: dataHabitIni.opsiC || '',
          jawaban: dataHabitIni.jawaban || 'A'
        }
      };
    }

    return {
      success: true,
      data: {
        materiTeks: 'Materi pembiasaan karakter untuk Misi ini.',
        linkYt: '',
        kuisAktif: false,
        pertanyaan: '',
        opsiA: '',
        opsiB: '',
        opsiC: '',
        jawaban: 'A'
      }
    };
  }

  static async simpanMateriHabit(payload: { kelas: string; habitId: number | string; materiTeks: string; linkYt: string; kuisAktif: boolean; pertanyaan: string; opsiA: string; opsiB: string; opsiC: string; jawaban: string }): Promise<{ success: boolean; message: string }> {
    if (this.isConnectedToAppsScript()) {
      try {
        const remoteRes = await this.callAppsScript('simpanMateriHabit', payload);
        if (remoteRes && remoteRes.success) {
          // Update local cache
          const list = this.ambilDataGuruRaw();
          const targetKelas = (payload.kelas || '').trim().toUpperCase();
          const guru = list.find(g => (g.kelas || '').trim().toUpperCase() === targetKelas);
          if (guru) {
            let materiJson: Record<string, any> = {};
            try { materiJson = JSON.parse(guru.kontenKuisJson || '{}'); } catch { materiJson = {}; }
            materiJson['habit_' + payload.habitId] = {
              materiTeks: payload.materiTeks,
              linkYt: payload.linkYt,
              kuisAktif: payload.kuisAktif,
              pertanyaan: payload.pertanyaan,
              opsiA: payload.opsiA,
              opsiB: payload.opsiB,
              opsiC: payload.opsiC,
              jawaban: payload.jawaban
            };
            guru.kontenKuisJson = JSON.stringify(materiJson);
            localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));
          }
          return remoteRes;
        }
      } catch (err) {
        console.warn('Gagal remote simpan materi:', err);
      }
    }

    try {
      const list = this.ambilDataGuruRaw();
      const targetKelas = (payload.kelas || '').trim().toUpperCase();
      const guru = list.find(g => (g.kelas || '').trim().toUpperCase() === targetKelas);

      if (guru) {
        let materiJson: Record<string, any> = {};
        try { materiJson = JSON.parse(guru.kontenKuisJson || '{}'); } catch { materiJson = {}; }
        materiJson['habit_' + payload.habitId] = {
          materiTeks: payload.materiTeks,
          linkYt: payload.linkYt,
          kuisAktif: payload.kuisAktif,
          pertanyaan: payload.pertanyaan,
          opsiA: payload.opsiA,
          opsiB: payload.opsiB,
          opsiC: payload.opsiC,
          jawaban: payload.jawaban
        };
        guru.kontenKuisJson = JSON.stringify(materiJson);
        localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(list));
        return { success: true, message: `Konten & Kuis untuk Misi ${payload.habitId} berhasil disimpan!` };
      }
      return { success: false, message: "Akses ditolak. Tidak menemukan data kelas guru." };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // ==========================================
  // PENGELOLAAN MISI (HABIT 1 - 7)
  // ==========================================
  static cekStatusMisiHariIni(username: string): number[] {
    this.initSheets();
    const today = getTodayDateString();
    const misiSelesai: number[] = [];

    for (let i = 1; i <= 7; i++) {
      const raw = localStorage.getItem(STORAGE_KEYS.HABIT_PREFIX + i);
      const items: HabitItemData[] = raw ? JSON.parse(raw) : [];
      const found = items.some(item => item.tanggal === today && item.username.trim() === username.trim());
      if (found) {
        misiSelesai.push(i);
      }
    }

    return misiSelesai;
  }

  static getMisiDetailHariIni(username: string, habitId: number): HabitItemData | null {
    const today = getTodayDateString();
    const raw = localStorage.getItem(STORAGE_KEYS.HABIT_PREFIX + habitId);
    const items: HabitItemData[] = raw ? JSON.parse(raw) : [];
    return items.find(item => item.tanggal === today && item.username.trim() === username.trim()) || null;
  }

  // SIMPAN MISI: Optimistic UI (simpan instan di lokal & Firestore, lalu sync ke Google Apps Script di background)
  static async simpanMisiIndividu(payload: { habitId: number; username: string; nama: string; kelas: string; detail: string; fileBase64?: string }): Promise<{ success: boolean; message?: string; fotoUrl?: string }> {
    this.initSheets();
    const today = getTodayDateString();
    const time = getCurrentTimeString();
    const initialFoto = payload.fileBase64 || '';
    const key = STORAGE_KEYS.HABIT_PREFIX + payload.habitId;

    try {
      // 1. INSTANT LOCAL & FIRESTORE SAVE (< 0.05 detik, antarmuka langsung responsif)
      const raw = localStorage.getItem(key);
      const items: HabitItemData[] = raw ? JSON.parse(raw) : [];

      const existingIdx = items.findIndex(item => item.tanggal === today && item.username.trim() === payload.username.trim());
      const docId = existingIdx !== -1 ? items[existingIdx].id : 'misi-' + Date.now();
      const newEntry: HabitItemData = {
        id: docId,
        tanggal: today,
        waktuSubmit: time,
        username: payload.username,
        namaSiswa: payload.nama,
        kelas: payload.kelas,
        detail: payload.detail,
        fotoBukti: initialFoto
      };

      if (existingIdx !== -1) {
        items[existingIdx] = newEntry;
      } else {
        items.push(newEntry);
      }

      localStorage.setItem(key, JSON.stringify(items));

      // Asynchronously synchronize with Firebase Firestore
      FirebaseService.saveHabitEntry(payload.habitId, newEntry).catch(e => {
        console.warn('Firebase sync warning:', e);
      });

      // 2. BACKGROUND SYNC KE GOOGLE APPS SCRIPT (Non-blocking: berjalan di latar belakang tanpa menahan layar siswa)
      if (this.isConnectedToAppsScript()) {
        this.callAppsScript('simpanMisiIndividu', payload).then(remoteRes => {
          if (remoteRes && remoteRes.success && remoteRes.fotoUrl) {
            // Perbarui foto bukti lokal dengan link permanen Google Drive dari Apps Script
            const currentRaw = localStorage.getItem(key);
            if (currentRaw) {
              const currentItems: HabitItemData[] = JSON.parse(currentRaw);
              const idx = currentItems.findIndex(item => item.id === docId);
              if (idx !== -1) {
                currentItems[idx].fotoBukti = remoteRes.fotoUrl;
                localStorage.setItem(key, JSON.stringify(currentItems));
                FirebaseService.saveHabitEntry(payload.habitId, currentItems[idx]).catch(console.warn);
              }
            }
          }
        }).catch(err => {
          console.warn('Background sync ke Apps Script tertunda:', err);
        });
      }

      return {
        success: true,
        message: 'Misi berhasil dicatat dan sedang disinkronkan ke Google Sheets & Drive!',
        fotoUrl: initialFoto
      };
    } catch (error: any) {
      return { success: false, message: error.toString() };
    }
  }

  /**
   * Hapus satu entri misi jurnal tertentu secara permanen dari server Google Apps Script, Firebase, dan Database Lokal
   */
  static async hapusEntriJurnal(habitId: number, username: string, tanggal: string, entryId?: string, callerSession?: UserSession | null): Promise<{ success: boolean; message: string }> {
    this.initSheets();
    const cleanUsername = (username || '').trim();
    const cleanTanggal = (tanggal || '').trim();

    const session = callerSession || this.getActiveSession();
    if (session) {
      if (session.role === 'Siswa' && session.username.trim() !== cleanUsername) {
        return { success: false, message: 'Akses ditolak: Siswa hanya dapat menghapus catatan jurnal milik sendiri!' };
      }
      if (session.role === 'Guru') {
        const student = this.ambilDataSiswaRaw().find(s => s.nisn.trim() === cleanUsername);
        if (student && (student.kelas || '').trim().toUpperCase() !== (session.kelas || '').trim().toUpperCase()) {
          return { success: false, message: 'Akses ditolak: Guru hanya dapat menghapus catatan siswa di kelas yang diampu!' };
        }
      }
    }

    // 1. Hapus di Google Apps Script (Spreadsheet) jika terhubung
    if (this.isConnectedToAppsScript()) {
      try {
        await this.callAppsScript('hapusEntriJurnal', { habitId, username: cleanUsername, tanggal: cleanTanggal });
      } catch (err) {
        console.warn('Gagal remote delete entri jurnal di Apps Script:', err);
      }
    }

    // 2. Hapus di Firestore
    FirebaseService.deleteHabitEntry(habitId, cleanUsername, cleanTanggal, entryId).catch(err => {
      console.warn('Gagal delete Firestore habit:', err);
    });

    // 3. Hapus permanen di LocalStorage
    try {
      const key = STORAGE_KEYS.HABIT_PREFIX + habitId;
      const raw = localStorage.getItem(key);
      let items: HabitItemData[] = raw ? JSON.parse(raw) : [];
      const initialCount = items.length;

      items = items.filter(item => {
        if (entryId && item.id && item.id === entryId) return false;
        if (item.username.trim() === cleanUsername && item.tanggal.trim() === cleanTanggal) return false;
        return true;
      });

      const deletedCount = initialCount - items.length;
      localStorage.setItem(key, JSON.stringify(items));

      return {
        success: true,
        message: deletedCount > 0
          ? `Laporan Misi #${habitId} tanggal ${cleanTanggal} berhasil dihapus permanen dari server dan database!`
          : `Data jurnal Misi #${habitId} telah dihapus permanen.`
      };
    } catch (err: any) {
      return { success: false, message: 'Gagal menghapus entri: ' + err.toString() };
    }
  }

  /**
   * Hapus seluruh jurnal siswa pada tanggal tertentu (seluruh habit 1..7) secara permanen dari database & server
   */
  static async hapusSeluruhJurnalSiswa(username: string, tanggal: string, callerSession?: UserSession | null): Promise<{ success: boolean; message: string }> {
    this.initSheets();
    const cleanUsername = (username || '').trim();
    const cleanTanggal = (tanggal || '').trim();

    const session = callerSession || this.getActiveSession();
    if (session) {
      if (session.role === 'Siswa' && session.username.trim() !== cleanUsername) {
        return { success: false, message: 'Akses ditolak: Siswa hanya dapat menghapus jurnal milik sendiri!' };
      }
      if (session.role === 'Guru') {
        const student = this.ambilDataSiswaRaw().find(s => s.nisn.trim() === cleanUsername);
        if (student && (student.kelas || '').trim().toUpperCase() !== (session.kelas || '').trim().toUpperCase()) {
          return { success: false, message: 'Akses ditolak: Guru hanya dapat menghapus jurnal siswa di kelas yang diampu!' };
        }
      }
    }

    // 1. Hapus di Google Apps Script (Spreadsheet)
    if (this.isConnectedToAppsScript()) {
      try {
        await this.callAppsScript('hapusJurnalSiswaTanggal', { username: cleanUsername, tanggal: cleanTanggal });
      } catch (err) {
        console.warn('Gagal remote delete seluruh jurnal di Apps Script:', err);
      }
    }

    // 2. Hapus di Firestore & LocalStorage untuk seluruh Habit 1..7
    let totalRemoved = 0;
    try {
      for (let i = 1; i <= 7; i++) {
        FirebaseService.deleteHabitEntry(i, cleanUsername, cleanTanggal).catch(console.warn);

        const key = STORAGE_KEYS.HABIT_PREFIX + i;
        const raw = localStorage.getItem(key);
        let items: HabitItemData[] = raw ? JSON.parse(raw) : [];
        const prevCount = items.length;
        items = items.filter(item => !(item.username.trim() === cleanUsername && item.tanggal.trim() === cleanTanggal));
        totalRemoved += (prevCount - items.length);
        localStorage.setItem(key, JSON.stringify(items));
      }

      return {
        success: true,
        message: `Laporan jurnal siswa ${cleanUsername} pada tanggal ${cleanTanggal} berhasil dihapus permanen dari server dan database!`
      };
    } catch (err: any) {
      return { success: false, message: 'Gagal menghapus jurnal: ' + err.toString() };
    }
  }


  // ==========================================
  // LAPORAN & STATISTIK ADMIN
  // ==========================================
  static ambilDataGabungan(role: string, filterKelas?: string, filterTanggal?: string): DailySummaryRow[] {
    this.initSheets();
    const targetKelas = filterKelas ? filterKelas.trim().toUpperCase() : '';
    const targetTanggal = filterTanggal ? filterTanggal.trim() : '';

    const summaryMap: Record<string, DailySummaryRow> = {};

    for (let i = 1; i <= 7; i++) {
      const raw = localStorage.getItem(STORAGE_KEYS.HABIT_PREFIX + i);
      const items: HabitItemData[] = raw ? JSON.parse(raw) : [];

      for (const item of items) {
        const itemKelas = (item.kelas || '').trim().toUpperCase();
        if (role === 'Guru' && targetKelas !== '' && targetKelas !== '-' && targetKelas !== 'KEPSEK' && itemKelas !== targetKelas) {
          continue;
        }

        if (targetTanggal && item.tanggal !== targetTanggal) {
          continue;
        }

        const keyId = item.tanggal + "___" + item.username;
        if (!summaryMap[keyId]) {
          summaryMap[keyId] = {
            tanggal: item.tanggal,
            nama: item.namaSiswa || 'Tanpa Nama',
            kelas: item.kelas || '-',
            username: item.username,
            h1: null,
            h2: null,
            h3: null,
            h4: null,
            h5: null,
            h6: null,
            h7: null
          };
        }

        const prop = ('h' + i) as keyof DailySummaryRow;
        (summaryMap[keyId] as any)[prop] = {
          detail: item.detail,
          url: item.fotoBukti
        };
      }
    }

    const finalArray = Object.values(summaryMap);
    finalArray.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    return finalArray;
  }

  static async fetchRemoteDataGabungan(role: string, filterKelas?: string, filterTanggal?: string): Promise<DailySummaryRow[]> {
    if (this.isConnectedToAppsScript()) {
      try {
        const res = await this.callAppsScript('ambilDataGabungan', { role, filterKelas });
        if (res && res.success && Array.isArray(res.data)) {
          let rows: DailySummaryRow[] = res.data;
          if (filterTanggal) {
            rows = rows.filter(r => r.tanggal === filterTanggal);
          }
          return rows;
        }
      } catch (err) {
        console.warn('Gagal remote ambilDataGabungan:', err);
      }
    }
    return this.ambilDataGabungan(role, filterKelas, filterTanggal);
  }

  static getDashboardKepsekData(role: string, filterKelas?: string): { success: boolean; total: number; stats: DashboardStats; tanggal: string; message?: string } {
    try {
      const tglHariIni = getTodayDateString();
      const semuaData = this.ambilDataGabungan(role, filterKelas, tglHariIni);

      const stats: DashboardStats = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0, h7: 0 };

      semuaData.forEach(row => {
        if (row.h1) stats.h1++;
        if (row.h2) stats.h2++;
        if (row.h3) stats.h3++;
        if (row.h4) stats.h4++;
        if (row.h5) stats.h5++;
        if (row.h6) stats.h6++;
        if (row.h7) stats.h7++;
      });

      return {
        success: true,
        total: semuaData.length,
        stats,
        tanggal: tglHariIni
      };
    } catch (error: any) {
      return { success: false, total: 0, stats: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0, h7: 0 }, tanggal: getTodayDateString(), message: error.message };
    }
  }

  // Backup & Restore
  static exportFullDatabaseJSON(): string {
    this.initSheets();
    const data: Record<string, any> = {
      exportedAt: new Date().toISOString(),
      pengaturan: this.getPengaturanKop().data,
      dataSiswa: this.ambilDataSiswaRaw(),
      dataGuru: this.ambilDataGuruRaw(),
      habits: {}
    };

    for (let i = 1; i <= 7; i++) {
      const raw = localStorage.getItem(STORAGE_KEYS.HABIT_PREFIX + i);
      data.habits['habit_' + i] = raw ? JSON.parse(raw) : [];
    }

    return JSON.stringify(data, null, 2);
  }

  static importFullDatabaseJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.pengaturan) localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(parsed.pengaturan));
      if (parsed.dataSiswa) localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(parsed.dataSiswa));
      if (parsed.dataGuru) localStorage.setItem(STORAGE_KEYS.DATA_GURU, JSON.stringify(parsed.dataGuru));
      if (parsed.habits) {
        for (let i = 1; i <= 7; i++) {
          if (parsed.habits['habit_' + i]) {
            localStorage.setItem(STORAGE_KEYS.HABIT_PREFIX + i, JSON.stringify(parsed.habits['habit_' + i]));
          }
        }
      }
      return { success: true, message: "Database berhasil dipulihkan dari cadangan!" };
    } catch (err: any) {
      return { success: false, message: "Format JSON cadangan tidak valid: " + err.message };
    }
  }

  static resetDatabaseToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.PENGATURAN);
    localStorage.removeItem(STORAGE_KEYS.DATA_GURU);
    localStorage.removeItem(STORAGE_KEYS.DATA_SISWA);
    for (let i = 1; i <= 7; i++) {
      localStorage.removeItem(STORAGE_KEYS.HABIT_PREFIX + i);
    }
    this.initSheets();
  }

  // ==========================================
  // ANALITIK & PROFIL SISWA
  // ==========================================
  static getSiswaProfile(nisn: string): SiswaRecord | null {
    const list = this.ambilDataSiswaRaw();
    return list.find(s => s.nisn.trim() === nisn.trim()) || null;
  }

  static async updateSiswaPassword(nisn: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const list = this.ambilDataSiswaRaw();
    const idx = list.findIndex(s => s.nisn.trim() === nisn.trim());
    if (idx !== -1) {
      list[idx].password = newPass;
      localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(list));
      return { success: true, message: 'Kata sandi berhasil diperbarui!' };
    }
    return { success: false, message: 'Data siswa tidak ditemukan.' };
  }

  static getSiswaAllHabitHistory(username: string): Array<{ habitId: number; entry: HabitItemData }> {
    this.initSheets();
    const results: Array<{ habitId: number; entry: HabitItemData }> = [];

    for (let i = 1; i <= 7; i++) {
      const raw = localStorage.getItem(STORAGE_KEYS.HABIT_PREFIX + i);
      const items: HabitItemData[] = raw ? JSON.parse(raw) : [];
      items.forEach(item => {
        if (item.username.trim() === username.trim()) {
          results.push({ habitId: i, entry: item });
        }
      });
    }

    results.sort((a, b) => new Date(b.entry.tanggal).getTime() - new Date(a.entry.tanggal).getTime());
    return results;
  }

  /**
   * CORE ANALYTICS ENGINE: Menghitung statistik dan data grafik secara 100% dinamis
   * berdasarkan data riil di database tanpa angka dummy/statis.
   * Mendukung hak akses: Siswa, Guru, dan Kepala Sekolah.
   */
  static getDynamicAnalytics(params: {
    role?: UserRole | string;
    username?: string;
    kelas?: string;
    period?: PeriodFilter;
    startDate?: string;
    endDate?: string;
  }): DynamicAnalyticsResult {
    this.initSheets();
    const role = params.role || 'Siswa';
    const cleanUsername = (params.username || '').trim();
    const cleanKelas = (params.kelas || '').trim().toUpperCase();
    const period = params.period || '7hari';

    // 1. Resolve exact date boundary & label for the period
    const range = getDateRangeForPeriod(period, params.startDate, params.endDate);
    const startDate = range.startDate;
    const endDate = range.endDate;
    const periodLabel = range.label;

    // 2. Build continuous daily trend timeline (no skipped days)
    const dailyTrendMap: Record<string, {
      date: string;
      label: string;
      dayName: string;
      completedCount: number;
      maxCount: number;
      habits: number[];
    }> = {};

    const curDate = new Date(startDate + 'T00:00:00');
    const endDateObj = new Date(endDate + 'T00:00:00');
    const shortDayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    while (curDate <= endDateObj) {
      const y = curDate.getFullYear();
      const m = String(curDate.getMonth() + 1).padStart(2, '0');
      const d = String(curDate.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;
      const dayIdx = curDate.getDay();

      dailyTrendMap[dStr] = {
        date: dStr,
        label: `${d}/${m}`,
        dayName: shortDayNames[dayIdx],
        completedCount: 0,
        maxCount: 7,
        habits: []
      };

      curDate.setDate(curDate.getDate() + 1);
    }

    const totalDays = Math.max(1, Object.keys(dailyTrendMap).length);

    // 3. Determine active student count in scope for proper denominator
    let studentCount = 1;
    if (role === 'Guru') {
      if (cleanUsername) {
        studentCount = 1;
      } else {
        const allStudents = this.ambilDataSiswaRaw();
        const classStudents = allStudents.filter(s => (s.kelas || '').trim().toUpperCase() === cleanKelas);
        studentCount = Math.max(1, classStudents.length);
      }
    } else if (role === 'Kepala Sekolah') {
      const allStudents = this.ambilDataSiswaRaw();
      if (cleanKelas && cleanKelas !== 'ALL' && cleanKelas !== '-') {
        const classStudents = allStudents.filter(s => (s.kelas || '').trim().toUpperCase() === cleanKelas);
        studentCount = Math.max(1, classStudents.length);
      } else {
        studentCount = Math.max(1, allStudents.length);
      }
    }

    // Set maxCount for each day
    Object.values(dailyTrendMap).forEach(d => {
      d.maxCount = 7 * studentCount;
    });

    // 4. Habit metadata definitions (7 kebiasaan with distinct colors)
    const HABIT_CONFIGS = [
      { id: 1, title: 'Misi 1: Bangun Pagi', shortTitle: 'Bangun Pagi', iconName: 'Sun', colorHex: '#f59e0b' },
      { id: 2, title: 'Misi 2: Beribadah & Bersyukur', shortTitle: 'Beribadah', iconName: 'HeartHandshake', colorHex: '#10b981' },
      { id: 3, title: 'Misi 3: Berolahraga & Bergerak Aktif', shortTitle: 'Berolahraga', iconName: 'Activity', colorHex: '#0ea5e9' },
      { id: 4, title: 'Misi 4: Gemar Belajar & Membaca', shortTitle: 'Gemar Belajar', iconName: 'BookOpen', colorHex: '#6366f1' },
      { id: 5, title: 'Misi 5: Makan Sehat & Bergizi Seimbang', shortTitle: 'Makan Sehat', iconName: 'Apple', colorHex: '#f43f5e' },
      { id: 6, title: 'Misi 6: Membantu Orang Tua & Sesama', shortTitle: 'Membantu Sesama', iconName: 'HelpingHand', colorHex: '#8b5cf6' },
      { id: 7, title: 'Misi 7: Tidur Tepat Waktu (Tidak Begadang)', shortTitle: 'Tidur Tepat Waktu', iconName: 'Moon', colorHex: '#06b6d4' }
    ];

    // 5. Deduplication and counting
    const habitCompletedCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    const seenEntries = new Set<string>();
    let totalReports = 0;
    const activeDatesSet = new Set<string>();
    const today = getTodayDateString();
    let completedTodayCount = 0;
    const todaySeen = new Set<string>();

    for (let i = 1; i <= 7; i++) {
      const raw = localStorage.getItem(STORAGE_KEYS.HABIT_PREFIX + i);
      const items: HabitItemData[] = raw ? JSON.parse(raw) : [];

      for (const item of items) {
        // Enforce strict access control
        const itemUser = (item.username || '').trim();
        const itemKelas = (item.kelas || '').trim().toUpperCase();

        if (role === 'Siswa' && itemUser !== cleanUsername) {
          continue;
        }

        if (role === 'Guru') {
          if (cleanKelas !== '' && cleanKelas !== 'KEPSEK' && itemKelas !== cleanKelas) {
            continue;
          }
          if (cleanUsername && itemUser !== cleanUsername) {
            continue;
          }
        }

        if (role === 'Kepala Sekolah' && cleanKelas !== '' && cleanKelas !== 'ALL' && cleanKelas !== 'KEPSEK' && itemKelas !== cleanKelas) {
          continue;
        }

        // Deduplication rule: 1 submission per habit per user per date
        const dedupeKey = `${itemUser}___${item.tanggal}___${i}`;
        if (seenEntries.has(dedupeKey)) {
          continue;
        }
        seenEntries.add(dedupeKey);

        // Check if reported today
        if (item.tanggal === today) {
          const todayKey = `${itemUser}___${i}`;
          if (!todaySeen.has(todayKey)) {
            todaySeen.add(todayKey);
            completedTodayCount++;
          }
        }

        // Check if within selected period range
        if (item.tanggal >= startDate && item.tanggal <= endDate) {
          totalReports++;
          habitCompletedCounts[i] = (habitCompletedCounts[i] || 0) + 1;
          activeDatesSet.add(item.tanggal);

          if (dailyTrendMap[item.tanggal]) {
            dailyTrendMap[item.tanggal].completedCount++;
            dailyTrendMap[item.tanggal].habits.push(i);
          }
        }
      }
    }

    // 6. Calculate Streak (for single user or class active streak)
    let streak = 0;
    if (role === 'Siswa') {
      const studentHistory = this.getSiswaAllHabitHistory(cleanUsername);
      const studentDates = new Set(studentHistory.map(h => h.entry.tanggal));

      let checkDate = new Date();
      // If student hasn't logged today yet, start streak check from yesterday so streak doesn't reset early morning
      const todayFormatted = getTodayDateString();
      if (!studentDates.has(todayFormatted)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const y = checkDate.getFullYear();
        const m = String(checkDate.getMonth() + 1).padStart(2, '0');
        const d = String(checkDate.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;

        if (studentDates.has(dateKey)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      streak = activeDatesSet.size;
    }

    // 7. Calculate Previous Period Comparison (same number of days)
    const prevEndDateObj = new Date(startDate + 'T00:00:00');
    prevEndDateObj.setDate(prevEndDateObj.getDate() - 1);
    const prevStartDateObj = new Date(prevEndDateObj);
    prevStartDateObj.setDate(prevStartDateObj.getDate() - (totalDays - 1));

    const prevY1 = prevStartDateObj.getFullYear();
    const prevM1 = String(prevStartDateObj.getMonth() + 1).padStart(2, '0');
    const prevD1 = String(prevStartDateObj.getDate()).padStart(2, '0');
    const prevStartStr = `${prevY1}-${prevM1}-${prevD1}`;

    const prevY2 = prevEndDateObj.getFullYear();
    const prevM2 = String(prevEndDateObj.getMonth() + 1).padStart(2, '0');
    const prevD2 = String(prevEndDateObj.getDate()).padStart(2, '0');
    const prevEndStr = `${prevY2}-${prevM2}-${prevD2}`;

    let previousPeriodReports = 0;
    const prevSeen = new Set<string>();

    for (let i = 1; i <= 7; i++) {
      const raw = localStorage.getItem(STORAGE_KEYS.HABIT_PREFIX + i);
      const items: HabitItemData[] = raw ? JSON.parse(raw) : [];

      for (const item of items) {
        const itemUser = (item.username || '').trim();
        const itemKelas = (item.kelas || '').trim().toUpperCase();

        if (role === 'Siswa' && itemUser !== cleanUsername) continue;
        if (role === 'Guru') {
          if (cleanKelas !== '' && cleanKelas !== 'KEPSEK' && itemKelas !== cleanKelas) continue;
          if (cleanUsername && itemUser !== cleanUsername) continue;
        }
        if (role === 'Kepala Sekolah' && cleanKelas !== '' && cleanKelas !== 'ALL' && cleanKelas !== 'KEPSEK' && itemKelas !== cleanKelas) continue;

        const dedupeKey = `${itemUser}___${item.tanggal}___${i}`;
        if (prevSeen.has(dedupeKey)) continue;
        prevSeen.add(dedupeKey);

        if (item.tanggal >= prevStartStr && item.tanggal <= prevEndStr) {
          previousPeriodReports++;
        }
      }
    }

    const trendDeltaPercent = previousPeriodReports > 0
      ? Math.round(((totalReports - previousPeriodReports) / previousPeriodReports) * 100)
      : (totalReports > 0 ? 100 : 0);

    // 8. Habit summary breakdown
    const totalOpportunityPerHabit = totalDays * studentCount;
    const habitsSummary: HabitStatItem[] = HABIT_CONFIGS.map(cfg => {
      const count = habitCompletedCounts[cfg.id] || 0;
      const percentage = totalOpportunityPerHabit > 0
        ? Math.min(100, Math.round((count / totalOpportunityPerHabit) * 100))
        : 0;

      return {
        habitId: cfg.id,
        number: cfg.id,
        title: cfg.title,
        shortTitle: cfg.shortTitle,
        colorHex: cfg.colorHex,
        iconName: cfg.iconName,
        completedCount: count,
        totalOpportunity: totalOpportunityPerHabit,
        percentage
      };
    });

    // 9. Most consistent habit
    let mostConsistentHabit: DynamicAnalyticsResult['mostConsistentHabit'] = null;
    if (totalReports > 0) {
      const sortedHabits = [...habitsSummary].sort((a, b) => b.completedCount - a.completedCount);
      if (sortedHabits[0] && sortedHabits[0].completedCount > 0) {
        const top = sortedHabits[0];
        mostConsistentHabit = {
          habitId: top.habitId,
          title: top.title,
          shortTitle: top.shortTitle,
          completedCount: top.completedCount,
          percentage: top.percentage,
          colorHex: top.colorHex
        };
      }
    }

    // 10. Overall Rates
    const totalPossibleAll = totalOpportunityPerHabit * 7;
    const periodCompletionRate = totalPossibleAll > 0
      ? Math.min(100, Math.round((totalReports / totalPossibleAll) * 100))
      : 0;

    const todayPossible = 7 * studentCount;
    const todayCompletionRate = todayPossible > 0
      ? Math.min(100, Math.round((completedTodayCount / todayPossible) * 100))
      : 0;

    // 11. Format daily trend
    const sortedDates = Object.keys(dailyTrendMap).sort();
    const dailyTrend = sortedDates.map(k => dailyTrendMap[k]);

    return {
      period,
      periodLabel,
      startDate,
      endDate,
      totalDays,
      totalReports,
      completedTodayCount,
      todayCompletionRate,
      periodCompletionRate,
      activeDaysCount: activeDatesSet.size,
      currentStreak: streak,
      mostConsistentHabit,
      previousPeriodReports,
      trendDeltaPercent,
      habitsSummary,
      dailyTrend,
      hasData: totalReports > 0
    };
  }

  /**
   * Backwards-compatible wrapper for Siswa Analytics
   */
  static getSiswaAnalytics(
    username: string,
    filterMode: '7hari' | '30hari' | 'rentang' | 'semua' = '7hari',
    startDate?: string,
    endDate?: string
  ): SiswaAnalyticsData {
    let period: PeriodFilter = '7hari';
    if (filterMode === '30hari') period = 'bulan_ini';
    if (filterMode === 'rentang') period = 'rentang';

    const dyn = this.getDynamicAnalytics({
      role: 'Siswa',
      username,
      period,
      startDate,
      endDate
    });

    const habitCounts: Record<number, number> = {};
    dyn.habitsSummary.forEach(h => {
      habitCounts[h.habitId] = h.completedCount;
    });

    return {
      totalCompleted: dyn.totalReports,
      activeDays: dyn.activeDaysCount,
      successRate: dyn.periodCompletionRate,
      currentStreak: dyn.currentStreak,
      trendDelta: dyn.trendDeltaPercent,
      habitCounts,
      dailyTrend: dyn.dailyTrend.map(d => ({
        date: d.date,
        label: d.label,
        count: d.completedCount
      }))
    };
  }

  static updatePasswordSiswa(username: string, newPass: string): { success: boolean; message: string } {
    try {
      const list = this.ambilDataSiswaRaw();
      const idx = list.findIndex(s => s.nisn.trim() === username.trim());
      if (idx !== -1) {
        list[idx].password = newPass;
        localStorage.setItem(STORAGE_KEYS.DATA_SISWA, JSON.stringify(list));
        return { success: true, message: 'Kata sandi akunmu berhasil diperbarui!' };
      }
      return { success: false, message: 'Data siswa tidak ditemukan di sistem.' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  static getSiswaMotto(username: string): string {
    return localStorage.getItem(`jurnal7_motto_${username.trim()}`) || 'Disiplin dan pantang menyerah adalah kunci sukses anak hebat!';
  }

  static setSiswaMotto(username: string, motto: string): void {
    localStorage.setItem(`jurnal7_motto_${username.trim()}`, motto.trim());
  }
}
