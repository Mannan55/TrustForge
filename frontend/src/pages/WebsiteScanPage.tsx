import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ScorePill } from '../components/ui/ScorePill';
import { Badge, SeverityBadge } from '../components/ui/Badge';
import { ScannerAnimation } from '../components/common/ScannerAnimation';
import {
  Globe,
  Search,
  CheckCircle2,
  Shield,
  AlertTriangle,
  ArrowRight,
  FileText,
  Lock,
  UserPlus
} from 'lucide-react';

const SCAN_STAGES = [
  'Discovering website endpoints and DOM structure',
  'Analyzing privacy policy & terms notice accessibility',
  'Reviewing DPDP Section 5 consent signals & language options',
  'Checking cookie consent banners & third-party trackers',
  'Auditing Grievance Officer published contact details',
  'Checking SSL/TLS certificates & security headers (CERT-In guidance)',
  'Synthesizing DPDP compliance findings & evidence'
];

export const WebsiteScanPage: React.FC = () => {
  const { currentOrg } = useOrg();
  const { isAuthenticated, accountMode } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [targetUrl, setTargetUrl] = useState(currentOrg.website || 'technova.in');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageMessage, setScanStageMessage] = useState('');
  const [scanResult, setScanResult] = useState<null | {
    domain: string;
    score: number;
    status: 'Strong' | 'Needs Attention' | 'Moderate';
    findingCount: number;
    highPriorityCount: number;
    scannedDate: string;
  }>(null);

  const isPublicUser = !isAuthenticated || accountMode === 'PERSONAL';

  const startScan = () => {
    if (!targetUrl) return;
    setIsScanning(true);
    setScanResult(null);
    setScanProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);

      const stageIdx = Math.min(
        SCAN_STAGES.length - 1,
        Math.floor((progress / 100) * SCAN_STAGES.length)
      );
      setScanStageMessage(SCAN_STAGES[stageIdx]);

      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setScanResult({
          domain: targetUrl.replace(/^https?:\/\//, ''),
          score: 78,
          status: 'Needs Attention',
          findingCount: 4,
          highPriorityCount: 2,
          scannedDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        addToast('Website Check Complete', `Preliminary assessment generated for ${targetUrl}.`, 'success');
      }
    }, 180);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="border-b border-[#E3DDD0] pb-6 space-y-1">
        <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
          AUTOMATED SCANNER
        </span>
        <h2 className="text-2xl font-bold text-[#0F2E22]">Website Privacy & Security Check</h2>
        <p className="text-xs text-[#4A5750]">
          Evaluate any public web domain against the Indian TrustForge DPDP framework.
        </p>
      </div>

      {/* URL Input Box */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#0F2E22] uppercase tracking-wider">
            Enter Web Domain To Check
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Input
              placeholder="e.g. technova.in or https://example.co.in"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              leftIcon={<Globe className="w-4 h-4" />}
              className="flex-1"
              disabled={isScanning}
            />
            <Button
              variant="primary"
              onClick={startScan}
              isLoading={isScanning}
              leftIcon={<Search className="w-4 h-4" />}
              className="w-full sm:w-auto px-6"
            >
              Start Free Check
            </Button>
          </div>
          <p className="text-xs text-[#7A8981]">
            Scans public privacy policy accessibility, SSL encryption, and CERT-In security signals.
          </p>
        </div>

        {/* Scanner Animation */}
        {isScanning && (
          <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0]">
            <ScannerAnimation progress={scanProgress} stageMessage={scanStageMessage} />
          </div>
        )}
      </div>

      {/* SCAN RESULTS */}
      {scanResult && !isScanning && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="beige">PRELIMINARY ASSESSMENT</Badge>
                <span className="text-xs text-[#7A8981]">Checked at {scanResult.scannedDate}</span>
              </div>
              <h3 className="text-2xl font-bold text-[#0F2E22] mt-1">{scanResult.domain}</h3>
            </div>

            {!isPublicUser ? (
              <div className="flex items-center gap-3">
                <Button variant="primary" size="md" onClick={() => navigate('/findings')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Review Findings
                </Button>
                <Button variant="outline" size="md" onClick={() => navigate('/evidence')}>
                  View Evidence Vault
                </Button>
              </div>
            ) : (
              <Button variant="primary" size="md" onClick={() => navigate('/signup')} rightIcon={<UserPlus className="w-4 h-4" />}>
                Create Account for Full Report
              </Button>
            )}
          </div>

          {/* Posture Score & High-Level Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-3">
              <span className="text-xs font-bold text-[#7A8981] uppercase tracking-wider">
                Trust Score
              </span>
              <ScorePill score={scanResult.score} statusLabel={scanResult.status} size="md" />
              <p className="text-xs text-[#4A5750]">
                Preliminary automated rating evaluated against public privacy notice signals.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-3">
              <span className="text-xs font-bold text-[#7A8981] uppercase tracking-wider">
                Preliminary Observations
              </span>
              <div className="space-y-1.5 text-xs text-[#4A5750]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                  <span>Privacy Policy page detected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                  <span>TLS 1.3 encryption active</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#9A3412] shrink-0" />
                  <span>Notice language toggle pending</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-3">
              <span className="text-xs font-bold text-[#7A8981] uppercase tracking-wider">
                Statutory Disclaimer
              </span>
              <p className="text-[11px] text-[#7A8981] leading-relaxed">
                Automated public scans evaluate high-level web signals only. Statutory DPDP compliance requires verified organization data lifecycle audits.
              </p>
            </div>
          </div>

          {/* Public User Conversion Banner */}
          {isPublicUser && (
            <div className="p-6 rounded-2xl bg-[#0F2E22] text-[#F2EDE1] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#E3CFAE]">Want the complete DPDP assessment?</h4>
                <p className="text-xs text-[#D5E0DA]">
                  Unlock detailed legal gap findings, evidence document verification, and official PDF audit reports.
                </p>
              </div>
              <Button variant="secondary" size="md" onClick={() => navigate('/signup')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Organization Account
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
