import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Building2, 
  Globe, 
  Lock, 
  Eye, 
  Check, 
  AlertCircle,
  RefreshCw,
  Award
} from 'lucide-react';
import { ASSESSMENT_STEPS, MOCK_COMPANY } from '../../data/mockData';

export default function AssessmentWizard({ onCompleteAssessment, onShowToast }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: MOCK_COMPANY.name,
    website: MOCK_COMPANY.website,
    cin: MOCK_COMPANY.cin,
    dpoName: MOCK_COMPANY.dpoName,
    dpoEmail: MOCK_COMPANY.dpoEmail,
    fiduciaryCategory: 'Significant Data Fiduciary Candidate',
    dataTypes: ['User Identifiers', 'Financial Records', 'Device Metadata', 'Location Logs'],
    noticeLanguages: ['English', 'Hindi', 'Kannada', 'Tamil'],
    encryptionStandard: 'AES-256 / TLS 1.3',
    uploadedFiles: [
      { name: 'TechNova_Privacy_Policy_2026.pdf', size: '2.4 MB', status: 'Verified' },
      { name: 'InfoSec_Governance_SOP.pdf', size: '1.8 MB', status: 'Verified' }
    ]
  });

  const [aiProgress, setAiProgress] = useState(0);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  const totalSteps = ASSESSMENT_STEPS.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === totalSteps - 1) {
      // Transition to Step 9 (AI Analysis)
      setCurrentStep(9);
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

    const interval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAiAnalyzing(false);
          setAiDone(true);
          onShowToast('Trust Intelligence Core assessment complete. Score recalculated: 89/100.', 'success');
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header & Stepper Indicator */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wide">
              Step {currentStep} of {totalSteps}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {ASSESSMENT_STEPS[currentStep - 1].name}
            </h1>
            <p className="text-xs text-slate-500">
              {ASSESSMENT_STEPS[currentStep - 1].description}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">Progress:</span>
            <span className="text-xs font-bold font-mono text-slate-800">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>

        {/* Multi-step Pills Header */}
        <div className="hidden lg:flex items-center justify-between gap-1 pt-2 overflow-x-auto custom-scrollbar">
          {ASSESSMENT_STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            return (
              <button
                key={step.id}
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                }}
                disabled={step.id > currentStep}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  isCurrent 
                    ? 'bg-blue-600 text-white font-bold shadow-xs' 
                    : isCompleted 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-400 opacity-60'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border text-[10px] flex items-center justify-center font-mono">
                    {step.id}
                  </span>
                )}
                <span className="whitespace-nowrap">{step.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">
        {/* STEP 1: WELCOME */}
        {currentStep === 1 && (
          <div className="space-y-6 text-slate-700">
            <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start space-x-4">
              <div className="p-3 rounded-xl bg-blue-600 text-white shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">DPDP Trust Evaluation Framework (TEF)</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This guided assessment verifies {MOCK_COMPANY.name}'s alignment with India's Digital Personal Data Protection Act 2023. Completing this wizard updates your official Trust Score and generates audit evidence.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">⏱️ Duration</div>
                <div className="text-slate-500">Approx. 4-6 minutes</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">📋 Scope</div>
                <div className="text-slate-500">6 TEF Compliance Pillars</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">📄 Output</div>
                <div className="text-slate-500">Certified Audit Trail & PDF</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: COMPANY DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-bold text-slate-900 text-sm">Entity & Legal Officer Setup</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">MCA Corporate ID (CIN)</label>
                <input
                  type="text"
                  value={formData.cin}
                  onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data Protection Officer Name</label>
                <input
                  type="text"
                  value={formData.dpoName}
                  onChange={(e) => setFormData({ ...formData, dpoName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grievance Email Address</label>
                <input
                  type="email"
                  value={formData.dpoEmail}
                  onChange={(e) => setFormData({ ...formData, dpoEmail: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WEBSITE INFO */}
        {currentStep === 3 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Public Web Domain & Endpoint Config</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Web Domain</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-800">Detected Active Integrations</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">Google Analytics 4</span>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">AWS CloudFront CDN</span>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">Razorpay Payment Gateway</span>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">Intercom Support Widget</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DATA COLLECTION */}
        {currentStep === 4 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Categories of Personal Data Processed</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['User Identifiers (Name, Phone, Email)', 'Financial & Transaction Data', 'Device IP & Browser Headers', 'Geographic Location Metrics', 'Biometric / Sensitive Data', 'Employee HR Data'].map((type, idx) => (
                <label key={idx} className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <input type="checkbox" defaultChecked={idx < 4} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="font-medium text-slate-800">{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: PRIVACY PRACTICES */}
        {currentStep === 5 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Consent & Notice Language Operations</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supported Consent Notice Languages</label>
              <div className="flex flex-wrap gap-2">
                {['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Bengali', 'Marathi'].map((lang, idx) => (
                  <span key={idx} className={`px-3 py-1 rounded-lg border font-medium ${idx < 4 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    {lang} {idx < 4 && '✓'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SECURITY PRACTICES */}
        {currentStep === 6 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Encryption & Technical Security Controls</h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800">Encryption at Rest</span>
                <span className="font-mono text-emerald-600 font-bold">AES-256 Verified</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800">Encryption in Transit</span>
                <span className="font-mono text-emerald-600 font-bold">TLS 1.3 Enforced</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800">Backup Frequency</span>
                <span className="font-mono text-slate-700">Automated Daily Snapshot</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: DOCUMENT UPLOAD */}
        {currentStep === 7 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Evidence Document Uploader</h3>
            <div className="p-8 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl bg-slate-50/50 text-center transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-bold text-slate-900">Drag & drop compliance documents here</div>
              <div className="text-slate-400 text-[11px] mt-1">Supports PDF, DOCX, scan images (max 25MB)</div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-700">Uploaded Evidence Files (2)</div>
              {formData.uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold text-slate-900">{file.name}</div>
                      <div className="text-[10px] text-slate-400">{file.size}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: REVIEW */}
        {currentStep === 8 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Review Submitted Assessment Data</h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Company:</span>
                <span className="font-bold text-slate-900">{formData.companyName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Grievance Officer:</span>
                <span className="font-bold text-slate-900">{formData.dpoName} ({formData.dpoEmail})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Domain Target:</span>
                <span className="font-mono text-blue-600 font-bold">{formData.website}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uploaded Documents:</span>
                <span className="font-bold text-emerald-600">{formData.uploadedFiles.length} Verified Files</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: AI ANALYSIS ENGINE */}
        {currentStep === 9 && (
          <div className="py-8 text-center space-y-6">
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className={`w-full h-full rounded-full border-4 border-blue-100 border-t-blue-600 ${aiAnalyzing ? 'animate-spin' : ''}`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {aiDone ? (
                  <Award className="w-10 h-10 text-emerald-600 animate-bounce" />
                ) : (
                  <Sparkles className="w-10 h-10 text-blue-600" />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                {aiDone ? "TEF Assessment Complete!" : "Trust Intelligence Core (TIC) Processing..."}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {aiDone 
                  ? "Audit complete. All 42 statutory DPDP parameters calculated." 
                  : "Scanning uploaded vector documents, validating SSL, and executing TEF scoring matrix..."}
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Execution Progress</span>
                <span className="text-blue-600">{aiProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-200"
                  style={{ width: `${aiProgress}%` }}
                ></div>
              </div>
            </div>

            {aiDone && (
              <div className="pt-4 animate-in fade-in duration-300">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 inline-block text-emerald-900 text-xs font-medium mb-4">
                  🌟 Recalculated Trust Score: <strong className="text-emerald-700 text-base font-extrabold ml-1">89 / 100</strong>
                </div>
                <div>
                  <button
                    onClick={() => onCompleteAssessment()}
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all inline-flex items-center space-x-2"
                  >
                    <span>Return to Trust Center Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons Footer */}
        {currentStep < 9 && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center space-x-1.5 ${
                currentStep === 1 
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center space-x-2"
            >
              <span>{currentStep === 8 ? "Run AI Analysis Engine" : "Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
