import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, Globe, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title = 'Trust Center Overview',
  subtitle = 'DPDP Act 2023 baseline posture monitoring'
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { organization } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col lg:flex-row font-sans">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Backdrop for mobile navigation */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-[#0F2E22]/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#0F2E22]/10 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-[#0F2E22] p-1.5 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-[#0F2E22] truncate tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#F2EDE1] border border-[#E3CFAE] text-xs text-[#0F2E22] font-mono">
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span className="truncate max-w-[180px]">
                {organization?.primaryDomain || 'https://www.technova.in'}
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/scan')}
              icon={Search}
            >
              Quick Scan
            </Button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
