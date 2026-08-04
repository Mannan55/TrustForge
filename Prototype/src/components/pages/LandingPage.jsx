import React, { useState } from 'react';
import { 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  FileText, 
  Lock, 
  Sparkles, 
  Award, 
  BarChart3, 
  Search, 
  Building2, 
  Users,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { SIX_PILLARS, TESTIMONIALS } from '../../data/mockData';

export default function LandingPage({ onLaunchApp, onOpenLogin }) {
  const [demoUrl, setDemoUrl] = useState('https://www.technova.in');
  const [isScanningDemo, setIsScanningDemo] = useState(false);
  const [demoScanDone, setDemoScanDone] = useState(false);

  const handleRunDemoScan = (e) => {
    e.preventDefault();
    if (!demoUrl) return;
    setIsScanningDemo(true);
    setTimeout(() => {
      setIsScanningDemo(false);
      setDemoScanDone(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Landing Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">TrustForge</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                DPDP 2023 Ready
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#tef-framework" className="hover:text-slate-900 transition-colors">TEF Framework</a>
            <a href="#demo-scanner" className="hover:text-slate-900 transition-colors">Live Scan Demo</a>
            <a href="#testimonials" className="hover:text-slate-900 transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button 
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={onLaunchApp}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all flex items-center space-x-2 group"
            >
              <span>Launch Prototype</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>India’s First AI-Powered Digital Trust & DPDP Platform</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Every Decision Starts With <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Trust</span>.
        </h1>

        <p className="mt-4 text-lg md:text-xl font-medium text-slate-500 max-w-2xl mx-auto">
          Trust isn't claimed. <span className="text-slate-800 font-semibold">It's forged.</span>
        </p>

        <p className="mt-3 text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Empowering Indian Startups and SMEs to evaluate, prove, and maintain compliance with India's Digital Personal Data Protection (DPDP) Act 2023 through automated scanning and the Evidence-based Trust Evaluation Framework (TEF).
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
          >
            <span>Open Trust Center Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#demo-scanner"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors shadow-xs flex items-center justify-center space-x-2"
          >
            <Globe className="w-4 h-4 text-slate-500" />
            <span>Try Free Scan Demo</span>
          </a>
        </div>

        {/* Hero Trust Badges */}
        <div className="mt-12 pt-8 border-t border-slate-200/60 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-xs text-slate-500 font-medium">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>DPDP Act 2023 Aligned</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Trust Evaluation Framework (TEF)</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Real-time Technical Domain Scanning</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Exportable Audit PDFs</span>
          </div>
        </div>
      </section>

      {/* Live Scan Demo Section */}
      <section id="demo-scanner" className="py-16 px-6 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Test Your Website's Trust Score
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter your company's domain to run an instant automated DPDP compliance scan.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-slate-200 shadow-sm max-w-2xl mx-auto">
            <form onSubmit={handleRunDemoScan} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isScanningDemo}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shrink-0 flex items-center space-x-2"
              >
                {isScanningDemo ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Run Scan</span>
                  </>
                )}
              </button>
            </form>

            {/* Instant Demo Results Preview */}
            {demoScanDone && (
              <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in duration-300">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 mb-4">
                  <div>
                    <div className="text-xs text-slate-400">Target Domain</div>
                    <div className="text-sm font-bold text-slate-900">{demoUrl}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Overall Trust Score</div>
                    <div className="text-2xl font-black text-blue-600">89 / 100</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800">
                    <div className="font-semibold">HTTPS & SSL</div>
                    <div className="text-[10px] text-emerald-600">TLS 1.3 Active (Pass)</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800">
                    <div className="font-semibold">Privacy Policy</div>
                    <div className="text-[10px] text-emerald-600">Fresh (&lt;60 days)</div>
                  </div>
                  <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-800">
                    <div className="font-semibold">Cookie Banner</div>
                    <div className="text-[10px] text-amber-600">Mobile Opt-Out Fix</div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={onLaunchApp}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
                  >
                    <span>View Complete Detailed Audit in Trust Center</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6 Pillars Showcase Section */}
      <section id="tef-framework" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            The Trust Evaluation Framework (TEF)
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Six quantifiable pillars governing complete Digital Personal Data Protection readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SIX_PILLARS.map((pillar) => (
            <div key={pillar.id} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-slate-900">{pillar.name}</h3>
                <span className="text-lg font-extrabold text-blue-600">{pillar.score}%</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {pillar.description}
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pillar.score}%`, backgroundColor: pillar.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 px-6 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Trusted by Leading Indian Founders & CTOs
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Here is how SaaS startups use TrustForge to close enterprise deals faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#FAFAFA] border border-slate-200/80 flex flex-col justify-between">
                <p className="text-xs text-slate-600 leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
                <div>
                  <div className="font-semibold text-sm text-slate-900">{t.author}</div>
                  <div className="text-xs text-slate-500">{t.role}, {t.company}</div>
                  <div className="mt-2 inline-block px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                    {t.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              TF
            </div>
            <div>
              <span className="text-white font-bold">TrustForge</span> — Every Decision Starts With Trust.
            </div>
          </div>

          <div className="text-slate-500">
            © 2026 TrustForge Inc. Aligned with DPDP Act 2023 (India).
          </div>
        </div>
      </footer>
    </div>
  );
}
