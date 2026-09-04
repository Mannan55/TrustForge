import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AssessmentProvider } from './context/AssessmentContext';

import { LandingPage } from './pages/LandingPage';
import { WebsiteScanPage } from './pages/WebsiteScanPage';
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TrustCenterPage } from './pages/TrustCenterPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { FindingsPage } from './pages/FindingsPage';
import { EvidencePage } from './pages/EvidencePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <AssessmentProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/scan" element={<WebsiteScanPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Authenticated Workspace Routes */}
            <Route path="/dashboard" element={<TrustCenterPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/findings" element={<FindingsPage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AssessmentProvider>
    </AuthProvider>
  );
}

export default App;
