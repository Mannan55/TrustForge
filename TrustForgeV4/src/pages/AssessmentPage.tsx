import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Shield, 
  Building2, 
  Globe, 
  FileText, 
  Lock, 
  Check, 
  Cpu, 
  Upload,
  AlertTriangle
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { ProgressBar } from '../components/common/ProgressBar';
import { LegalRationale } from '../components/common/LegalRationale';
import { FileUploader } from '../components/common/FileUploader';
import { TrustForgeAnalysisEngine } from '../components/scanner/TrustForgeAnalysisEngine';
import { useAssessment } from '../context/AssessmentContext';
import { 
  ASSESSMENT_STEPS, 
  PERSONAL_DATA_CATEGORIES, 
  SUPPORTED_LANGUAGES, 
  DETECTED_INTEGRATIONS_PRESETS 
} from '../data/dpdpFramework';

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentStep, 
    nextStep, 
    prevStep, 
    goToStep, 
    answers, 
    setAnswer, 
    evidenceFiles, 
    uploadEvidence, 
    removeEvidence,
    isAnalyzing,
    analysisStage,
    runAnalysisEngine,
    trustScore
  } = useAssessment();

  const currentStepData = ASSESSMENT_STEPS[currentStep - 1];

  const handleStartAnalysis = () => {
    runAnalysisEngine(() => {
      goToStep(12); // Go to Assessment Result
    });
  };

  return (
    <AppLayout
      title="DPDP Assessment Wizard"
      subtitle="12-Pillar Trust Evaluation Framework (TEF) Baseline Audit"
    >
      <div className="space-y-6">
        {/* Step Indicator Header */}
        <div className="bg-white p-6 rounded-2xl border-2 border-[#0F2E22]/15 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">
                Step {currentStep} of 12
              </div>
              <h2 className="text-xl font-extrabold text-[#0F2E22] tracking-tight">
                {currentStepData.title}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Quick Nav:</span>
              <select
                value={currentStep}
                onChange={(e) => goToStep(Number(e.target.value))}
                className="bg-slate-50 border border-[#0F2E22]/20 rounded-xl text-xs font-bold text-[#0F2E22] px-3 py-1.5 focus:outline-none"
              >
                {ASSESSMENT_STEPS.map((s) => (
                  <option key={s.id} value={s.id}>
                    Step {s.id}: {s.shortTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ProgressBar
            currentStep={currentStep}
            totalSteps={12}
            stepTitle={currentStepData.title}
          />
        </div>

        {/* IF CURRENTLY RUNNING ANALYSIS ENGINE */}
        {isAnalyzing ? (
          <TrustForgeAnalysisEngine currentStage={analysisStage} />
        ) : (
          /* REGULAR WIZARD STEP CONTENT */
          <Card className="p-6 bg-white border-2 border-[#0F2E22]/15 space-y-6">
            {/* Step Description & Educational Context */}
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {currentStepData.description}
              </p>

              {currentStepData.whyWeAsk && (
                <LegalRationale
                  whyWeAsk={currentStepData.whyWeAsk}
                  dpdpContext={currentStepData.dpdpContext}
                  dpdpSectionRef={currentStepData.dpdpSectionRef}
                />
              )}
            </div>

            {/* STEP 1: ORG CONTEXT RESTORED PROTOTYPE INPUTS */}
            {currentStep === 1 && (
              <div className="space-y-4 border-t border-[#0F2E22]/10 pt-4">
                <Input
                  label="Legal Entity Name"
                  value={answers.legalName || 'TechNova Solutions Pvt Ltd'}
                  onChange={(e) => setAnswer('legalName', e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="MCA Corporate ID (CIN)"
                    value={answers.cin || 'U72900MH2021PTC354912'}
                    onChange={(e) => setAnswer('cin', e.target.value)}
                  />
                  <Input
                    label="GSTIN Identification"
                    value={answers.gstin || '27AABCT3549R1ZM'}
                    onChange={(e) => setAnswer('gstin', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Designated Grievance Officer Name"
                    value={answers.grievanceOfficerName || 'Rohan Sharma'}
                    onChange={(e) => setAnswer('grievanceOfficerName', e.target.value)}
                  />
                  <Input
                    label="Grievance Officer Email"
                    value={answers.grievanceOfficerEmail || 'grievance@technova.in'}
                    onChange={(e) => setAnswer('grievanceOfficerEmail', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: DATA PROCESSING CHANNELS */}
            {currentStep === 2 && (
              <div className="space-y-4 border-t border-[#0F2E22]/10 pt-4">
                <Input
                  label="Primary Web Domain"
                  value={answers.primaryDomain || 'https://www.technova.in'}
                  onChange={(e) => setAnswer('primaryDomain', e.target.value)}
                />
                <Input
                  label="Public Web Domain & Endpoint Configuration"
                  value={answers.publicDomain || 'https://app.technova.in (TLS 1.3)'}
                  onChange={(e) => setAnswer('publicDomain', e.target.value)}
                />

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0F2E22]">
                    Data Collection Touchpoints
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {['Web Application Forms', 'Mobile App API Endpoints', 'Payment Gateway Callbacks', 'Customer Support Chat Widgets'].map((ch, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>{ch}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PERSONAL DATA CATEGORIES (INTERACTIVE CARDS) */}
            {currentStep === 3 && (
              <div className="space-y-4 border-t border-[#0F2E22]/10 pt-4">
                <label className="block text-xs font-bold text-[#0F2E22]">
                  Select Personal Data Categories Processed in India
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PERSONAL_DATA_CATEGORIES.map((cat) => {
                    const selectedList: string[] = answers.dataCategories || [];
                    const isSelected = selectedList.includes(cat.id);

                    const toggleCat = () => {
                      const updated = isSelected
                        ? selectedList.filter(id => id !== cat.id)
                        : [...selectedList, cat.id];
                      setAnswer('dataCategories', updated);
                    };

                    return (
                      <div
                        key={cat.id}
                        onClick={toggleCat}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0F2E22] bg-[#E6F4EE] text-[#0F2E22]'
                            : 'border-[#0F2E22]/15 bg-white hover:border-[#0F2E22]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-bold text-xs">{cat.name}</h4>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-[#0F2E22] text-[#F2EDE1]' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 mb-2">{cat.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {cat.items.map((item, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white/80 border border-[#0F2E22]/10 text-[10px] text-slate-700">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: PURPOSE OF PROCESSING */}
            {currentStep === 4 && (
              <div className="space-y-4 border-t border-[#0F2E22]/10 pt-4">
                <label className="block text-xs font-bold text-[#0F2E22]">
                  Specified Lawful Purposes (DPDP Section 4)
                </label>
                <div className="space-y-2 text-xs">
                  {['Service Fulfillment & User Account Provisioning', 'Payment Processing & Invoice Issuance', 'Security Analytics & Fraud Prevention', 'Mandatory Regulatory Compliance Reporting'].map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-medium">
                      <span>{p}</span>
                      <Badge variant="emerald">Specified & Notice Provided</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: NOTICE & CONSENT LANGUAGES */}
            {currentStep === 5 && (
              <div className="space-y-4 border-t border-[#0F2E22]/10 pt-4">
                <label className="block text-xs font-bold text-[#0F2E22]">
                  Select Supported Notice & Consent Languages (8th Schedule Indian Languages)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const selectedLangs: string[] = answers.languages || ['en', 'hi'];
                    const isSelected = selectedLangs.includes(lang.code);

                    const toggleLang = () => {
                      const updated = isSelected
                        ? selectedLangs.filter(c => c !== lang.code)
                        : [...selectedLangs, lang.code];
                      setAnswer('languages', updated);
                    };

                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={toggleLang}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0F2E22] bg-[#E6F4EE] text-[#0F2E22] font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="text-sm">{lang.native}</div>
                        <div className="text-[11px] text-slate-500">{lang.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 6: DATA RETENTION & ERASURE */}
            {currentStep === 6 && (
              <div className="space-y-4 border-t border-[#0F2E22]/10 pt-4 text-xs">
                <Input
                  label="Inactive Account Data Erasure Schedule (Days)"
                  type="number"
                  value={answers.retentionDays || 180}
                  onChange={(e) => setAnswer('retentionDays', e.target.value)}
                />
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="font-bold">DPDP Section 8(7) Erasure Mandate</div>
                  <p>
                    Data Fiduciaries must erase personal data upon purpose completion unless required by statutory tax or financial retention laws.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 7: DATA PRINCIPAL RIGHTS */}
            {currentStep === 7 && (
              <div className="space-y-4 border-t border-[#0F2E22]/10 pt-4 text-xs">
                <label className="block font-bold text-[#0F2E22]">
                  Available Data Principal Right Fulfillment Workflows
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Right to Access & Summary', 'Right to Correction & Updating', 'Right to Erasure / Deletion', 'Right to Grievance Redressal'].map((r, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 8: SECURITY CONTROLS */}
            {currentStep === 8 && (
              <div className="space-y-4 border-t border-[#0F2E22]/10 pt-4">
                <label className="block text-xs font-bold text-[#0F2E22]">
                  Technical Encryption & CERT-In Incident Response Controls
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <Card className="p-4 bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="font-bold text-emerald-950">Encryption at Rest</div>
                    <div className="text-xs text-emerald-800 font-mono font-bold">AES-256 Verified</div>
                    <div className="text-[10px] text-emerald-700">AWS KMS Key Management</div>
                  </Card>

                  <Card className="p-4 bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="font-bold text-emerald-950">Encryption in Transit</div>
                    <div className="text-xs text-emerald-800 font-mono font-bold">TLS 1.3 Enforced</div>
                    <div className="text-[10px] text-emerald-700">HSTS Enabled Header</div>
                  </Card>

                  <Card className="p-4 bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="font-bold text-emerald-950">Backup Frequency</div>
                    <div className="text-xs text-emerald-800 font-mono font-bold">Daily Snapshot</div>
                    <div className="text-[10px] text-emerald-700">Multi-Region Redundancy</div>
                  </Card>
                </div>
              </div>
            )}

            {/* STEP 9: THIRD-PARTY PROCESSORS */}
            {currentStep === 9 && (
              <div className="space-y-4 border-t border-[#0F2E22]/10 pt-4 text-xs">
                <label className="block font-bold text-[#0F2E22]">
                  Third-Party Data Processors & Indian Cloud Residency
                </label>

                <div className="space-y-2">
                  {DETECTED_INTEGRATIONS_PRESETS.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#0F2E22]">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.details}</div>
                      </div>
                      <Badge variant="emerald">DPA Executed</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 10: POLICIES & EVIDENCE UPLOADER */}
            {currentStep === 10 && (
              <div className="space-y-4 border-t border-[#0F2E22]/10 pt-4">
                <FileUploader
                  onUpload={uploadEvidence}
                  files={evidenceFiles}
                  onRemove={removeEvidence}
                  category="Assessment Evidence"
                />
              </div>
            )}

            {/* STEP 11: REVIEW & VERIFICATION */}
            {currentStep === 11 && (
              <div className="space-y-6 border-t border-[#0F2E22]/10 pt-4">
                <div className="p-4 rounded-xl bg-[#F2EDE1] border border-[#E3CFAE] space-y-3 text-xs">
                  <h3 className="font-bold text-[#0F2E22] text-sm">
                    Assessment Summary Review
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    <div><span className="font-bold">Organization:</span> {answers.legalName || 'TechNova Solutions Pvt Ltd'}</div>
                    <div><span className="font-bold">CIN:</span> {answers.cin || 'U72900MH2021PTC354912'}</div>
                    <div><span className="font-bold">Grievance Officer:</span> {answers.grievanceOfficerName || 'Rohan Sharma'}</div>
                    <div><span className="font-bold">Uploaded Evidence:</span> {evidenceFiles.length} File(s)</div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0F2E22] text-[#F2EDE1] text-center space-y-4">
                  <h3 className="text-base font-bold text-[#F2EDE1]">
                    Ready to Execute Baseline Evaluation
                  </h3>
                  <p className="text-xs text-[#E3CFAE]/80 max-w-md mx-auto">
                    Click below to trigger the TrustForge Analysis Engine to process your responses and compute your weighted posture score.
                  </p>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handleStartAnalysis}
                    icon={Cpu}
                  >
                    Run AI Analysis Engine
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 12: ASSESSMENT RESULT */}
            {currentStep === 12 && (
              <div className="space-y-6 border-t border-[#0F2E22]/10 pt-4">
                <Card className="bg-[#0F2E22] text-[#F2EDE1] border border-[#184736] p-8 text-center space-y-4">
                  <Badge variant="emerald" className="bg-emerald-400/20 text-emerald-300">
                    TEF Baseline Assessment Complete
                  </Badge>
                  <div>
                    <div className="text-xs text-[#E3CFAE] uppercase font-mono">
                      Calculated Trust Score
                    </div>
                    <div className="text-5xl font-black text-emerald-400 font-mono mt-1">
                      {trustScore.overallScore} <span className="text-sm text-slate-400">/ 100</span>
                    </div>
                    <div className="text-sm font-semibold text-[#F2EDE1] mt-2">
                      Status: {trustScore.statusLabel}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/findings')}
                    >
                      View Actionable Findings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-500 text-emerald-300 hover:bg-emerald-950"
                      onClick={() => navigate('/reports')}
                    >
                      Generate Audit Report
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* NAVIGATION BUTTONS */}
            {!isAnalyzing && currentStep < 12 && (
              <div className="flex items-center justify-between pt-6 border-t border-[#0F2E22]/10">
                <Button
                  variant="outline"
                  disabled={currentStep === 1}
                  onClick={prevStep}
                  icon={ArrowLeft}
                >
                  Previous Step
                </Button>

                {currentStep === 11 ? (
                  <Button
                    variant="secondary"
                    onClick={handleStartAnalysis}
                    icon={Cpu}
                  >
                    Run AI Analysis Engine
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={nextStep}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Next Step
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
};
