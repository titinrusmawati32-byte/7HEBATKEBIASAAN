import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpenCheck,
  BarChart3,
  Award,
  User,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Flame
} from 'lucide-react';
import { SiswaMenuTab, UserSession } from '../../types';

interface SiswaSidebarProps {
  session: UserSession;
  activeMenu: SiswaMenuTab;
  onSelectMenu: (menu: SiswaMenuTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  streakCount: number;
}

export const SiswaSidebar: React.FC<SiswaSidebarProps> = ({
  session,
  activeMenu,
  onSelectMenu,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  streakCount
}) => {
  const menuItems: Array<{
    id: SiswaMenuTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'beranda', label: 'Beranda', icon: LayoutDashboard },
    { id: 'misi', label: '7 Misi Harian', icon: CheckSquare, badge: 'Hari Ini' },
    { id: 'riwayat', label: 'Riwayat Jurnal', icon: BookOpenCheck },
    { id: 'grafik', label: 'Grafik Perkembangan', icon: BarChart3 },
    { id: 'piagam', label: 'Piagam Penghargaan', icon: Award, badge: 'Emas' },
    { id: 'profil', label: 'Profil Saya', icon: User },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings }
  ];

  // Helper initials
  const getInitials = (name: string) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleMenuClick = (id: SiswaMenuTab) => {
    onSelectMenu(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none">
      {/* 1. Header & Logo */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-sm shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-emerald-600 font-extrabold text-sm">
              7H
            </div>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                7 Kebiasaan
              </h2>
              <p className="text-[11px] font-bold text-teal-600 truncate">
                Anak Indonesia Hebat
              </p>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Profil Siswa Card */}
      <div className={`p-4 border-b border-slate-100 transition-all ${isCollapsed ? 'px-2' : ''}`}>
        <div
          onClick={() => handleMenuClick('profil')}
          className={`group cursor-pointer rounded-2xl transition-all ${
            isCollapsed
              ? 'p-2 flex flex-col items-center hover:bg-slate-50'
              : 'p-3 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-indigo-50/40 border border-emerald-100 hover:border-emerald-200'
          }`}
          title="Klik untuk membuka Profil Saya"
        >
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white font-extrabold flex items-center justify-center shadow-xs text-sm">
                {getInitials(session.nama)}
              </div>
              {streakCount > 0 && (
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs border-2 border-white"
                  title={`${streakCount} hari aktif berturut-turut!`}
                >
                  <Flame className="w-3 h-3 text-white fill-white" />
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                  {session.nama}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {session.kelas}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    NISN: {session.username}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Navigasi Utama
          </div>
        )}

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                isCollapsed ? 'justify-center px-2' : 'justify-between'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
              title={item.label}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive ? 'text-white scale-110' : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>

              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Footer & Actions */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center gap-2 p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-xs font-bold"
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Ciutkan Menu</span>
            </>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          title="Keluar dari akun siswa"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Keluar Akun</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Persistent) */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out border-r border-slate-200 sticky top-0 h-screen z-30 ${
          isCollapsed ? 'w-20' : 'w-64 xl:w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer (Slide in) */}
      <div
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
