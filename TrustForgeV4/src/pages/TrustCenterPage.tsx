import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Globe, 
  TrendingUp,
  Building2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAssessment } from '../context/AssessmentContext';
import { useAuth } from '../context/AuthContext';

export const TrustCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { trustScore, findings, evidenceFiles } = useAssessment();
  const { organization } = useAuth();

  const openFindingsCount = findings.filter(f => f.status === 'open').length;

  return (
    <AppLayout
      title="Trust Center Dashboard"
      subtitle={`DPDP Compliance Posture — ${organization?.legalName || 'TechNova Solutions Pvt Ltd'}`}
    >
      <div className="space-y-8">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trust Score Card */}
          <Card className="lg:col-span-2 bg-[#0F2E22] text-[#F2EDE1] border border-[#184736] p-8 relative overflow-hidden flex flex-col justify-between shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
              <div>
                <div className="text-xs text-[#E3CFAE] font-mono font-bold uppercase tracking-wider">
                  OVERALL COMPLIANCE SCORE
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                  Trust Score Overview
                </h2>
                <p className="text-xs text-[#E3CFAE] mt-1.5 max-w-md leading-relaxed font-medium">
                  Evaluated across 6 TEF pillars based on submitted evidence and automated domain scans.
                </p>
              </div>

              <div className="flex items-center space-x-4 bg-[#184736] p-5 rounded-2xl border border-[#22634B] shrink-0">
                <div className="text-center">
                  <div className="text-[10px] text-[#E3CFAE] uppercase font-mono">
                    TEF Baseline
                  </div>
                  <div className="text-4xl font-black text-emerald-400 font-mono">
                    {trustScore.overallScore} <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>
                <div className="border-l border-[#22634B] pl-4">
                  <Badge variant="emerald" className="bg-emerald-400/20 text-emerald-300 border-emerald-400/40">
                    {trustScore.statusLabel}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#184736] flex flex-wrap items-center justify-between gap-4 z-10">
              <div className="flex items-center space-x-6 text-xs text-[#E3CFAE]/90 font-medium">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>12 / 12 Steps Audited</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{openFindingsCount} Active Gaps</span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/assessment')}
                icon={ArrowRight}
                iconPosition="right"
              >
                Continue Assessment Wizard
              </Button>
            </div>
          </Card>

          {/* Quick Status Breakdown Widget */}
          <Card className="p-6 bg-white border-2 border-[#0F2E22]/15 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#0F2E22] flex items-center justify-between">
                <span>Compliance Posture</span>
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              </h3>
              <p className="text-xs text-slate-500">
                Key compliance signals breakdown
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">Verified Evidence</span>
                <span className="font-bold text-[#0F2E22] font-mono">{evidenceFiles.length} Documents</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <span className="text-amber-900 font-medium">Attention Required</span>
                <span className="font-bold text-amber-900 font-mono">{openFindingsCount} Findings</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-emerald-900 font-medium">Identity Status</span>
                <span className="font-bold text-emerald-900 font-mono">GSTIN Verified</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/findings')}
            >
              View Findings & Remediation
            </Button>
          </Card>
        </div>

        {/* 6 TEF Pillars Progress Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0F2E22]">
              Trust Evaluation Framework (TEF) Pillars
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              6 Core Assessment Dimensions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trustScore.pillars.map((pillar) => (
              <Card key={pillar.id} className="p-5 bg-white border border-[#0F2E22]/15 hover:border-[#0F2E22]/40 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#0F2E22]">{pillar.name}</h4>
                  <span className="text-sm font-black text-[#0F2E22] font-mono">{pillar.score}%</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {pillar.description}
                </p>

                <div className="w-full bg-[#E4ECE8] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pillar.score}%`, backgroundColor: pillar.color }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Actionable Sections & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Strengths & Areas for Improvement */}
          <Card className="p-6 bg-white border-2 border-[#0F2E22]/15 space-y-4">
            <h3 className="text-sm font-bold text-[#0F2E22]">
              Posture Highlights
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Key Strength: Technical Encryption</span>
                </div>
                <p className="text-slate-700 leading-relaxed pl-5">
                  TLS 1.3 in transit and AES-256 at rest enforced across primary Mumbai AWS hosting endpoints.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Area Requiring Attention: Mobile Consent Banner</span>
                </div>
                <p className="text-slate-700 leading-relaxed pl-5">
                  Cookie opt-out interface on mobile web screens requires itemized affirmative action button fix.
                </p>
              </div>
            </div>
          </Card>

          {/* Assessment Activity Timeline */}
          <Card className="p-6 bg-white border-2 border-[#0F2E22]/15 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F2E22]">
                Recent Assessment Activity
              </h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3 text-xs">
              {[
                { action: 'SOC 2 Audit Report Uploaded', date: '10 mins ago', user: 'Rohan Sharma' },
                { action: 'Grievance Officer Contact Details Verified', date: '2 hours ago', user: 'System Auto-Audit' },
                { action: 'Public Web Domain Scan Executed', date: '1 day ago', user: 'Automated Scanner' },
                { action: 'GSTIN Registration Identity Verified', date: '3 days ago', user: 'Rohan Sharma' }
              ].map((act, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-[#0F2E22]">{act.action}</div>
                    <div className="text-[10px] text-slate-500">{act.user}</div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{act.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};
