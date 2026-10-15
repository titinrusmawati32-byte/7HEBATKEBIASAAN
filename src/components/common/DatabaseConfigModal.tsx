import React, { useState } from 'react';
import {
  X,
  Database,
  Link,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  Code,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { COMPLETE_APPS_SCRIPT_CODE } from '../../data/companionAppsScript';
import { ConfirmationModal } from './ConfirmationModal';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const [gasUrl, setGasUrl] = useState(StorageService.getAppsScriptUrl());
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'koneksi' | 'backup' | 'script'>('koneksi');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleSaveUrl = async () => {
    StorageService.setAppsScriptUrl(gasUrl);
    setSaveStatus('Menyimpan & menguji koneksi...');
    const test = await StorageService.testConnection(gasUrl);
    if (test.success) {
      setSaveStatus('✅ URL tersimpan dan terhubung ke Google Spreadsheet Anda!');
      setTestResult({ status: 'success', message: test.message });
    } else {
      setSaveStatus('URL tersimpan di aplikasi.');
      setTestResult({ status: 'error', message: test.message });
    }
    setTimeout(() => setSaveStatus(null), 4000);
    if (onDataChanged) onDataChanged();
  };

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      setTestResult({
        status: 'error',
        message: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.'
      });
      return;
    }

    setTestResult({ status: 'testing', message: 'Menghubungi Google Apps Script Web App...' });
    const res = await StorageService.testConnection(gasUrl);
    setTestResult({
      status: res.success ? 'success' : 'error',
      message: res.message
    });
  };

  const handleExportJSON = () => {
    const jsonStr = StorageService.exportFullDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-jurnal-7kebiasaan-${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = StorageService.importFullDatabaseJSON(content);
      setImportStatus({
        type: res.success ? 'success' : 'error',
        message: res.message
      });
      if (res.success && onDataChanged) {
        onDataChanged();
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      StorageService.resetDatabaseToDefault();
      setImportStatus({
        type: 'success',
        message: 'Database berhasil direset ke data default bawaan!'
      });
      setIsResetConfirmOpen(false);
      if (onDataChanged) onDataChanged();
    } finally {
      setIsResetting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(COMPLETE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Pusat Integrasi & Database</h3>
              <p className="text-xs text-slate-500">Koneksi Google Apps Script & Manajemen Cadangan Data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2">
          <button
            onClick={() => setActiveTab('koneksi')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'koneksi'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Link className="w-4 h-4" />
            Koneksi Web App
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download className="w-4 h-4" />
            Backup & Ekspor
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'script'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code className="w-4 h-4" />
            Kode Router Apps Script
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'koneksi' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-emerald-900">Database Lokal Otomatis Aktif</p>
                    <p className="text-emerald-700 mt-1">
                      Aplikasi saat ini telah berjalan penuh dengan penyimpanan browser (Local Storage) yang menampung
                      seluruh tabel: <strong>Pengaturan, Data_Siswa, Data_Guru,</strong> dan <strong>Habit_1 s/d Habit_7</strong> sesuai struktur Google Sheets Anda.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  URL Google Apps Script Web App (Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={gasUrl}
                    onChange={(e) => setGasUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleSaveUrl}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
                  >
                    Simpan
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Jika Anda telah mempublikasikan Google Apps Script sebagai <em>Web App</em> (Akses: <em>Anyone/Siapa Saja</em>), masukkan URL endpoint di sini.
                </p>
              </div>

              {saveStatus && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {saveStatus}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testResult.status === 'testing'}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                  {testResult.status === 'testing' ? 'Sedang Menguji Koneksi...' : 'Uji Koneksi'}
                </button>
                {testResult.message && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold leading-relaxed border flex items-start gap-2.5 ${
                      testResult.status === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : testResult.status === 'error'
                        ? 'bg-rose-50 text-rose-900 border-rose-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {testResult.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>{testResult.message}</div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Panduan Singkat Deploy Google Apps Script:</h4>
                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <li>Buka Spreadsheet Anda, klik menu <strong>Extensions &gt; Apps Script</strong>.</li>
                  <li>Pastikan kode backend Anda dan kode <code>doPost</code> dari tab &quot;Kode Router&quot; sudah terpasang.</li>
                  <li>Jalankan fungsi <code>initSheets</code> sekali untuk menyiapkan sheet & header.</li>
                  <li>Klik tombol <strong>Deploy &gt; New deployment</strong> di kanan atas.</li>
                  <li>Pilih jenis <strong>Web app</strong>, atur <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>.</li>
                  <li>Salin URL Web App yang berakhiran <code>/exec</code> dan tempelkan di kotak di atas.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Status Pemulihan / Import / Reset */}
              {importStatus.type && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {importStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  Ekspor Cadangan Lengkap (JSON)
                </h4>
                <p className="text-xs text-slate-600">
                  Unduh seluruh data aplikasi (Data Siswa, Data Guru, Pengaturan Sekolah, serta seluruh Laporan Misi Habit 1-7) dalam format file JSON untuk disimpan secara aman.
                </p>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Unduh File Cadangan JSON
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-sky-600" />
                  Pulihkan dari File Cadangan (JSON)
                </h4>
                <p className="text-xs text-slate-600">
                  Pulihkan kembali data siswa, guru, dan riwayat jurnal dari file cadangan yang pernah diekspor sebelumnya.
                </p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
                  <Upload className="w-4 h-4" />
                  <span>Pilih File JSON Cadangan</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
                <h4 className="font-semibold text-rose-800 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Reset ke Data Awal Demo
                </h4>
                <p className="text-xs text-rose-700">
                  Kembalikan data ke kondisi awal pabrik dengan akun sampel (Kepsek, Guru Kelas 4A, Siswa Budi dkk).
                </p>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Database
                </button>
              </div>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Kode Lengkap Google Apps Script (Code.gs)</h4>
                  <p className="text-xs text-slate-500">
                    Salin seluruh kode ini dan tempelkan ke project Apps Script di Spreadsheet Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Tersalin Semua!' : 'Salin Seluruh Kode Apps Script'}
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto max-h-80 border border-slate-800 leading-relaxed selection:bg-emerald-800">
                {COMPLETE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset Database */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        type="danger"
        title="Reset Seluruh Database ke Awal?"
        message="PERINGATAN!\n\nApakah Anda yakin ingin mengatur ulang semua data ke data bawaan awal? Data jurnal, siswa, dan guru yang belum dicadangkan akan dihapus secara permanen."
        confirmLabel="Ya, Reset Database"
        isLoading={isResetting}
        onConfirm={handleConfirmReset}
        onClose={() => {
          if (!isResetting) {
            setIsResetConfirmOpen(false);
          }
        }}
      />
    </div>
  );
};
