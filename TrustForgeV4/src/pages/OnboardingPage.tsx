import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Globe, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  Check,
  Lock,
  Layers
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { ProgressBar } from '../components/common/ProgressBar';
import { LegalRationale } from '../components/common/LegalRationale';
import { useAuth } from '../context/AuthContext';
import { DETECTED_INTEGRATIONS_PRESETS } from '../data/dpdpFramework';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateOrganization } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form
  const [legalName, setLegalName] = useState('TechNova Solutions Pvt Ltd');
  const [cin, setCin] = useState('U72900MH2021PTC354912');
  const [gstin, setGstin] = useState('27AABCT3549R1ZM');
  const [industry, setIndustry] = useState('Enterprise Software & SaaS');
  const [companySize, setCompanySize] = useState('51-200 employees');
  const [isVerifyingGstin, setIsVerifyingGstin] = useState(false);
  const [gstinVerified, setGstinVerified] = useState(true);

  // Step 2 Form
  const [primaryDomain, setPrimaryDomain] = useState('https://www.technova.in');
  const [publicDomain, setPublicDomain] = useState('https://app.technova.in');
  const [endpointConfig, setEndpointConfig] = useState('TLS 1.3 / AWS ap-south-1 (Mumbai)');
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(['ga4', 'cloudfront', 'razorpay', 'intercom']);

  // Step 3 Form
  const [domainVerified, setDomainVerified] = useState(true);

  const handleVerifyGstin = () => {
    setIsVerifyingGstin(true);
    setTimeout(() => {
      setIsVerifyingGstin(false);
      setGstinVerified(true);
    }, 1000);
  };

  const toggleIntegration = (id: string) => {
    setSelectedIntegrations(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCompleteOnboarding = () => {
    updateOrganization({
      legalName,
      cin,
      gstin,
      industry,
      companySize,
      primaryDomain,
      publicDomain,
      endpointConfig,
      detectedIntegrations: selectedIntegrations,
      gstinVerified,
      domainVerified
    });
    navigate('/dashboard');
  };

  return (
    <PublicLayout>
      <div className="py-10 px-6 max-w-2xl mx-auto space-y-6">
        {/* Header & Step Indicator */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-extrabold text-[#0F2E22] tracking-tight">
                Organization Verification & Setup
              </h1>
              <p className="text-xs text-slate-600">
                Set up your Indian corporate identity & public web domain parameters.
              </p>
            </div>
          </div>

          <ProgressBar
            currentStep={step}
            totalSteps={3}
            stepTitle={
              step === 1 ? 'Organization Context' : step === 2 ? 'Web Domain & Integrations' : 'Verification & Authorization'
            }
          />
        </div>

        {/* STEP 1: ORGANIZATION CONTEXT */}
        {step === 1 && (
          <Card className="p-6 bg-white border-2 border-[#0F2E22]/15 space-y-6 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#0F2E22] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0F2E22]" />
                <span>Step 1: Corporate Entity Details</span>
              </h2>
              <p className="text-xs text-slate-600">
                Enter legal entity identifiers registered with MCA & GST portal.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Legal Entity Name"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="TechNova Solutions Pvt Ltd"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="MCA Corporate ID (CIN)"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  placeholder="U72900MH2021PTC354912"
                />

                <div>
                  <label className="block text-xs font-semibold text-[#0F2E22] mb-1.5">
                    GSTIN Identification
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="27AABCT3549R1ZM"
                      className="flex-1 bg-white border border-[#0F2E22]/20 rounded-xl text-sm text-[#0F2E22] px-3 py-2 focus:outline-none focus:border-[#0F2E22]"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={isVerifyingGstin}
                      onClick={handleVerifyGstin}
                    >
                      {gstinVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* GSTIN Verification Confirmation Box */}
              {gstinVerified && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Verified Organization Identity (GSTIN Signal)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                    <div><span className="text-slate-500">Legal Name:</span> TechNova Solutions Pvt Ltd</div>
                    <div><span className="text-slate-500">Registration:</span> Active (State: Maharashtra)</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F2E22] mb-1.5">Industry Sector</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-white border border-[#0F2E22]/20 rounded-xl text-sm text-[#0F2E22] px-3 py-2.5 focus:outline-none focus:border-[#0F2E22]"
                  >
                    <option>Enterprise Software & SaaS</option>
                    <option>Fintech & Financial Services</option>
                    <option>E-Commerce & Retail</option>
                    <option>Healthcare & HealthTech</option>
                    <option>EdTech & Education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F2E22] mb-1.5">Company Size</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full bg-white border border-[#0F2E22]/20 rounded-xl text-sm text-[#0F2E22] px-3 py-2.5 focus:outline-none focus:border-[#0F2E22]"
                  >
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>51-200 employees</option>
                    <option>201-500 employees</option>
                    <option>500+ employees</option>
                  </select>
                </div>
              </div>

              {/* Legal Rationale Explanation */}
              <LegalRationale
                whyWeAsk="Verifies the legal corporate identity of your Indian entity to ensure statutory governance transparency."
                dpdpContext="DPDP Section 8(9) mandates designated Grievance Officers and corporate registration parameters for Data Fiduciaries operating in India."
                dpdpSectionRef="DPDP Section 8(9)"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-[#0F2E22]/10">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                icon={ArrowRight}
                iconPosition="right"
              >
                Continue to Step 2
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2: WEBSITE & TECH STACK */}
        {step === 2 && (
          <Card className="p-6 bg-white border-2 border-[#0F2E22]/15 space-y-6 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#0F2E22] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#0F2E22]" />
                <span>Step 2: Web Domain & Cloud Integrations</span>
              </h2>
              <p className="text-xs text-slate-600">
                Specify public web domains and audit detected third-party tracking scripts.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Primary Web Domain"
                required
                value={primaryDomain}
                onChange={(e) => setPrimaryDomain(e.target.value)}
                placeholder="https://www.technova.in"
              />

              <Input
                label="Public Web Application Domain"
                value={publicDomain}
                onChange={(e) => setPublicDomain(e.target.value)}
                placeholder="https://app.technova.in"
              />

              <Input
                label="Endpoint & Cloud Hosting Configuration"
                value={endpointConfig}
                onChange={(e) => setEndpointConfig(e.target.value)}
                placeholder="TLS 1.3 / AWS ap-south-1 (Mumbai)"
              />

              {/* Selectable Detected Integrations */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#0F2E22]">
                  Detected Active Third-Party Integrations
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DETECTED_INTEGRATIONS_PRESETS.map((item) => {
                    const isSelected = selectedIntegrations.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleIntegration(item.id)}
                        className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0F2E22] bg-[#E6F4EE] text-[#0F2E22]'
                            : 'border-[#0F2E22]/20 bg-slate-50 text-slate-600 hover:border-[#0F2E22]/40'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{item.name}</div>
                          <div className="text-[11px] text-slate-500">{item.details}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#0F2E22] border-[#0F2E22] text-[#F2EDE1]' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <LegalRationale
                whyWeAsk="Audits public endpoint integrations that may inadvertently transfer personal data to external processors."
                dpdpContext="Data Fiduciaries remain directly liable under DPDP Section 8(2) for unvetted third-party scripts loaded on public domains."
                dpdpSectionRef="DPDP Section 8(2)"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-[#0F2E22]/10">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                icon={ArrowLeft}
              >
                Back to Step 1
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                icon={ArrowRight}
                iconPosition="right"
              >
                Continue to Step 3
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: VERIFICATION & AUTHORIZATION */}
        {step === 3 && (
          <Card className="p-6 bg-white border-2 border-[#0F2E22]/15 space-y-6 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#0F2E22] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0F2E22]" />
                <span>Step 3: Identity & Authorization Verification</span>
              </h2>
              <p className="text-xs text-slate-600">
                Distinguishing Organization Identity from User Representative Authorization.
              </p>
            </div>

            <div className="space-y-4">
              {/* Concept Card 1: Org Identity */}
              <div className="p-4 rounded-xl bg-[#F2EDE1] border border-[#E3CFAE] space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#0F2E22]">
                  <Building2 className="w-4 h-4 text-emerald-800" />
                  <span>1. Organization Identity Signal (GSTIN Verified)</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  GSTIN <span className="font-mono font-bold">27AABCT3549R1ZM</span> confirms legal registration of <span className="font-bold">TechNova Solutions Pvt Ltd</span> on the MCA/GST portal.
                </p>
              </div>

              {/* Concept Card 2: User Authorization */}
              <div className="p-4 rounded-xl bg-white border border-[#0F2E22]/20 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#0F2E22]">
                  <Lock className="w-4 h-4 text-emerald-800" />
                  <span>2. User Representation & Business Domain Authorization</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  GSTIN verifies entity existence, but does not prove individual ownership. Authorization is confirmed via matching work email domain (<span className="font-mono text-[#0F2E22] font-semibold">@technova.in</span>).
                </p>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center space-x-2 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Work Email Domain Verified (@technova.in)</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-emerald-200 px-2 py-0.5 rounded text-emerald-900">
                    Authorized
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#0F2E22]/10">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                icon={ArrowLeft}
              >
                Back to Step 2
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCompleteOnboarding}
                icon={ArrowRight}
                iconPosition="right"
              >
                Launch Trust Center Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
};
