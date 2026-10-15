import React, { useState } from 'react';
import {
  User,
  Lock,
  CheckCircle2,
  Sparkles,
  School,
  Key,
  ShieldCheck,
  Save,
  Check
} from 'lucide-react';
import { UserSession } from '../../types';
import { StorageService } from '../../services/storageService';

interface ProfilSayaProps {
  session: UserSession;
}

export const ProfilSaya: React.FC<ProfilSayaProps> = ({ session }) => {
  const [profile, setProfile] = useState(() => StorageService.getSiswaProfile(session.username));
  const schoolConfig = StorageService.getPengaturanKop().data;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState('🌟');

  const avatars = ['🌟', '🚀', '🦁', '🦅', '🐬', '🐯', '🎯', '🏅'];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setPasswordStatus({ success: false, message: 'Kata sandi baru tidak boleh kosong.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    const res = await StorageService.updateSiswaPassword(session.username, newPassword);
    setPasswordStatus(res);
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 flex items-center justify-center text-5xl shadow-md ring-4 ring-emerald-50">
              {selectedAvatar}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Agen Karakter Aktif
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {session.nama}
            </h2>

            <p className="text-sm font-semibold text-slate-600">
              NISN: <span className="font-mono text-emerald-700 font-bold">{session.username}</span> • {session.kelas}
            </p>

            <p className="text-xs text-slate-500">
              {schoolConfig.namaSekolah || 'Nama Sekolah'} • Tahun Ajaran {profile?.tahunAjaran || '2026/2027'}
            </p>

            {/* Choose Avatar Badge */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Pilih Lencana Avatar Agen:</span>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {avatars.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${
                      selectedAvatar === av
                        ? 'border-emerald-500 bg-emerald-50 scale-110 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            Data Identitas Siswa
          </h3>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-slate-500">Nama Lengkap</span>
              <span className="font-extrabold text-slate-900">{profile?.nama || session.nama}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-slate-500">Nama Panggilan</span>
              <span className="font-extrabold text-slate-900">{profile?.panggilan || session.nama.split(' ')[0]}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-slate-500">NISN / Akun</span>
              <span className="font-mono font-extrabold text-emerald-700">{session.username}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-slate-500">Rombongan Belajar</span>
              <span className="font-extrabold text-slate-900">{session.kelas}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-slate-500">Tahun Ajaran</span>
              <span className="font-extrabold text-slate-900">{profile?.tahunAjaran || '2026/2027'}</span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            Ganti Kata Sandi Akun
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru:</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Masukkan sandi baru..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Konfirmasi Sandi Baru:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi sandi baru..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              />
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-xl font-bold flex items-center gap-2 ${
                  passwordStatus.success
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {passwordStatus.success ? <Check className="w-4 h-4" /> : null}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Kata Sandi Baru</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
