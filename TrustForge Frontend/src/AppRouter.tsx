import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { RequireAuth, RequireAdmin } from "@/components/layout/guards";

// Public
import { LandingPage } from "@/pages/public/LandingPage";
import { PublicScanPage } from "@/pages/public/PublicScanPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { SignUpPage } from "@/pages/public/SignUpPage";
import { OnboardingPage } from "@/pages/public/OnboardingPage";

// Workspace (authenticated)
import { DashboardPage } from "@/pages/app/DashboardPage";
import { AssessmentPage } from "@/pages/app/AssessmentPage";
import { TrustScorePage } from "@/pages/app/TrustScorePage";
import { WebsiteScanPage } from "@/pages/app/WebsiteScanPage";
import { FindingsPage } from "@/pages/app/FindingsPage";
import { EvidencePage } from "@/pages/app/EvidencePage";
import { RemediationPage } from "@/pages/app/RemediationPage";
import { ReportsPage } from "@/pages/app/ReportsPage";
import { RightsPage } from "@/pages/app/RightsPage";
import { SettingsPage } from "@/pages/app/SettingsPage";

// Admin console
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminOverviewPage } from "@/pages/admin/AdminOverviewPage";
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalyticsPage";
import { AdminOrganizationsPage, AdminOrganizationDetailPage } from "@/pages/admin/AdminOrganizationsPage";
import { AdminUsersPage, AdminUserDetailPage } from "@/pages/admin/AdminUsersPage";
import { AdminAssessmentsPage } from "@/pages/admin/AdminAssessmentsPage";
import { AdminScansPage } from "@/pages/admin/AdminScansPage";
import { AdminFindingsPage } from "@/pages/admin/AdminFindingsPage";
import { AdminEvidencePage } from "@/pages/admin/AdminEvidencePage";
import { AdminReviewPage } from "@/pages/admin/AdminReviewPage";
import { AdminRulesPage } from "@/pages/admin/AdminRulesPage";
import { AdminReportsPage } from "@/pages/admin/AdminReportsPage";
import { AdminSystemPage } from "@/pages/admin/AdminSystemPage";
import { AdminAuditPage } from "@/pages/admin/AdminAuditPage";
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage";

/** Reset scroll to top on every route change (except in-page hash links). */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public marketing + limited scan */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/scan" element={<PublicScanPage />} />
        </Route>

        {/* Standalone auth + onboarding (their own chrome) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Authenticated workspace */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/trust-score" element={<TrustScorePage />} />
          <Route path="/website-scan" element={<WebsiteScanPage />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
          <Route path="/remediation" element={<RemediationPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/rights" element={<RightsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Admin console */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="organizations" element={<AdminOrganizationsPage />} />
          <Route path="organizations/:id" element={<AdminOrganizationDetailPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="assessments" element={<AdminAssessmentsPage />} />
          <Route path="scans" element={<AdminScansPage />} />
          <Route path="findings" element={<AdminFindingsPage />} />
          <Route path="evidence" element={<AdminEvidencePage />} />
          <Route path="review" element={<AdminReviewPage />} />
          <Route path="rules" element={<AdminRulesPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="system" element={<AdminSystemPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
