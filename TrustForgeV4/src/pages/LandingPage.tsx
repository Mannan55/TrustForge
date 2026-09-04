import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  ChevronRight,
  Shield,
  FileText,
  Lock,
  Building2,
  Cpu
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [demoUrl, setDemoUrl] = useState('https://www.technova.in');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResultReady, setScanResultReady] = useState(false);

  const handleDemoScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUrl) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanResultReady(true);
    }, 1200);
  };

  const TEF_PILLARS = [
    { name: 'Notice & Consent', score: 92, desc: 'Itemized notice availability in English and 8th Schedule Indian languages.' },
    { name: 'Data Principal Rights', score: 85, desc: 'Operational workflows for data access, correction, and erasure fulfillment.' },
    { name: 'Technical Security', score: 95, desc: 'AES-256 encryption at rest, TLS 1.3 in transit, CERT-In breach reporting.' },
    { name: 'Processor Governance', score: 80, desc: 'Data Processing Agreements and Indian data residency verification.' },
    { name: 'Data Retention SLA', score: 88, desc: 'Purpose completion triggers and automated inactive data deletion.' },
    { name: 'Evidence Verification', score: 94, desc: 'Cryptographic policy hashing and statutory audit document verification.' }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#E3CFAE]/40 border border-[#E3CFAE] text-[#0F2E22] text-xs font-semibold mb-6">
          <Shield className="w-3.5 h-3.5 text-[#0F2E22]" />
          <span>India’s Dedicated DPDP Act 2023 Compliance Assessment Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#0F2E22] tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Every Decision Starts With <span className="underline decoration-[#E3CFAE] decoration-wavy">Trust</span>.
        </h1>

        <p className="mt-4 text-lg sm:text-xl font-medium text-slate-600 max-w-2xl mx-auto">
          Trust isn't claimed. <span className="text-[#0F2E22] font-extrabold">It's forged.</span>
        </p>

        <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Empowering Indian startups, SMEs, and organizations to evaluate, prove, and maintain compliance with India's Digital Personal Data Protection (DPDP) Act 2023 through automated website scanning and the Evidence-based Trust Evaluation Framework (TEF).
        </p>

        {/* PRIMARY ACTIONS - EXACTLY TWO PRIMARY CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate('/scan')}
            icon={Globe}
          >
            TRY FREE WEBSITE SCAN
          </Button>

          <Button
            size="lg"
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => navigate('/signup')}
            icon={ArrowRight}
            iconPosition="right"
          >
            CREATE ORGANIZATION ACCOUNT
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-[#0F2E22]/10 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-xs text-slate-600 font-semibold">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>DPDP Act 2023 Aligned</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Trust Evaluation Framework (TEF)</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Automated Domain Signals</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Exportable Audit PDFs</span>
          </div>
        </div>
      </section>

      {/* Methodology: How TrustForge Works */}
      <section id="methodology" className="py-16 px-6 bg-[#F2EDE1]/70 border-y border-[#0F2E22]/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="beige" className="mb-2">Methodology</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2E22] tracking-tight">
              How TrustForge Works
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              A structured 4-step compliance lifecycle designed for Indian entities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: '1. Scan', desc: 'Inspect public Web Endpoints, SSL TLS certificates, and tracking scripts.', icon: Globe },
              { step: '02', title: '2. Assess', desc: 'Complete 12 TEF questionnaire steps with DPDP legal context guidance.', icon: FileText },
              { step: '03', title: '3. Analyze', desc: 'Execute TrustForge Analysis Engine to compute weighted posture scores.', icon: Cpu },
              { step: '04', title: '4. Improve', desc: 'Remediation roadmap to resolve gaps and export audit-ready reports.', icon: CheckCircle2 }
            ].map((m) => (
              <Card key={m.step} className="relative border-[#0F2E22]/15 bg-white">
                <div className="w-10 h-10 rounded-xl bg-[#0F2E22] text-[#F2EDE1] flex items-center justify-center font-bold text-sm mb-4">
                  {m.step}
                </div>
                <h3 className="font-bold text-base text-[#0F2E22] mb-2">{m.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Domain Scan Section */}
      <section id="scan-demo" className="py-16 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2E22] tracking-tight">
            Test Your Domain Baseline
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Run an instant preliminary check to inspect public DPDP compliance signals.
          </p>
        </div>

        <Card className="p-6 bg-white border-2 border-[#0F2E22]/15">
          <form onSubmit={handleDemoScan} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-[#0F2E22]/20 rounded-xl text-sm font-medium text-[#0F2E22] focus:outline-none focus:border-[#0F2E22]"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isScanning}
              icon={Search}
              className="w-full sm:w-auto"
            >
              Run Instant Check
            </Button>
          </form>

          {scanResultReady && (
            <div className="mt-6 pt-6 border-t border-[#0F2E22]/10 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F2EDE1] border border-[#E3CFAE]">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Domain Target</div>
                  <div className="text-sm font-bold text-[#0F2E22] font-mono">{demoUrl}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">TrustForge Score</div>
                  <div className="text-2xl font-black text-[#0F2E22] font-mono">89 / 100</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium">
                  <div className="font-bold">HTTPS & SSL</div>
                  <div className="text-[11px] text-emerald-700">TLS 1.3 Enforced (Pass)</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium">
                  <div className="font-bold">Privacy Statement</div>
                  <div className="text-[11px] text-emerald-700">Grievance Info Present</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
                  <div className="font-bold">Cookie Banner</div>
                  <div className="text-[11px] text-amber-700">Needs Mobile Opt-Out Fix</div>
                </div>
              </div>

              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/scan')}
                  icon={ChevronRight}
                  iconPosition="right"
                >
                  View Full Preliminary Scan Result Page
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* 6 TEF Pillars */}
      <section id="tef-framework" className="py-16 px-6 bg-[#0F2E22] text-[#F2EDE1]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full bg-[#184736] text-[#E3CFAE] text-xs font-mono font-bold">
              TEF FRAMEWORK
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F2EDE1] tracking-tight mt-3">
              The Six TEF Compliance Pillars
            </h2>
            <p className="text-xs sm:text-sm text-[#E3CFAE]/80 mt-1">
              Quantifiable parameters governing complete DPDP Act 2023 operational readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEF_PILLARS.map((pillar, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#184736]/60 border border-[#22634B] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#F2EDE1]">{pillar.name}</h3>
                  <span className="text-lg font-black text-emerald-400 font-mono">{pillar.score}%</span>
                </div>
                <p className="text-xs text-[#E3CFAE]/90 leading-relaxed">
                  {pillar.desc}
                </p>
                <div className="w-full bg-[#0B1E16] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pillar.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
