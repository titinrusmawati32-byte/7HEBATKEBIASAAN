/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSession } from './types';
import { StorageService } from './services/storageService';
import { FirebaseService, testFirestoreConnection } from './services/firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SiswaDashboard } from './components/siswa/SiswaDashboard';
import { GuruDashboard } from './components/guru/GuruDashboard';
import { KepsekDashboard } from './components/kepsek/KepsekDashboard';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    // Initialize default tables & sheets and sync from cloud Firestore
    StorageService.initSheets();
    StorageService.syncCloudConfig().then(() => {
      setRefreshKey(prev => prev + 1);
    });

    // Verify Firebase connection as mandated by skill
    testFirestoreConnection();

    // Check for existing active session
    const active = StorageService.getActiveSession();
    if (active) {
      setSession(active);
    }

    // Guard against back-forward cache / history navigation
    const handlePopState = () => {
      const currentActive = StorageService.getActiveSession();
      setSession(currentActive);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    if (window.history && window.history.pushState) {
      window.history.pushState({ auth: true, role: userSession.role }, '', window.location.pathname);
    }
  };

  const handleLogout = async () => {
    // End session in storage service
    StorageService.setActiveSession(null);
    setSession(null);

    // End Firebase Auth session
    await FirebaseService.signOut();

    // Replace browser history state to prevent Back button re-access
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div key={refreshKey} className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Global Navigation Bar (displayed when logged in as Siswa) */}
      {session && session.role === 'Siswa' && (
        <Navbar
          session={session}
          onLogout={handleLogout}
          onRefresh={handleRefresh}
        />
      )}

      {/* Main Content View depending on Session Role */}
      <main className="flex-1">
        {!session ? (
          <LandingPage onLoginSuccess={handleLoginSuccess} />
        ) : session.role === 'Siswa' ? (
          <SiswaDashboard
            session={session}
            onLogout={handleLogout}
          />
        ) : session.role === 'Guru' ? (
          <GuruDashboard session={session} onRefresh={handleRefresh} onLogout={handleLogout} />
        ) : (
          <KepsekDashboard session={session} onRefresh={handleRefresh} onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
}
