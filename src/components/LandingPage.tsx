import React, { useState, useEffect, useRef } from 'react';
import { UserSession } from '../types';
import { StorageService } from '../services/storageService';

interface LandingPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState(StorageService.getPengaturanKop().data);

  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSchoolConfig(StorageService.getPengaturanKop().data);
    usernameInputRef.current?.focus();
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Harap masukkan NISN / Username dan Kata Sandi!');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const result = await StorageService.validasiLogin(username, password);
      setLoading(false);

      if (result.success && result.role && result.nama) {
        const session: UserSession = {
          role: result.role,
          username: result.username || username.trim(),
          nama: result.nama,
          kelas: result.kelas || '-'
        };
        StorageService.setActiveSession(session);
        onLoginSuccess(session);
      } else {
        setErrorMessage(
          result.message || 'ID atau Kata Sandi salah! Pastikan data akun Anda sudah terdaftar.'
        );
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(
        'Gagal memverifikasi akun: ' + (err.message || 'Terjadi gangguan jaringan, silakan coba lagi.')
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-emerald-50/40 flex flex-col justify-between items-center p-4 sm:p-6 font-sans select-none">
      
      {/* Spacer Top */}
      <div className="w-full max-w-md mx-auto pt-2 sm:pt-4"></div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto py-2">
        
        {/* App Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-400 p-1 shadow-lg shadow-emerald-500/20 mb-3.5">
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
              <i className="fa-solid fa-graduation-cap text-emerald-600 text-2xl sm:text-3xl"></i>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-emerald-100 shadow-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
              7 Kebiasaan Anak Indonesia Hebat
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">
            Portal Jurnal Karakter
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {schoolConfig.namaSekolah || 'SD Generasi Hebat 01 Indonesia'}
          </p>
        </div>

        {/* Login Card */}
        <main className="w-full bg-white rounded-[32px] p-6 sm:p-8 shadow-custom-card border border-slate-100 relative overflow-hidden">
          
          {/* Subtle Accent Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400"></div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Username / NISN / NIP
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <i className="fa-regular fa-user text-xs"></i>
                </span>
                <input
                  ref={usernameInputRef}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 text-xs sm:text-sm font-semibold rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 placeholder:text-slate-400 transition outline-none"
                  placeholder="Masukkan NISN atau NIP/Username"
                  type="text"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <i className="fa-solid fa-lock text-xs"></i>
                </span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm font-semibold rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 placeholder:text-slate-400 transition outline-none"
                  placeholder="Masukkan kata sandi akun Anda"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Tampilkan kata sandi"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <i className="fa-solid fa-triangle-exclamation text-xs shrink-0 text-rose-500 mt-0.5"></i>
                <div className="flex-1 leading-snug">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-btn-green flex items-center justify-center space-x-2 active:scale-[0.99] transition cursor-pointer disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Jurnal Karakter</span>
                  <i className="fa-solid fa-arrow-right text-xs"></i>
                </>
              )}
            </button>
          </form>

        </main>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center py-4 text-xs text-slate-400 space-y-1">
        <p>© 2026 {schoolConfig.namaSekolah || 'SD Generasi Hebat 01 Indonesia'}</p>
        <p className="text-[11px]">Gerakan Karakter Emas 7 Kebiasaan Pelajar Indonesia</p>
      </footer>

    </div>
  );
};
