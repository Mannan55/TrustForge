import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/layout/BrandLogo';
import { Button } from '../components/ui/Button';
import {
  ShieldCheck,
  ClipboardCheck,
  Globe,
  FileCheck,
  CheckSquare,
  FileText,
  ArrowRight,
  Building,
  Search,
  LogIn
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, setAccountMode } = useAuth();

  const handleGoogleAuth = async () => {
    await loginWithGoogle();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F2E22] flex flex-col font-sans selection:bg-[#E3CFAE] selection:text-[#0F2E22]">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E3DDD0]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <BrandLogo variant="primary" height={34} />

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide text-[#4A5750]">
            <a href="#how-it-works" className="hover:text-[#0F2E22] transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-[#0F2E22] transition-colors">
              Features
            </a>
            <a href="#who-its-for" className="hover:text-[#0F2E22] transition-colors">
              Who It's For
            </a>
            <a href="#dpdp-framework" className="hover:text-[#0F2E22] transition-colors">
              DPDP Framework
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D5BD97] bg-[#E3CFAE]/30 text-[#0F2E22] text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-[#0F2E22]" />
            <span>Built Specifically For Indian DPDP Compliance</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F2E22] leading-[1.15]">
            Every Decision Starts With <span className="underline decoration-[#E3CFAE] underline-offset-8">Trust</span>.
          </h1>

          <p className="text-lg sm:text-xl text-[#4A5750] max-w-2xl mx-auto font-normal leading-relaxed">
            TrustForge helps Indian businesses understand their DPDP compliance posture, discover gaps, evaluate evidence, and take practical steps toward stronger digital trust.
          </p>

          {/* DUAL PRIMARY OPTION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/scan" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                leftIcon={<Search className="w-4 h-4" />}
              >
                Try Free Website Scan
              </Button>
            </Link>

            <Link
              to="/signup"
              onClick={() => setAccountMode('ORGANIZATION')}
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Organization Account
              </Button>
            </Link>
          </div>

          {/* Google Auth UI Option */}
          <div className="pt-2">
            <button
              onClick={handleGoogleAuth}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border border-[#CFC7B7] bg-white text-xs font-semibold text-[#0F2E22] hover:bg-[#FAF8F5] transition-colors cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <p className="text-xs text-[#7A8981] pt-2 font-medium tracking-wide uppercase">
            Trust isn't claimed. It's forged.
          </p>
        </div>
      </section>

      {/* How TrustForge Works */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#E3DDD0] px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-[#7A8981] uppercase tracking-wider">Methodology</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#0F2E22]">How TrustForge Works</h3>
            <p className="text-sm text-[#4A5750]">
              A calm, progressive disclosure approach to evaluating and improving your Indian compliance posture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Assess',
                desc: 'Answer structured questions tailored to DPDP Act 2023 requirements and run automated website privacy scans.',
                icon: <ClipboardCheck className="w-5 h-5 text-[#0F2E22]" />
              },
              {
                step: '02',
                title: 'Understand',
                desc: 'Review prioritized findings, verify supporting digital evidence, and inspect your 6-pillar Trust Score.',
                icon: <Search className="w-5 h-5 text-[#0F2E22]" />
              },
              {
                step: '03',
                title: 'Improve',
                desc: 'Execute actionable remediation steps with clear legal context, recommended fixes, and required evidence.',
                icon: <CheckSquare className="w-5 h-5 text-[#0F2E22]" />
              },
              {
                step: '04',
                title: 'Report',
                desc: 'Generate executive DPDP compliance reports formatted for leadership, legal advisors, and board review.',
                icon: <FileText className="w-5 h-5 text-[#0F2E22]" />
              }
            ].map((item) => (
              <div key={item.step} className="p-6 rounded-2xl border border-[#E3DDD0] bg-[#FAF8F5] space-y-4 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#7A8981]">{item.step}</span>
                  <div className="p-2 rounded-lg bg-[#E3CFAE]/40">{item.icon}</div>
                </div>
                <h4 className="text-lg font-bold text-[#0F2E22]">{item.title}</h4>
                <p className="text-xs text-[#4A5750] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 border-t border-[#E3DDD0] bg-white text-xs text-[#7A8981] px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo variant="primary" height={24} />
          <p>© 2026 TrustForge. Focused on Indian DPDP & Digital Trust.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-[#0F2E22]">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-[#0F2E22]">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
