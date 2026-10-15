import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Volume2,
  Sparkles,
  Info,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { HABIT_DEFINITIONS } from '../../data/habitDefinitions';

export const PengaturanSiswa: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reminderMorning, setReminderMorning] = useState(true);
  const [reminderNight, setReminderNight] = useState(true);
  const schoolConfig = StorageService.getPengaturanKop().data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          Pengaturan Aplikasi Agen
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Atur kenyamanan tampilan, efek suara selebrasi, dan pengingat misi harianmu
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preferences */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-600" />
            Efek &amp; Suara Selebrasi
          </h3>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
              <div>
                <div className="font-bold text-slate-800">Animasi Confetti Misi</div>
                <div className="text-[11px] text-slate-500">Tampilkan pesta taburan kertas saat misi berhasil disimpan</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={e => setSoundEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
              <div>
                <div className="font-bold text-slate-800">Pengingat Misi Pagi (05:00 WIB)</div>
                <div className="text-[11px] text-slate-500">Pengingat bangun pagi dan beribadah subuh</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderMorning}
                  onChange={e => setReminderMorning(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
              <div>
                <div className="font-bold text-slate-800">Pengingat Tidur Tepat Waktu (21:00 WIB)</div>
                <div className="text-[11px] text-slate-500">Pengingat istirahat malam cukup tanpa bermain gawai</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderNight}
                  onChange={e => setReminderNight(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Character Education Guide */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Pedoman Karakter 7 Kebiasaan Emas
          </h3>

          <div className="space-y-2 text-xs">
            {HABIT_DEFINITIONS.map(h => (
              <div key={h.id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[10px]">
                    {h.id}
                  </span>
                  <span className="font-bold text-slate-800">{h.shortTitle}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">{h.badgeText}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
            <strong>Catatan:</strong> Pengaturan sekolah &amp; integrasi database dikelola secara terpusat oleh Kepala Sekolah demi keamanan data.
          </div>
        </div>
      </div>
    </div>
  );
};
