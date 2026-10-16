import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  collection,
  setDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { HabitItemData, SiswaRecord, GuruRecord, PengaturanConfig } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on startup
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: the client is offline or initializing.');
    } else {
      console.log('Firebase connection test completed.');
    }
    return false;
  }
}

// Firestore Service helpers for syncing habits and entities
export class FirebaseService {
  /**
   * Simpan atau perbarui entri kebiasaan siswa di Firestore
   */
  static async saveHabitEntry(habitId: number, item: HabitItemData): Promise<void> {
    const cleanUser = String(item.username || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const cleanDate = String(item.tanggal || '').trim();
    const docId = `h${habitId}_${cleanUser}_${cleanDate}`;
    const path = `habits/${docId}`;
    try {
      await setDoc(doc(db, 'habits', docId), {
        id: docId,
        habitId: Math.min(Math.max(Number(habitId || 1), 1), 7),
        tanggal: String(item.tanggal || '').substring(0, 10),
        waktuSubmit: String(item.waktuSubmit || ''),
        username: String(item.username || '').substring(0, 64),
        namaSiswa: String(item.namaSiswa || 'Siswa').substring(0, 128),
        kelas: String(item.kelas || '-').substring(0, 32),
        detail: String(item.detail || ''),
        fotoBukti: (item.fotoBukti && item.fotoBukti.length > 500000) ? '' : String(item.fotoBukti || ''),
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Ambil semua entri kebiasaan dari Firestore
   */
  static async getAllHabitsFromFirestore(): Promise<Array<HabitItemData & { habitId: number }>> {
    const path = 'habits';
    try {
      const snap = await getDocs(collection(db, path));
      const results: Array<HabitItemData & { habitId: number }> = [];
      snap.forEach(d => {
        const data = d.data();
        results.push({
          id: d.id,
          habitId: Number(data.habitId || 1),
          tanggal: data.tanggal,
          waktuSubmit: data.waktuSubmit,
          username: data.username,
          namaSiswa: data.namaSiswa,
          kelas: data.kelas,
          detail: data.detail || '',
          fotoBukti: data.fotoBukti || ''
        });
      });
      return results;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Simpan data siswa ke Firestore
   */
  static async saveSiswa(siswa: SiswaRecord): Promise<void> {
    const docId = siswa.id || `siswa_${siswa.nisn}`;
    const path = `siswa/${docId}`;
    try {
      await setDoc(doc(db, 'siswa', docId), {
        id: docId,
        nisn: siswa.nisn,
        nama: siswa.nama,
        panggilan: siswa.panggilan || '',
        kelas: siswa.kelas,
        tahunAjaran: siswa.tahunAjaran || '',
        password: siswa.password || ''
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Ambil data seluruh siswa dari Firestore
   */
  static async getAllSiswa(): Promise<SiswaRecord[]> {
    const path = 'siswa';
    try {
      const snap = await getDocs(collection(db, path));
      const list: SiswaRecord[] = [];
      snap.forEach(d => {
        const item = d.data() as SiswaRecord;
        list.push({ ...item, id: d.id, password: item.password || '' });
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  /**
   * Simpan data guru ke Firestore
   */
  static async saveGuru(guru: GuruRecord): Promise<void> {
    const docId = guru.id || `guru_${guru.username}`;
    const path = `guru/${docId}`;
    try {
      await setDoc(doc(db, 'guru', docId), {
        id: docId,
        username: guru.username,
        nama: guru.nama,
        kelas: guru.kelas,
        password: guru.password || '',
        linkYoutube: guru.linkYoutube || '',
        kontenKuisJson: guru.kontenKuisJson || '{}',
        tempatCetak: guru.tempatCetak || '',
        tanggalCetak: guru.tanggalCetak || ''
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Simpan pengaturan sekolah ke Firestore
   */
  static async savePengaturan(pengaturan: PengaturanConfig & { appsScriptUrl?: string }): Promise<void> {
    const path = 'pengaturan/config_utama';
    try {
      await setDoc(doc(db, 'pengaturan', 'config_utama'), {
        namaSekolah: pengaturan.namaSekolah,
        logoSekolah: pengaturan.logoSekolah || '',
        linkYoutube: pengaturan.linkYoutube || '',
        usernameKepsek: pengaturan.usernameKepsek || '',
        passwordKepsek: pengaturan.passwordKepsek || '',
        appsScriptUrl: pengaturan.appsScriptUrl || ''
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Ambil pengaturan sekolah dari Firestore
   */
  static async getPengaturan(): Promise<(PengaturanConfig & { appsScriptUrl?: string }) | null> {
    const path = 'pengaturan/config_utama';
    try {
      const snap = await getDoc(doc(db, 'pengaturan', 'config_utama'));
      if (snap.exists()) {
        return snap.data() as any;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  /**
   * Ambil semua data guru dari Firestore
   */
  static async getAllGuruFromFirestore(): Promise<GuruRecord[]> {
    const path = 'guru';
    try {
      const snap = await getDocs(collection(db, path));
      const list: GuruRecord[] = [];
      snap.forEach(d => {
        const item = d.data() as GuruRecord;
        list.push({ ...item, id: d.id, password: item.password || '' });
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  /**
   * Ambil entri kebiasaan khusus untuk satu username tertentu
   */
  static async getHabitsForUser(username: string): Promise<Array<HabitItemData & { habitId: number }>> {
    const all = await this.getAllHabitsFromFirestore();
    const cleanUser = (username || '').trim().toLowerCase();
    return all.filter(h => (h.username || '').trim().toLowerCase() === cleanUser);
  }

  /**
   * Hapus entri kebiasaan secara permanen dari Firestore
   */
  static async deleteHabitEntry(habitId: number, username: string, tanggal: string, entryId?: string): Promise<void> {
    const cleanUser = String(username || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const cleanDate = String(tanggal || '').trim();
    const docId = `h${habitId}_${cleanUser}_${cleanDate}`;
    const path = `habits/${docId}`;
    try {
      await deleteDoc(doc(db, 'habits', docId));
      if (entryId && entryId !== docId) {
        await deleteDoc(doc(db, 'habits', entryId.replace(/[^a-zA-Z0-9_-]/g, '_'))).catch(() => {});
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * Hapus data siswa secara permanen dari Firestore
   */
  static async deleteSiswa(nisn: string): Promise<void> {
    const docId = `siswa_${nisn}`;
    const path = `siswa/${docId}`;
    try {
      await deleteDoc(doc(db, 'siswa', docId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * Hapus data guru secara permanen dari Firestore
   */
  static async deleteGuru(username: string): Promise<void> {
    const docId = `guru_${username}`;
    const path = `guru/${docId}`;
    try {
      await deleteDoc(doc(db, 'guru', docId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * Mengakhiri sesi otentikasi Firebase
   */
  static async signOut(): Promise<void> {
    try {
      await auth.signOut();
    } catch (error) {
      console.warn('Firebase signOut error:', error);
    }
  }
}


