import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  LogOut,
  User,
  Database,
  Award,
  ShieldAlert,
  GraduationCap,
  Menu
} from 'lucide-react';
import { UserSession } from '../types';
import { StorageService } from '../services/storageService';
import { DatabaseConfigModal } from './common/DatabaseConfigModal';
import { ConfirmationModal } from './common/ConfirmationModal';

interface NavbarProps {
  session: UserSession | null;
  onLogout: () => void;
  onRefresh?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ session, onLogout, onRefresh, onToggleSidebar }) => {
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('Jurnal 7 Kebiasaan');
  const [schoolLogo, setSchoolLogo] = useState('');
  const hasGasUrl = Boolean(StorageService.getAppsScriptUrl());

  const loadSchoolInfo = () => {
    const config = StorageService.getPengaturanKop().data;
    if (config.namaSekolah) setSchoolName(config.namaSekolah);
    if (config.logoSekolah) setSchoolLogo(config.logoSekolah.split(',')[0]);
  };

  useEffect(() => {
    loadSchoolInfo();
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Kepala Sekolah':
        return {
          label: 'Komandan Sekolah',
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <Award className="w-3.5 h-3.5" />
        };
      case 'Guru':
        return {
          label: session?.kelas ? `Guru ${session.kelas}` : 'Guru Pembina',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <GraduationCap className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: session?.kelas ? `Agen Cilik (${session.kelas})` : 'Agen Siswa',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          icon: <Sparkles className="w-3.5 h-3.5" />
        };
    }
  };

  const badge = session ? getRoleBadge(session.role) : null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3 min-w-0">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                aria-label="Buka menu navigasi"
                title="Buka menu navigasi"
              >
                <Menu className="w-5 h-5 text-slate-700" />
              </button>
            )}

            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-400 p-0.5 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
              {schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-full h-full object-cover rounded-[10px]"
                />
              ) : (
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-emerald-600 font-extrabold text-lg">
                  7H
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight truncate">
                  7 Kebiasaan Anak Indonesia Hebat
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Karakter Emas
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate font-medium">
                {schoolName}
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Database connector indicator - Khusus Admin (Kepala Sekolah) saja */}
            {session?.role === 'Kepala Sekolah' && (
              <button
                onClick={() => setIsDbModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                  hasGasUrl
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                }`}
                title="Hubungkan atau atur Google Apps Script Web App (Akses Admin)"
              >
                <Database className={`w-3.5 h-3.5 ${hasGasUrl ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${hasGasUrl ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  <span>{hasGasUrl ? 'Google Sheets Aktif' : 'Hubungkan Apps Script'}</span>
                </span>
              </button>
            )}

            {session ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-bold text-slate-800 truncate max-w-[160px]">
                    {session.nama}
                  </div>
                  {badge && (
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                      {badge.icon}
                      {badge.label}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                  title="Keluar dari akun"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        type="warning"
        title="Konfirmasi Keluar Aplikasi"
        message={`Apakah Anda yakin ingin keluar dari akun ${session?.nama || ''}?\nSesi aktivitas Anda akan diakhiri secara aman.`}
        confirmLabel="Ya, Keluar Akun"
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          onLogout();
        }}
        onClose={() => setIsLogoutModalOpen(false)}
      />

      {/* Database Setup Modal - Hanya dapat dibuka oleh Admin (Kepala Sekolah) */}
      {session?.role === 'Kepala Sekolah' && isDbModalOpen && (
        <DatabaseConfigModal
          isOpen={true}
          onClose={() => {
            setIsDbModalOpen(false);
            loadSchoolInfo();
            if (onRefresh) onRefresh();
          }}
          onDataChanged={() => {
            loadSchoolInfo();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
};
