import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, ShieldAlert, CheckCircle2, ArrowRight, AlertTriangle, Lock } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAssessment } from '../context/AssessmentContext';

export const WebsiteScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { runWebsiteScan, scanResult } = useAssessment();
  const [url, setUrl] = useState('https://www.technova.in');
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsScanning(true);
    setTimeout(async () => {
      await runWebsiteScan(url);
      setIsScanning(false);
      setScanned(true);
    }, 1500);
  };

  return (
    <PublicLayout>
      <div className="py-12 px-6 max-w-4xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <Badge variant="emerald">Public Preliminary Check</Badge>
          <h1 className="text-3xl font-extrabold text-[#0F2E22] tracking-tight">
            Free Public Website Scan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Audit public web endpoints, SSL TLS configurations, and privacy notice accessibility against Indian DPDP Act 2023 requirements.
          </p>
        </div>

        {/* Input Card */}
        <Card className="p-6 bg-white border-2 border-[#0F2E22]/15">
          <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-[#0F2E22]/20 rounded-xl text-sm font-medium text-[#0F2E22] focus:outline-none focus:border-[#0F2E22]"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isScanning}
              icon={Search}
            >
              Run Scan
            </Button>
          </form>
          <p className="text-[11px] text-slate-400 mt-2 text-center sm:text-left">
            No login or credentials required for public domain preliminary checks.
          </p>
        </Card>

        {/* Preliminary Result Section */}
        {scanned && scanResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Score Banner */}
            <Card className="bg-[#0F2E22] text-[#F2EDE1] border border-[#184736] p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs text-[#E3CFAE] font-mono uppercase tracking-wider">
                    Automated Preliminary Assessment
                  </div>
                  <h2 className="text-xl font-bold text-[#F2EDE1] font-mono">
                    {scanResult.url}
                  </h2>
                  <div className="text-xs text-[#E3CFAE]/70">
                    Scan Date: {scanResult.scanDate}
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-[#184736] p-4 rounded-2xl border border-[#22634B]">
                  <div className="text-center">
                    <div className="text-[10px] text-[#E3CFAE] uppercase font-mono">
                      TrustForge Score
                    </div>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                      {scanResult.trustScore} <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div className="border-l border-[#22634B] pl-4">
                    <Badge variant="emerald" className="bg-emerald-400/20 text-emerald-300 border-emerald-400/40">
                      {scanResult.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* High-Level Observations (1-2 important observations) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5 bg-white border border-[#0F2E22]/15 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#0F2E22]">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>Technical Security Signals</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>HTTPS enforced with TLS 1.3 protocol.</li>
                  <li>SSL Certificate valid (issued by DigiCert CA).</li>
                </ul>
              </Card>

              <Card className="p-5 bg-white border border-[#0F2E22]/15 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#0F2E22]">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Notice & Tracking Signals</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>Privacy statement located with Grievance Officer email.</li>
                  <li>Tracking scripts detected; mobile opt-out interface requires audit.</li>
                </ul>
              </Card>
            </div>

            {/* Legal Disclaimer Box */}
            <div className="p-4 rounded-xl bg-[#F2EDE1] border border-[#E3CFAE] text-xs text-[#0F2E22] leading-relaxed">
              <span className="font-bold">Legal Disclaimer:</span> This is an automated preliminary assessment based on publicly visible web signals. TrustForge is a compliance assessment tool, not a legal certification authority.
            </div>

            {/* CTA to Register Organization */}
            <Card className="p-6 bg-white border-2 border-[#0F2E22]/20 text-center space-y-4">
              <h3 className="text-base font-bold text-[#0F2E22]">
                Unlock Full DPDP Assessment & Gap Remediation Roadmap
              </h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto">
                Create a free Organization Account to upload evidence, conduct full 12-pillar assessments, and generate audit-ready reports.
              </p>
              <div className="pt-2">
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => navigate('/signup')}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Create Organization Account
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};
