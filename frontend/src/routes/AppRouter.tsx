import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { OrgProvider } from '../context/OrgContext';
import { ToastProvider } from '../context/ToastContext';

// Layouts
import { AppLayout } from '../components/layout/AppLayout';
import { AdminLayout } from '../components/admin/AdminLayout';

// User Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { SignUpPage } from '../pages/SignUpPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { TrustCenterPage } from '../pages/TrustCenterPage';
import { AssessmentPage } from '../pages/AssessmentPage';
import { WebsiteScanPage } from '../pages/WebsiteScanPage';
import { FindingsPage } from '../pages/FindingsPage';
import { EvidencePage } from '../pages/EvidencePage';
import { TrustScorePage } from '../pages/TrustScorePage';
import { RemediationPage } from '../pages/RemediationPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';

// Admin Pages
import { CommandCenterPage } from '../pages/admin/CommandCenterPage';
import { AnalyticsPage } from '../pages/admin/AnalyticsPage';
import { OrganizationsPage } from '../pages/admin/OrganizationsPage';
import { OrgDetailPage } from '../pages/admin/OrgDetailPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { AssessmentsPage as AdminAssessmentsPage } from '../pages/admin/AssessmentsPage';
import { ScansPage as AdminScansPage } from '../pages/admin/ScansPage';
import { FindingsPage as AdminFindingsPage } from '../pages/admin/FindingsPage';
import { EvidencePage as AdminEvidencePage } from '../pages/admin/EvidencePage';
import { AIReviewPage } from '../pages/admin/AIReviewPage';
import { ComplianceRulesPage } from '../pages/admin/ComplianceRulesPage';
import { ReportsPage as AdminReportsPage } from '../pages/admin/ReportsPage';
import { SystemHealthPage } from '../pages/admin/SystemHealthPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <ToastProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* User Console Routes */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<TrustCenterPage />} />
                <Route path="/assessment" element={<AssessmentPage />} />
                <Route path="/scan" element={<WebsiteScanPage />} />
                <Route path="/findings" element={<FindingsPage />} />
                <Route path="/evidence" element={<EvidencePage />} />
                <Route path="/trust-score" element={<TrustScorePage />} />
                <Route path="/remediation" element={<RemediationPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Admin Console Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<CommandCenterPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="organizations" element={<OrganizationsPage />} />
                <Route path="organizations/:id" element={<OrgDetailPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="users/:id" element={<UsersPage />} />
                <Route path="assessments" element={<AdminAssessmentsPage />} />
                <Route path="scans" element={<AdminScansPage />} />
                <Route path="findings" element={<AdminFindingsPage />} />
                <Route path="evidence" element={<AdminEvidencePage />} />
                <Route path="ai-review" element={<AIReviewPage />} />
                <Route path="rules" element={<ComplianceRulesPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="system-health" element={<SystemHealthPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
