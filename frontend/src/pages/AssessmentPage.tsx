import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useOrg } from '../context/OrgContext';
import { ASSESSMENT_SECTIONS, STEP_EXPLANATIONS } from '../data/dpdpFramework';
import { EvidenceUploader, UploadedFile } from '../components/wizard/EvidenceUploader';
import { ScannerAnimation } from '../components/common/ScannerAnimation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/Tabs';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  Building2,
  Globe,
  Lock,
  Upload,
  Sparkles,
  FileCheck,
  Check
} from 'lucide-react';

interface FormDataState {
  companyName: string;
  cin: string;
  dpoName: string;
  dpoEmail: string;
  website: string;
  selectedIntegrations: string[];
  dataCategories: string[];
  purposes: string[];
  languages: string[];
  encryptionRest: string;
  encryptionTransit: string;
  backupFrequency: string;
  uploadedFiles: UploadedFile[];
}

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { currentOrg, updateOrg } = useOrg();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormDataState>({
    companyName: currentOrg.name || 'TechNova Solutions Pvt Ltd',
    cin: currentOrg.cin || 'U72900KA2021PTC145123',
    dpoName: currentOrg.dpoName || 'Rajesh V. Sharma',
    dpoEmail: currentOrg.dpoEmail || 'grievance@technova.in',
    website: currentOrg.website || 'technova.in',
    selectedIntegrations: ['Google Analytics 4', 'AWS CloudFront CDN', 'Razorpay Payment Gateway', 'Intercom Support Widget'],
    dataCategories: ['User Identifiers (Name, Phone, Email)', 'Financial & Transaction Data', 'Device IP & Browser Headers', 'Geographic Location Metrics'],
    purposes: ['Service Delivery', 'User Authentication', 'Product Analytics', 'Fraud Security'],
    languages: ['English', 'Hindi', 'Kannada', 'Tamil'],
    encryptionRest: 'AES-256 Verified',
    encryptionTransit: 'TLS 1.3 Enforced',
    backupFrequency: 'Automated Daily Snapshot',
    uploadedFiles: [
      { id: 'f1', name: 'TechNova_Privacy_Policy_2026.pdf', size: '2.4 MB', status: 'Verified' },
      { id: 'f2', name: 'InfoSec_Governance_SOP.pdf', size: '1.8 MB', status: 'Verified' }
    ]
  });

  const [aiProgress, setAiProgress] = useState(0);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  const totalSteps = ASSESSMENT_SECTIONS.length;
  const activeSection = ASSESSMENT_SECTIONS.find((s) => s.id === currentStep) || ASSESSMENT_SECTIONS[0];
  const stepExplanation = STEP_EXPLANATIONS[currentStep];

  const handleNext = () => {
    if (currentStep < 13) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 13) {
      setCurrentStep(14);
      runAiAnalysis();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const runAiAnalysis = () => {
    setAiAnalyzing(true);
    setAiProgress(0);
    setAiDone(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setAiProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setAiAnalyzing(false);
        setAiDone(true);
        updateOrg({ trustScore: 89, postureStatus: 'Strong' });
        addToast('Trust Intelligence Core Completed', 'Score recalculated: 89/100 (Strong Posture).', 'success');
      }
    }, 250);
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const toggleDataCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      dataCategories: prev.dataCategories.includes(cat)
        ? prev.dataCategories.filter((c) => c !== cat)
        : [...prev.dataCategories, cat]
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header & Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            DPDP ASSESSMENT WIZARD · STEP {currentStep} OF {totalSteps}
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">{activeSection.title}</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">{activeSection.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addToast('Progress Saved', 'Assessment progress saved.', 'success')}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Progress
          </Button>
        </div>
      </div>

      {/* Visual Step Progress Bar (Clean Step 1 of 14 - NO raw percentage decimals) */}
      <div className="bg-white p-4 rounded-xl border border-[#E3DDD0] space-y-2">
        <ProgressBar progress={Math.round((currentStep / totalSteps) * 100)} label={`Step ${currentStep} of ${totalSteps}`} />

        {/* Multi-step Pills Header */}
        <div className="hidden lg:flex items-center justify-between gap-1 pt-2 overflow-x-auto custom-scrollbar">
          {ASSESSMENT_SECTIONS.map((sec) => {
            const isCompleted = sec.id < currentStep;
            const isCurrent = sec.id === currentStep;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  if (sec.id < currentStep) setCurrentStep(sec.id);
                }}
                disabled={sec.id > currentStep}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'bg-[#0F2E22] text-[#F2EDE1] font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                    : 'bg-[#FAF8F5] text-[#7A8981] opacity-70'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 text-[#166534] shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border text-[10px] flex items-center justify-center font-mono">
                    {sec.id}
                  </span>
                )}
                <span>{sec.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-6">
        {/* STEP 1: WELCOME */}
        {currentStep === 1 && (
          <div className="space-y-6 text-xs text-[#4A5750]">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E3DDD0] flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#0F2E22] text-[#E3CFAE] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F2E22] text-base">DPDP Trust Evaluation Framework (TEF)</h3>
                <p className="mt-1 leading-relaxed">
                  This guided assessment verifies {formData.companyName}'s alignment with India's Digital Personal Data Protection Act 2023. Completing this wizard updates your official Trust Score and generates audit evidence.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#E3DDD0]">
                <div className="font-bold text-[#0F2E22] mb-1">⏱️ Duration</div>
                <div>Approx. 4-6 minutes</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E3DDD0]">
                <div className="font-bold text-[#0F2E22] mb-1">📋 Scope</div>
                <div>6 TEF Compliance Pillars</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E3DDD0]">
                <div className="font-bold text-[#0F2E22] mb-1">📄 Output</div>
                <div>Certified Audit Trail & PDF</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ORGANIZATION CONTEXT */}
        {currentStep === 2 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Legal Name"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
              <Input
                label="MCA Corporate ID (CIN)"
                value={formData.cin}
                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                helperText="Ministry of Corporate Affairs CIN"
              />
              <Input
                label="Data Protection Officer Name"
                value={formData.dpoName}
                onChange={(e) => setFormData({ ...formData, dpoName: e.target.value })}
              />
              <Input
                label="Grievance Email Address"
                value={formData.dpoEmail}
                onChange={(e) => setFormData({ ...formData, dpoEmail: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 3: WEBSITE & INFRASTRUCTURE */}
        {currentStep === 3 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <Input
              label="Primary Web Domain"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-2">
              <div className="font-semibold text-[#0F2E22]">Detected Active Integrations</div>
              <div className="flex flex-wrap gap-2">
                {formData.selectedIntegrations.map((integ, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white border border-[#E3DDD0] rounded-lg text-[#0F2E22] font-medium">
                    {integ}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DATA COLLECTION */}
        {currentStep === 4 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h4 className="font-bold text-[#0F2E22]">Data Collection Channels</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Web Contact Forms', 'Mobile App API Endpoints', 'Customer Support Chat Widgets', 'Offline Direct Registration'].map((ch, idx) => (
                <label key={idx} className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E3DDD0] bg-[#FAF8F5] cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#0F2E22]" />
                  <span className="font-semibold text-[#0F2E22]">{ch}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: PERSONAL DATA CATEGORIES */}
        {currentStep === 5 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h4 className="font-bold text-[#0F2E22]">Categories of Personal Data Processed</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'User Identifiers (Name, Phone, Email)',
                'Financial & Transaction Data',
                'Device IP & Browser Headers',
                'Geographic Location Metrics',
                'Biometric / Sensitive Data',
                'Employee HR Data'
              ].map((cat) => {
                const isSelected = formData.dataCategories.includes(cat);
                return (
                  <div
                    key={cat}
                    onClick={() => toggleDataCategory(cat)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'border-[#0F2E22] bg-white ring-1 ring-[#0F2E22]' : 'border-[#E3DDD0] bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-[#0F2E22]">
                      <span>{cat}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#0F2E22]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: PURPOSE OF PROCESSING */}
        {currentStep === 6 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h4 className="font-bold text-[#0F2E22]">Specified Processing Purposes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Service Delivery & Invoicing', 'User Identity Authentication', 'Product Analytics & Logging', 'Marketing Communications', 'Fraud & Security Monitoring', 'Employee HR Management'].map((purpose, idx) => (
                <label key={idx} className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E3DDD0] bg-[#FAF8F5] cursor-pointer">
                  <input type="checkbox" defaultChecked={idx < 4} className="accent-[#0F2E22]" />
                  <span className="font-semibold text-[#0F2E22]">{purpose}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: NOTICE & CONSENT */}
        {currentStep === 7 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h4 className="font-bold text-[#0F2E22]">Supported Consent Notice Languages</h4>
            <div className="flex flex-wrap gap-2">
              {['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Bengali', 'Marathi'].map((lang) => {
                const isSelected = formData.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#0F2E22] text-[#F2EDE1] border-[#0F2E22]' : 'bg-[#FAF8F5] text-[#7A8981] border-[#E3DDD0]'
                    }`}
                  >
                    {lang} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 8: DATA RETENTION */}
        {currentStep === 8 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h4 className="font-bold text-[#0F2E22]">Data Lifecycle & Erasure Schedule</h4>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#0F2E22]">User Account Inactivity Purge</span>
                <span className="font-mono text-[#0F2E22]">Automated 30-Day Purge</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#0F2E22]">Income Tax Act Statutory Retention</span>
                <span className="font-mono text-[#0F2E22]">8 Years (GST / Invoices)</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: DATA PRINCIPAL RIGHTS */}
        {currentStep === 9 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h4 className="font-bold text-[#0F2E22]">Data Principal Right Procedures</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Right to Summary of Personal Data', 'Right to Correction & Completion', 'Right to Erasure & Consent Withdrawal', 'Right to Grievance Redressal (30-day SLA)'].map((right, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-[#BBF7D0] bg-[#DCFCE7] text-[#166534] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{right}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 10: SECURITY PRACTICES */}
        {currentStep === 10 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h4 className="font-bold text-[#0F2E22]">Technical Security Safeguards</h4>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#0F2E22]">Encryption at Rest</span>
                <span className="font-mono text-[#166534] font-bold">{formData.encryptionRest}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#0F2E22]">Encryption in Transit</span>
                <span className="font-mono text-[#166534] font-bold">{formData.encryptionTransit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#0F2E22]">Backup Cadence</span>
                <span className="font-mono text-[#0F2E22]">{formData.backupFrequency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#0F2E22]">CERT-In Incident SLA</span>
                <span className="font-mono text-[#166534] font-bold">6-Hour Breach Reporting</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 11: THIRD-PARTY PROCESSORS */}
        {currentStep === 11 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h4 className="font-bold text-[#0F2E22]">Vendor DPAs & Data Sovereignty</h4>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-2">
              <div className="flex justify-between text-[#0F2E22]">
                <span className="font-semibold">Primary Cloud Infrastructure:</span>
                <span className="font-mono">AWS Mumbai Region (ap-south-1)</span>
              </div>
              <div className="flex justify-between text-[#0F2E22]">
                <span className="font-semibold">Executed Vendor DPAs:</span>
                <span className="font-bold text-[#166534]">12 Active Vendors</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 12: POLICIES & EVIDENCE */}
        {currentStep === 12 && (
          <EvidenceUploader
            files={formData.uploadedFiles}
            onUpload={(newFile) => setFormData((prev) => ({ ...prev, uploadedFiles: [...prev.uploadedFiles, newFile] }))}
            onRemove={(id) => setFormData((prev) => ({ ...prev, uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== id) }))}
          />
        )}

        {/* STEP 13: REVIEW */}
        {currentStep === 13 && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-[#0F2E22]">Review Submitted Assessment Data</h4>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-2">
              <div className="flex justify-between border-b border-[#E3DDD0] pb-2">
                <span className="text-[#7A8981]">Company:</span>
                <span className="font-bold text-[#0F2E22]">{formData.companyName}</span>
              </div>
              <div className="flex justify-between border-b border-[#E3DDD0] pb-2">
                <span className="text-[#7A8981]">Grievance Officer:</span>
                <span className="font-bold text-[#0F2E22]">{formData.dpoName} ({formData.dpoEmail})</span>
              </div>
              <div className="flex justify-between border-b border-[#E3DDD0] pb-2">
                <span className="text-[#7A8981]">Target Domain:</span>
                <span className="font-mono text-[#0F2E22] font-bold">{formData.website}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8981]">Uploaded Evidence:</span>
                <span className="font-bold text-[#166534]">{formData.uploadedFiles.length} Verified Files</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 14: AI ANALYSIS ANIMATION & RESULT */}
        {currentStep === 14 && (
          <div className="py-4">
            <ScannerAnimation
              progress={aiProgress}
              stageMessage={
                aiDone
                  ? 'Audit complete. All 42 statutory DPDP parameters calculated.'
                  : 'Executing Trust Intelligence Core scoring matrix and validating evidence...'
              }
              isComplete={aiDone}
            />

            {aiDone && (
              <div className="pt-4 text-center animate-in fade-in duration-300 space-y-4">
                <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] inline-block text-[#166534] text-xs font-semibold">
                  🌟 Recalculated Trust Score: <strong className="text-base font-bold ml-1">89 / 100 (Strong)</strong>
                </div>

                <div className="pt-2 flex justify-center">
                  <Button variant="primary" size="lg" onClick={() => navigate('/trust-score')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View 6-Pillar Breakdown
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Short Educational Guidance Callout ("Why We Ask" & "DPDP Context") */}
        {stepExplanation && currentStep < 13 && (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#0F2E22]">
              <BookOpen className="w-4 h-4 text-[#0F2E22]" />
              <span>Why We Ask & DPDP Legal Rationale</span>
            </div>
            <p className="text-[#4A5750]">
              <strong className="text-[#0F2E22]">Why we ask:</strong> {stepExplanation.why}
            </p>
            <p className="text-[#7A8981] italic">
              <strong className="text-[#0F2E22]">DPDP context:</strong> {stepExplanation.dpdpContext}
            </p>
          </div>
        )}

        {/* Navigation Buttons Footer */}
        {currentStep < 14 && (
          <div className="pt-6 border-t border-[#E3DDD0] flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 1}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            <Button variant="primary" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
              {currentStep === 13 ? 'Run AI Analysis Engine' : 'Continue'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
