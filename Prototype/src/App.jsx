import React, { useState } from 'react';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import CommandPaletteModal from './components/common/CommandPaletteModal';
import Toast from './components/common/Toast';

import LandingPage from './components/pages/LandingPage';
import LoginPage from './components/pages/LoginPage';
import TrustCenterDashboard from './components/pages/TrustCenterDashboard';
import AssessmentWizard from './components/pages/AssessmentWizard';
import WebsiteScanResults from './components/pages/WebsiteScanResults';
import TrustScore from './components/pages/TrustScore';
import Findings from './components/pages/Findings';
import ReportPreview from './components/pages/ReportPreview';
import Settings from './components/pages/Settings';

export default function App() {
  const [currentView, setCurrentView] = useState('app'); // 'landing' | 'login' | 'app'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'assessment' | 'scan' | 'score' | 'findings' | 'reports' | 'settings'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleNavigateFromCmd = (tabId) => {
    setCurrentView('app');
    setActiveTab(tabId);
    showToast(`Navigated to ${tabId.toUpperCase()}`, 'info');
  };

  const renderAppContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TrustCenterDashboard onNavigate={setActiveTab} onShowToast={showToast} />;
      case 'assessment':
        return (
          <AssessmentWizard
            onCompleteAssessment={() => {
              setActiveTab('dashboard');
            }}
            onShowToast={showToast}
          />
        );
      case 'scan':
        return <WebsiteScanResults onTriggerScan={() => {}} onShowToast={showToast} />;
      case 'score':
        return <TrustScore onNavigate={setActiveTab} />;
      case 'findings':
        return <Findings onShowToast={showToast} />;
      case 'reports':
        return <ReportPreview onShowToast={showToast} />;
      case 'settings':
        return <Settings onShowToast={showToast} />;
      default:
        return <TrustCenterDashboard onNavigate={setActiveTab} onShowToast={showToast} />;
    }
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        onLaunchApp={() => {
          setCurrentView('app');
          setActiveTab('dashboard');
        }}
        onOpenLogin={() => setCurrentView('login')}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setCurrentView('app');
          setActiveTab('dashboard');
          showToast('Welcome back, Rajesh V. Sharma (DPO)', 'success');
        }}
        onBackToLanding={() => setCurrentView('landing')}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-[#111827] overflow-hidden font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          onOpenCmdPalette={() => setIsCmdPaletteOpen(true)}
          currentView={currentView}
          onChangeView={setCurrentView}
          onTriggerScan={() => {
            showToast('Initiated domain scan for technova.in', 'info');
          }}
          onShowToast={showToast}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {renderAppContent()}
        </main>
      </div>

      {/* Global Command Palette Modal (Cmd + K) */}
      <CommandPaletteModal
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
        onNavigate={handleNavigateFromCmd}
      />

      {/* Global Floating Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
