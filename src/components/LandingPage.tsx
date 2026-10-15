import React, { useState, useEffect, useRef } from 'react';
import { UserSession } from '../types';
import { StorageService } from '../services/storageService';
import { getYouTubeEmbedUrl } from '../utils/helpers';

interface LandingPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<'Siswa' | 'Guru' | 'Kepala Sekolah'>('Siswa');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminFullName, setAdminFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginTip, setLoginTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState(StorageService.getPengaturanKop().data);
  const [isRegisterAdmin, setIsRegisterAdmin] = useState(false);

  // Modals state
  const [isPiagamModalOpen, setIsPiagamModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const loginCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSchoolConfig(StorageService.getPengaturanKop().data);
  }, []);

  const handleRoleChange = (role: 'Siswa' | 'Guru' | 'Kepala Sekolah') => {
    setSelectedRole(role);
    setUsername('');
    setPassword('');
    setAdminFullName('');
    setErrorMessage('');
    setLoginTip('');
    setIsRegisterAdmin(false);
  };

  const scrollToLogin = (role: 'Siswa' | 'Guru' | 'Kepala Sekolah' = 'Siswa', tipMsg?: string) => {
    setSelectedRole(role);
    if (tipMsg) setLoginTip(tipMsg);
    loginCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 400);
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isRegisterAdmin && selectedRole === 'Kepala Sekolah') {
      if (!adminFullName.trim() || !username.trim() || !password.trim()) {
        setErrorMessage('Harap isi Nama Lengkap, Username, dan Kata Sandi Administrator!');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const res = await StorageService.daftarkanAdminPertama({
          nama: adminFullName.trim(),
          username: username.trim(),
          password: password.trim()
        });
        setLoading(false);

        if (res.success && res.session) {
          onLoginSuccess(res.session);
        } else {
          setErrorMessage(res.message || 'Gagal mendaftarkan akun administrator.');
        }
      } catch (err: any) {
        setLoading(false);
        setErrorMessage('Terjadi kesalahan saat pendaftaran admin: ' + err.message);
      }
      return;
    }

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Harap isi Nama Pengguna / NISN dan Kata Sandi!');
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
          username: result.username || username,
          nama: result.nama,
          kelas: result.kelas || '-'
        };
        StorageService.setActiveSession(session);
        onLoginSuccess(session);
      } else {
        setErrorMessage(result.message || 'ID atau Kata Sandi Salah! Pastikan data sudah sesuai.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage('Terjadi kesalahan saat validasi login: ' + err.message);
    }
  };

  const ytEmbedUrl = (schoolConfig.linkYoutube
    ? getYouTubeEmbedUrl(schoolConfig.linkYoutube)
    : null) || undefined;

  return (
    <div className="min-h-screen bg-slate-100/60 sm:py-6 select-none font-sans">
      {/* MobileContainerWrapper */}
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative shadow-2xl flex flex-col overflow-x-hidden pb-28 border-x border-slate-200/50">
        
        {/* BEGIN: TopAppHeader */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between" data-purpose="app-header">
          <div className="flex items-center space-x-2.5">
            {/* Logo Avatar Badge */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-500 p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <i className="fa-solid fa-graduation-cap text-emerald-600 text-lg"></i>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-xs font-black tracking-tight text-slate-800 leading-tight">7 KEBIASAAN</h1>
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">Karakter Emas</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium truncate max-w-[240px]">
                {schoolConfig.namaSekolah || 'SD Generasi Hebat 01 Indonesia'}
              </p>
            </div>
          </div>
        </header>
        {/* END: TopAppHeader */}

        {/* BEGIN: MainContentArea */}
        <main className="px-4 pt-3 space-y-4">
          
          {/* BEGIN: HeroBannerSection */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-emerald-600 to-cyan-700 p-5 text-white shadow-card" data-purpose="hero-banner">
            {/* Decorative subtle circles */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-xl pointer-events-none"></div>

            {/* Tag Gerakan Pelajar Pancasila */}
            <div className="inline-flex items-center space-x-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 mb-3">
              <i className="fa-solid fa-medal text-amber-300 text-xs"></i>
              <span className="text-[10px] font-bold tracking-wide text-amber-200 uppercase">Gerakan Karakter Emas Pelajar Pancasila</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-xl font-extrabold leading-tight text-white mb-1.5">
              Misi 7 Kebiasaan <br />
              <span className="text-amber-300">Anak Indonesia Hebat!</span>
            </h2>
            <p className="text-xs text-emerald-50 leading-relaxed font-normal mb-4 opacity-95">
              Jurnal harian digital pembiasaan karakter unggul. Mulai dari bangun pagi, beribadah, olahraga, belajar, makan sehat, berbakti, hingga tidur tepat waktu!
            </p>

            {/* Stat Counter Badges (7 Misi, 100% Jurnal Mandiri, Emas) */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 text-center border border-white/15 shadow-sm">
                <span className="block text-base font-extrabold text-white">7</span>
                <span className="text-[9px] text-emerald-100 font-medium block leading-tight">Misi Kebaikan</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 text-center border border-white/15 shadow-sm">
                <span className="block text-base font-extrabold text-white">100%</span>
                <span className="text-[9px] text-emerald-100 font-medium block leading-tight">Jurnal Mandiri</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 text-center border border-white/15 shadow-sm">
                <span className="block text-base font-extrabold text-amber-300">Emas</span>
                <span className="text-[9px] text-emerald-100 font-medium block leading-tight">Generasi Berakhlak</span>
              </div>
            </div>
          </section>
          {/* END: HeroBannerSection */}

          {/* BEGIN: StudentLoginQuickCard */}
          {/* Pintu Masuk Markas / Akses Cepat Login Siswa */}
          <section ref={loginCardRef} id="login-card" className="bg-white rounded-3xl p-4 shadow-soft border border-slate-100 transition-all scroll-mt-16" data-purpose="login-card">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                <i className="fa-solid fa-door-open"></i>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-tight">
                  {isRegisterAdmin && selectedRole === 'Kepala Sekolah'
                    ? 'Daftar Akun Administrator'
                    : 'Pintu Masuk Markas'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {isRegisterAdmin && selectedRole === 'Kepala Sekolah'
                    ? 'Inisialisasi akun Kepala Sekolah / Admin baru'
                    : 'Pilih peran dan masukkan kredensial'}
                </p>
              </div>
            </div>

            {/* Role Selector Tab Pills */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mb-3" data-purpose="role-switch">
              <button
                type="button"
                onClick={() => handleRoleChange('Siswa')}
                className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  selectedRole === 'Siswa'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="fa-solid fa-user-graduate text-[11px]"></i>
                <span>Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('Guru')}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  selectedRole === 'Guru'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="fa-solid fa-chalkboard-user text-[11px]"></i>
                <span>Guru</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('Kepala Sekolah')}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  selectedRole === 'Kepala Sekolah'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="fa-solid fa-school text-[11px]"></i>
                <span>Kepsek</span>
              </button>
            </div>

            {/* Tip banner if "Lapor" was clicked */}
            {loginTip && (
              <div className="mb-2.5 p-2 bg-emerald-50/80 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] flex items-center gap-1.5 animate-in fade-in">
                <i className="fa-solid fa-circle-info text-emerald-600 text-xs shrink-0"></i>
                <span className="flex-1">{loginTip}</span>
                <button
                  type="button"
                  onClick={() => setLoginTip('')}
                  className="text-emerald-500 hover:text-emerald-700 p-0.5"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            )}

            {/* Credential Input Fields */}
            <form onSubmit={handleLogin} className="space-y-2.5">
              {isRegisterAdmin && selectedRole === 'Kepala Sekolah' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nama Lengkap Kepala Sekolah
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <i className="fa-regular fa-user text-xs"></i>
                    </span>
                    <input
                      type="text"
                      value={adminFullName}
                      onChange={(e) => setAdminFullName(e.target.value)}
                      placeholder="Contoh: Dra. Hj. Nurhayati, M.Pd"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {selectedRole === 'Siswa'
                    ? 'NISN / Username Siswa'
                    : selectedRole === 'Guru'
                    ? 'NIP / Username Guru'
                    : 'Username Kepala Sekolah'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <i className="fa-regular fa-user text-xs"></i>
                  </span>
                  <input
                    ref={usernameInputRef}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400 transition"
                    placeholder={
                      selectedRole === 'Siswa'
                        ? 'Masukkan NISN atau username siswa'
                        : selectedRole === 'Guru'
                        ? 'Masukkan NIP atau username guru'
                        : 'Masukkan username kepala sekolah'
                    }
                    type="text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <i className="fa-solid fa-lock text-xs"></i>
                  </span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400 transition"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
                  <i className="fa-solid fa-triangle-exclamation text-xs shrink-0 text-rose-500"></i>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2 active:scale-[0.99] transition cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isRegisterAdmin && selectedRole === 'Kepala Sekolah'
                        ? 'Daftar & Masuk Admin'
                        : 'Masuk ke Jurnal'}
                    </span>
                    <i className="fa-solid fa-arrow-right text-xs"></i>
                  </>
                )}
              </button>
            </form>
          </section>
          {/* END: StudentLoginQuickCard */}

          {/* BEGIN: SevenHabitsMissionSection */}
          <section id="misi-section" className="pt-2 scroll-mt-16" data-purpose="mission-list-section">
            {/* Section Title Header */}
            <div className="text-center mb-3">
              <span className="inline-block bg-teal-50 text-teal-700 border border-teal-200/60 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider mb-1">
                Karakter Utama
              </span>
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
                7 Misi Kebiasaan Anak Indonesia Hebat
              </h2>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
                Dilaksanakan setiap hari, dipantau oleh Bapak/Ibu Guru, dan diapresiasi Piagam Resmi!
              </p>
            </div>

            {/* Missions Grid (Responsive 2 Columns for Mobile iOS) */}
            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Card 1: Bangun Pagi */}
              <article className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-amber-300 transition" data-purpose="mission-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-sm shadow-xs">
                      <i className="fa-regular fa-sun"></i>
                    </div>
                    <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Misi #1</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Bangun Pagi</h4>
                  <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                    Membiasakan bangun sebelum matahari terbit, bersyukur atas nikmat hari baru.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Disiplin Waktu</span>
                  <button
                    type="button"
                    onClick={() => scrollToLogin('Siswa', 'Silakan masuk dengan akun Siswa untuk melaporkan misi Bangun Pagi!')}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lapor</span>
                    <i className="fa-solid fa-arrow-right text-[8px]"></i>
                  </button>
                </div>
              </article>

              {/* Card 2: Beribadah */}
              <article className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-teal-300 transition" data-purpose="mission-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-sm shadow-xs">
                      <i className="fa-solid fa-hands-praying"></i>
                    </div>
                    <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Misi #2</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Beribadah</h4>
                  <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                    Menjalankan kewajiban ibadah harian sesuai agama masing-masing secara tertib.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">Religius &amp; Akhlak</span>
                  <button
                    type="button"
                    onClick={() => scrollToLogin('Siswa', 'Silakan masuk dengan akun Siswa untuk melaporkan misi Beribadah!')}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lapor</span>
                    <i className="fa-solid fa-arrow-right text-[8px]"></i>
                  </button>
                </div>
              </article>

              {/* Card 3: Berolahraga */}
              <article className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-cyan-300 transition" data-purpose="mission-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-sm shadow-xs">
                      <i className="fa-solid fa-heart-pulse"></i>
                    </div>
                    <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Misi #3</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Berolahraga</h4>
                  <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                    Menggerakkan badan minimal 15-30 menit melalui senam ceria, jalan pagi, atau lari santai.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">Kebugaran Raga</span>
                  <button
                    type="button"
                    onClick={() => scrollToLogin('Siswa', 'Silakan masuk dengan akun Siswa untuk melaporkan misi Berolahraga!')}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lapor</span>
                    <i className="fa-solid fa-arrow-right text-[8px]"></i>
                  </button>
                </div>
              </article>

              {/* Card 4: Gemar Belajar */}
              <article className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition" data-purpose="mission-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shadow-xs">
                      <i className="fa-solid fa-book-open"></i>
                    </div>
                    <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Misi #4</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Gemar Belajar</h4>
                  <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                    Menumbuhkan rasa ingin tahu dengan membaca buku cerita, mengulang pelajaran sekolah.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">Cendikia &amp; Literasi</span>
                  <button
                    type="button"
                    onClick={() => scrollToLogin('Siswa', 'Silakan masuk dengan akun Siswa untuk melaporkan misi Gemar Belajar!')}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lapor</span>
                    <i className="fa-solid fa-arrow-right text-[8px]"></i>
                  </button>
                </div>
              </article>

              {/* Card 5: Makan Sehat */}
              <article className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-rose-300 transition" data-purpose="mission-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-sm shadow-xs">
                      <i className="fa-solid fa-apple-whole"></i>
                    </div>
                    <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Misi #5</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Makan Sehat</h4>
                  <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                    Mengonsumsi menu makanan seimbang bergizi lengkap (sayuran segar, buah, air putih).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">Nutrisi Sehat</span>
                  <button
                    type="button"
                    onClick={() => scrollToLogin('Siswa', 'Silakan masuk dengan akun Siswa untuk melaporkan misi Makan Sehat!')}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lapor</span>
                    <i className="fa-solid fa-arrow-right text-[8px]"></i>
                  </button>
                </div>
              </article>

              {/* Card 6: Membantu Sesama */}
              <article className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-purple-300 transition" data-purpose="mission-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm shadow-xs">
                      <i className="fa-solid fa-hand-holding-heart"></i>
                    </div>
                    <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Misi #6</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Membantu Sesama</h4>
                  <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                    Menunjukkan bakti dan empati melalui tindakan nyata di rumah atau lingkungan sekitar.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">Gotong Royong</span>
                  <button
                    type="button"
                    onClick={() => scrollToLogin('Siswa', 'Silakan masuk dengan akun Siswa untuk melaporkan misi Membantu Sesama!')}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lapor</span>
                    <i className="fa-solid fa-arrow-right text-[8px]"></i>
                  </button>
                </div>
              </article>

              {/* Card 7: Tidur Tepat Waktu */}
              <article className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-blue-300 transition" data-purpose="mission-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm shadow-xs">
                      <i className="fa-solid fa-moon"></i>
                    </div>
                    <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Misi #7</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Tidur Tepat Waktu</h4>
                  <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                    Membiasakan tidur malam tepat waktu (pukul 20.30 - 21.30) dan tidak bermain gawai larut.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Kesehatan Jiwa</span>
                  <button
                    type="button"
                    onClick={() => scrollToLogin('Siswa', 'Silakan masuk dengan akun Siswa untuk melaporkan misi Tidur Tepat Waktu!')}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lapor</span>
                    <i className="fa-solid fa-arrow-right text-[8px]"></i>
                  </button>
                </div>
              </article>

              {/* Card 8: Special Reward / Piagam Anak Hebat (Golden highlight card) */}
              <article className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-3 text-white shadow-gold flex flex-col justify-between relative overflow-hidden" data-purpose="achievement-card">
                <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none">
                  <i className="fa-solid fa-award text-7xl text-white"></i>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm">
                      <i className="fa-solid fa-star"></i>
                    </div>
                    <span className="text-[9px] font-extrabold bg-white/20 text-white px-1.5 py-0.5 rounded-md">Penghargaan</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-white mb-1">Piagam Anak Hebat</h4>
                  <p className="text-[10px] text-amber-100 leading-snug">
                    Selesaikan ketujuh misi setiap hari untuk cetak Piagam Prestasi Resmi!
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between">
                  <div className="flex text-amber-200 text-[10px] space-x-0.5">
                    <i className="fa-solid fa-star text-white"></i>
                    <i className="fa-solid fa-star text-white"></i>
                    <i className="fa-solid fa-star text-white"></i>
                    <i className="fa-solid fa-star text-white"></i>
                    <i className="fa-solid fa-star text-white"></i>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPiagamModalOpen(true)}
                    className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-md hover:bg-white/30 transition cursor-pointer"
                  >
                    Cek Piagam
                  </button>
                </div>
              </article>

            </div>
          </section>
          {/* END: SevenHabitsMissionSection */}

          {/* BEGIN: EducationalVideoSection */}
          {/* Video Motivasi & Arahan Sekolah */}
          <section id="video-section" className="bg-white rounded-3xl p-4 border border-slate-100 shadow-soft scroll-mt-16" data-purpose="video-section">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold text-sm">
                <i className="fa-solid fa-circle-play"></i>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-tight">Video Motivasi &amp; Arahan Sekolah</h3>
                <p className="text-[10px] text-slate-400">Tonton video edukasi karakter persembahan sekolah</p>
              </div>
            </div>

            {/* Video Player Container with provided data image placeholder */}
            <div
              onClick={() => setIsVideoModalOpen(true)}
              className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video shadow-md group cursor-pointer"
            >
              {/* Video Thumbnail Image from provided snapshot data */}
              <img
                alt="Video Edukasi Karakter Anak Indonesia Hebat"
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-300"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuUY1Z34n5vN7JnVpnmyMXqbnkBl5j57mSsVLadDelF1ZKs7V6jEaO4XAqoy4WOcDtdDSeIwSfRHv0ir_LJLLWv6F_v5RL66OoAdUhSUK0wEkyTOXFJRcB6fUsMFVpH88s8-Zz94517GxG-2e_rMvCFCMxQqkSvJzM-wwx2DjHRXYCCjwrp4gdiNg_osATue08seMzBM-4bS7fA4SFxebgvw5XvXMbNY-iVi0Xhftemd5W6xza7X7lVqyVDEmM0HwQRQ"
              />
              {/* Gradient overlay for video title legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <i className="fa-brands fa-youtube text-red-500 text-xs"></i>
                    <span className="text-[10px] font-semibold text-white tracking-wide">Video Karakter Utama</span>
                  </div>
                  <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Edukasi</span>
                </div>

                {/* Central Play Button */}
                <div className="flex justify-center items-center">
                  <div className="w-12 h-12 rounded-full bg-rose-600/95 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 active:scale-95 transition">
                    <i className="fa-solid fa-play text-sm ml-0.5"></i>
                  </div>
                </div>

                <div className="flex items-center justify-between text-white text-[10px]">
                  <span className="font-medium truncate max-w-[200px]">Panduan Pembiasaan 7 Karakter Pelajar</span>
                  <span className="text-white/80">
                    <i className="fa-regular fa-clock mr-1"></i>04:15
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* END: EducationalVideoSection */}

          {/* BEGIN: EncouragementFooterBanner */}
          <section className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 flex items-center space-x-3" data-purpose="encouragement-banner">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <i className="fa-solid fa-quote-left text-sm"></i>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-700 leading-snug">
                "Karakter unggul tidak lahir dalam semalam, melainkan dibentuk dari kebiasaan kecil setiap hari."
              </p>
              <span className="text-[9px] text-emerald-700 font-semibold mt-0.5 block">
                — Tim Pembina Karakter Siswa
              </span>
            </div>
          </section>
          {/* END: EncouragementFooterBanner */}

          {/* Simple School Attribution */}
          <div className="text-center py-2 text-[10px] text-slate-400">
            <p>© 2026 {schoolConfig.namaSekolah || 'SD Generasi Hebat 01 Indonesia'}</p>
            <p>Jurnal Karakter 7 Kebiasaan Anak Indonesia Hebat</p>
          </div>

        </main>
        {/* END: MainContentArea */}

        {/* BEGIN: MobileBottomNavigation */}
        {/* iOS Style Fixed Bottom Navigation with Safe Area Support */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 max-w-md mx-auto px-4 py-2" data-purpose="bottom-nav">
          <div className="grid grid-cols-4 gap-1 items-center">
            {/* Tab 1: Beranda (Active) */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex flex-col items-center justify-center py-1 text-emerald-600 cursor-pointer"
            >
              <i className="fa-solid fa-house-chimney text-base"></i>
              <span className="text-[10px] font-bold mt-1">Beranda</span>
            </button>
            {/* Tab 2: Misi Jurnal */}
            <button
              type="button"
              onClick={() => scrollToSection('misi-section')}
              className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <i className="fa-solid fa-clipboard-check text-base"></i>
              <span className="text-[10px] font-medium mt-1">Misi</span>
            </button>
            {/* Tab 3: Piagam & Prestasi */}
            <button
              type="button"
              onClick={() => setIsPiagamModalOpen(true)}
              className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <i className="fa-solid fa-award text-base"></i>
              <span className="text-[10px] font-medium mt-1">Piagam</span>
            </button>
            {/* Tab 4: Profil / Masuk */}
            <button
              type="button"
              onClick={() => scrollToLogin('Siswa')}
              className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <i className="fa-regular fa-id-badge text-base"></i>
              <span className="text-[10px] font-medium mt-1">Masuk</span>
            </button>
          </div>
          {/* Home indicator space for iOS bottom bar feeling */}
          <div className="w-28 h-1 bg-slate-300 rounded-full mx-auto mt-2 mb-0.5"></div>
        </nav>
        {/* END: MobileBottomNavigation */}

      </div>
      {/* END: MobileContainerWrapper */}

      {/* POPUP / MODAL: Video Edukasi Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 text-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-white/10 flex flex-col">
            <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border-b border-white/10">
              <div className="flex items-center gap-2">
                <i className="fa-brands fa-youtube text-red-500 text-sm"></i>
                <span className="text-xs font-bold truncate">Panduan Pembiasaan 7 Karakter Pelajar</span>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {schoolConfig.linkYoutube ? (
                <iframe
                  src={ytEmbedUrl}
                  title="Video Pembiasaan Karakter"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-gradient-to-br from-slate-900 to-slate-800">
                  <div className="w-14 h-14 rounded-full bg-rose-600/20 text-rose-500 flex items-center justify-center text-xl">
                    <i className="fa-solid fa-circle-play"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Video Edukasi Karakter</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Tautan video YouTube sekolah dapat dikonfigurasi melalui panel Pengaturan Kepala Sekolah / Database.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-950 text-right">
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP / MODAL: Piagam Informasi Preview Modal */}
      {isPiagamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-award"></i>
                </div>
                <h4 className="font-bold text-sm text-slate-800">Piagam Anak Hebat</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsPiagamModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            {/* Piagam Preview Card Frame */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-50 to-amber-100/70 border-2 border-amber-300 text-center space-y-2 relative overflow-hidden">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-white shadow-md mx-auto mb-1">
                <i className="fa-solid fa-star text-base"></i>
              </div>
              <h5 className="font-extrabold text-xs uppercase tracking-wider text-amber-900">
                Piagam Penghargaan Karakter
              </h5>
              <p className="text-[11px] text-amber-800 leading-snug">
                Diberikan kepada Siswa yang aktif menyelesaikan 7 misi kebiasaan harian secara konsisten dan terverifikasi oleh Guru Kelas.
              </p>
              <div className="pt-2 flex justify-center text-amber-500 text-xs space-x-1">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">Syarat Mencetak Piagam:</p>
              <p>1. Masuk ke akun Siswa.</p>
              <p>2. Selesaikan ketujuh misi kebaikan hari ini.</p>
              <p>3. Klik tombol Piagam di Dasbor Siswa untuk langsung mencetak dokumen resmi!</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPiagamModalOpen(false);
                  scrollToLogin('Siswa', 'Silakan masuk ke akun Siswa untuk mencetak Piagam!');
                }}
                className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-xl shadow-sm hover:from-emerald-500 hover:to-teal-500 cursor-pointer text-center"
              >
                Masuk Sekarang
              </button>
              <button
                type="button"
                onClick={() => setIsPiagamModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
