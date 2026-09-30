import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, ShieldAlert, CheckCircle2, ArrowRight, AlertTriangle, Lock, X, Info, Activity } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAssessment } from '../context/AssessmentContext';

export const WebsiteScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { runWebsiteScan, scanResult, backendAvailable, isDemoMode, rawScanData } = useAssessment();
  const [url, setUrl] = useState('https://www.technova.in');
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setScanError(null);
    setIsScanning(true);
    try {
      await runWebsiteScan(url);
      setScanned(true);
    } catch (err) {
      setScanError('Scan failed. Please check the URL and try again.');
    } finally {
      setIsScanning(false);
    }
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
            Audit public web endpoints, SSL/TLS configurations, and privacy notice accessibility against Indian DPDP Act 2023 requirements.
          </p>
        </div>

        {/* Backend Status Indicator */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium ${
          backendAvailable
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border border-amber-200 text-amber-800'
        }`}>
          <Activity className="w-3.5 h-3.5" />
          {backendAvailable
            ? 'Live scan engine connected — performing real analysis'
            : 'Backend offline — demo mode active (start backend for real scans)'}
          {isDemoMode && scanned && (
            <span className="ml-auto font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded">DEMO RESULT</span>
          )}
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
            Only publicly available web signals are analysed. This is a compliance tool, not a penetration testing system.
          </p>
        </Card>

        {/* Error State */}
        {scanError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            <X className="w-4 h-4 shrink-0" />
            {scanError}
          </div>
        )}

        {/* Preliminary Result Section */}
        {scanned && scanResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Score Banner */}
            <Card className="bg-[#0F2E22] text-[#F2EDE1] border border-[#184736] p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs text-[#E3CFAE] font-mono uppercase tracking-wider">
                    {isDemoMode ? 'Demo Assessment' : 'Automated Preliminary Assessment'}
                  </div>
                  <h2 className="text-xl font-bold text-[#F2EDE1] font-mono">
                    {scanResult.url}
                  </h2>
                  <div className="text-xs text-[#E3CFAE]/70">
                    Scan Date: {scanResult.scanDate}
                    {rawScanData && (
                      <span className="ml-2 font-mono text-[10px]">
                        ({rawScanData.scan_duration_ms}ms)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-[#184736] p-4 rounded-2xl border border-[#22634B]">
                  <div className="text-center">
                    <div className="text-[10px] text-[#E3CFAE] uppercase font-mono">
                      Preliminary Score
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

            {/* Real Scan Signals (when backend available) */}
            {rawScanData && !isDemoMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* HTTPS */}
                <Card className="p-5 bg-white border border-[#0F2E22]/15 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#0F2E22]">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    <span>HTTPS & Security</span>
                    <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-mono ${
                      rawScanData.https.has_https
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {rawScanData.https.has_https ? 'HTTPS ✓' : 'HTTP Only ✗'}
                    </span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li className="flex items-center gap-1.5">
                      {rawScanData.https.hsts_present
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      HSTS header: {rawScanData.https.hsts_present ? 'Present' : 'Absent'}
                    </li>
                    {rawScanData.security_headers.content_security_policy && (
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Content-Security-Policy detected
                      </li>
                    )}
                  </ul>
                </Card>

                {/* Privacy Policy */}
                <Card className="p-5 bg-white border border-[#0F2E22]/15 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#0F2E22]">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Notice & Tracking Signals</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li className="flex items-center gap-1.5">
                      {rawScanData.privacy_policy.found
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      Privacy policy: {rawScanData.privacy_policy.found ? 'Detected' : 'Not found'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      {rawScanData.privacy_policy.has_grievance_contact
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      Grievance contact: {rawScanData.privacy_policy.has_grievance_contact ? 'Detected' : 'Not detected'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      {rawScanData.cookie_consent.has_reject_button
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      Consent opt-out: {rawScanData.cookie_consent.has_reject_button ? 'Detected' : 'Not clearly detected'}
                    </li>
                    {rawScanData.trackers.filter(t => t.detected).length > 0 && (
                      <li className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-500" />
                        Trackers detected: {rawScanData.trackers.filter(t => t.detected).map(t => t.name).join(', ')}
                      </li>
                    )}
                  </ul>
                </Card>
              </div>
            )}

            {/* Demo fallback signals */}
            {isDemoMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 bg-white border border-[#0F2E22]/15 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#0F2E22]">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    <span>Technical Security Signals</span>
                    <span className="ml-auto text-[10px] font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded">DEMO</span>
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
                    <span className="ml-auto text-[10px] font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded">DEMO</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Privacy statement located with Grievance Officer email.</li>
                    <li>Tracking scripts detected; mobile opt-out interface requires audit.</li>
                  </ul>
                </Card>
              </div>
            )}

            {/* Real Observations */}
            {rawScanData && !isDemoMode && rawScanData.observations.length > 0 && (
              <Card className="p-5 bg-white border border-[#0F2E22]/15 space-y-3">
                <div className="text-xs font-bold text-[#0F2E22]">Scan Observations</div>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  {rawScanData.observations.map((obs, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="mt-0.5 text-emerald-600">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Legal Disclaimer Box */}
            <div className="p-4 rounded-xl bg-[#F2EDE1] border border-[#E3CFAE] text-xs text-[#0F2E22] leading-relaxed">
              <span className="font-bold">Legal Disclaimer:</span> This is an automated preliminary assessment based on publicly visible web signals.
              TrustForge is a compliance readiness assessment tool, not a legal certification authority.
              {isDemoMode && <span className="ml-2 font-bold text-amber-700">[DEMO MODE — results are illustrative only]</span>}
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
