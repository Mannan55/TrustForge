import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Globe } from 'lucide-react';
import { Button } from '../common/Button';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0F2E22] flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#F8F6F0]/90 backdrop-blur-md border-b border-[#0F2E22]/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/assets/brand/01-logos/trustforge-logo-dark.svg"
              alt="TrustForge"
              className="h-8 w-auto object-contain"
            />
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E3CFAE]/60 text-[#0F2E22] border border-[#E3CFAE]">
              DPDP Act 2023 Ready
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-[#0F2E22]/80">
            <a href="#methodology" className="hover:text-[#0F2E22] transition-colors">Methodology</a>
            <a href="#tef-framework" className="hover:text-[#0F2E22] transition-colors">TEF Framework</a>
            <a href="#scan-demo" className="hover:text-[#0F2E22] transition-colors">Live Domain Scan</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/scan')}
              icon={Globe}
            >
              Try Free Scan
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/signup')}
              icon={ArrowRight}
              iconPosition="right"
            >
              Create Account
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0F2E22] text-[#F2EDE1] py-12 px-6 border-t border-[#184736] text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src="/assets/brand/01-logos/trustforge-logo-light.svg"
              alt="TrustForge"
              className="h-7 w-auto object-contain"
            />
            <span className="text-[#E3CFAE]/80 font-medium">
              Every Decision Starts With Trust.
            </span>
          </div>

          <div className="text-[#E3CFAE]/70 text-center md:text-right">
            <p>© 2026 TrustForge Inc. India DPDP Compliance Assessment Platform.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              TrustForge is an automated preliminary assessment engine, not a legal certification authority.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
