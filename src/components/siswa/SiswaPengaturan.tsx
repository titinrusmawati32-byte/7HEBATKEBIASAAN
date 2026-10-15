import React, { useState } from 'react';
import {
  Settings,
  Lock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sparkles,
  Shield,
  Save,
  Check
} from 'lucide-react';
import { UserSession } from '../../types';
import { StorageService } from '../../services/storageService';

interface SiswaPengaturanProps {
  session: UserSession;
  onLogout?: () => void;
}

export const SiswaPengaturan: React.FC<SiswaPengaturanProps> = ({ session, onLogout }) => {
  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  // Reminder preferences (saved locally)
  const [morningReminder, setMorningReminder] = useState<boolean>(() => {
    return localStorage.getItem('jurnal7_remind_morning') !== 'false';
  });
  const [eveningReminder, setEveningReminder] = useState<boolean>(() => {
    return localStorage.getItem('jurnal7_remind_evening') !== 'false';
  });
  const [confettiActive, setConfettiActive] = useState<boolean>(() => {
    return localStorage.getItem('jurnal7_confetti') !== 'false';
  });

  const handleToggleMorning = () => {
    const val = !morningReminder;
    setMorningReminder(val);
    localStorage.setItem('jurnal7_remind_morning', String(val));
  };

  const handleToggleEvening = () => {
    const val = !eveningReminder;
    setEveningReminder(val);
    localStorage.setItem('jurnal7_remind_evening', String(val));
  };

  const handleToggleConfetti = () => {
    const val = !confettiActive;
    setConfettiActive(val);
    localStorage.setItem('jurnal7_confetti', String(val));
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPasswordStatus({
        type: 'error',
        message: 'Kata sandi baru minimal 4 karakter!'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'Konfirmasi kata sandi tidak cocok!'
      });
      return;
    }

    const res = StorageService.updatePasswordSiswa(session.username, newPassword);
    if (res.success) {
      setPasswordStatus({
        type: 'success',
        message: 'Kata sandi berhasil diganti! Gunakan kata sandi baru untuk login berikutnya.'
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordStatus({
        type: 'error',
        message: res.message
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Pengaturan Akun & Preferensi
          </h2>
          <p className="text-xs text-slate-500">
            Kelola kata sandi akun siswa dan atur kenyamanan tampilan aplikasi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Ubah Kata Sandi */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Ganti Kata Sandi Akun
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
            {passwordStatus.type && (
              <div className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
                passwordStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {passwordStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                required
                placeholder="Minimal 4 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                required
                placeholder="Ketik ulang kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Kata Sandi Baru</span>
            </button>
          </form>
        </div>

        {/* 3. Preferensi & Pengingat */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Preferensi Misi & Perayaan
            </h3>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Toggle 1: Pengingat Bangun Pagi */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <div className="text-xs font-bold text-slate-800">Pengingat Bangun Pagi</div>
                <div className="text-[10px] text-slate-500">Tampilkan saran jam bangun pagi (04:30 - 05:30 WIB)</div>
              </div>
              <button
                type="button"
                onClick={handleToggleMorning}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  morningReminder ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  morningReminder ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 2: Pengingat Jurnal Sore */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <div className="text-xs font-bold text-slate-800">Pengingat Jurnal Sore</div>
                <div className="text-[10px] text-slate-500">Motivasi menyelesaikan 7 misi sebelum pukul 20:00 WIB</div>
              </div>
              <button
                type="button"
                onClick={handleToggleEvening}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  eveningReminder ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  eveningReminder ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 3: Efek Konfeti */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <div className="text-xs font-bold text-slate-800">Efek Konfeti Perayaan</div>
                <div className="text-[10px] text-slate-500">Animasi perayaan saat berhasil lapor misi</div>
              </div>
              <button
                type="button"
                onClick={handleToggleConfetti}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  confettiActive ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  confettiActive ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* Info Hak Akses Sistem */}
          <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2 text-[11px] text-amber-900">
            <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Keamanan Sistem:</span> Integrasi database Google Apps Script dan manajemen akun sekolah dikelola langsung oleh <strong>Komandan Sekolah (Admin)</strong> demi keamanan data siswa.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
