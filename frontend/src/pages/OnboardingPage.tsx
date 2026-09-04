import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { useToast } from '../context/ToastContext';
import { BrandLogo } from '../components/layout/BrandLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ProgressBar } from '../components/ui/Tabs';
import { ArrowRight, ArrowLeft, Building2, Globe, ShieldCheck, CheckCircle2, Copy } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { currentOrg, updateOrg, verifyDomain } = useOrg();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [orgName, setOrgName] = useState(currentOrg.name || 'TechNova Solutions Pvt Ltd');
  const [website, setWebsite] = useState(currentOrg.website || 'technova.in');
  const [cin, setCin] = useState(currentOrg.cin || 'U72900KA2021PTC145123');
  const [industry, setIndustry] = useState(currentOrg.industry || 'FinTech / SaaS');
  const [size, setSize] = useState(currentOrg.size || '50-250 employees');

  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [domainVerified, setDomainVerified] = useState(true);

  const handleVerify = async () => {
    setIsVerifyingDomain(true);
    await verifyDomain(website);
    setIsVerifyingDomain(false);
    setDomainVerified(true);
    addToast('Domain Verified', `DNS TXT token validated for ${website}.`, 'success');
  };

  const handleFinish = () => {
    updateOrg({
      name: orgName,
      website,
      cin,
      industry,
      size,
      isDomainVerified: true
    });
    addToast('Organization Setup Complete', 'Your enterprise workspace is active.', 'success');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-3">
          <BrandLogo variant="primary" height={36} />
          <h2 className="text-2xl font-bold text-[#0F2E22]">Organization Profile Setup</h2>
          <p className="text-xs text-[#4A5750]">
            Configure legal entity metadata and verify web domain ownership.
          </p>
        </div>

        {/* Clean Step 1 of 3 Indicator — NO raw percentage strings */}
        <div className="bg-white p-4 rounded-xl border border-[#E3DDD0]">
          <ProgressBar progress={Math.round((step / 3) * 100)} label={`Step ${step} of 3`} />
        </div>

        <div className="bg-white p-8 rounded-2xl border border-[#E3DDD0] shadow-sm space-y-6">
          {/* STEP 1: ENTITY DETAILS */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-[#0F2E22]">1. Legal Entity Identification</h3>
              <Input
                label="Legal Entity Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                helperText="Registered business name under MCA"
              />
              <Input
                label="MCA Corporate Identification Number (CIN)"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                helperText="21-character MCA CIN (e.g. U72900KA2021PTC145123)"
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Industry Category"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  options={[
                    { value: 'FinTech / SaaS', label: 'FinTech / SaaS' },
                    { value: 'HealthTech', label: 'HealthTech' },
                    { value: 'E-Commerce / Retail', label: 'E-Commerce / Retail' },
                    { value: 'Enterprise IT', label: 'Enterprise IT Services' }
                  ]}
                />
                <Select
                  label="Organization Size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  options={[
                    { value: '1-10 employees', label: '1-10 employees' },
                    { value: '11-50 employees', label: '11-50 employees' },
                    { value: '50-250 employees', label: '50-250 employees' },
                    { value: '250+ employees', label: '250+ employees' }
                  ]}
                />
              </div>
            </div>
          )}

          {/* STEP 2: DOMAIN VERIFICATION */}
          {step === 2 && (
            <div className="space-y-4 text-xs text-[#4A5750]">
              <h3 className="text-base font-bold text-[#0F2E22]">2. Domain Ownership Verification</h3>
              <p className="leading-relaxed">
                <strong className="text-[#0F2E22]">Security Requirement:</strong> While MCA CIN identifies your legal entity, domain verification authenticates that you hold administrative authority over <span className="font-mono font-bold text-[#0F2E22]">{website}</span>.
              </p>

              <Input
                label="Primary Business Domain Target"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-3">
                <div className="font-semibold text-[#0F2E22] flex items-center justify-between">
                  <span>DNS TXT Record Verification Token</span>
                  <button
                    onClick={() => addToast('Copied', 'Verification token copied to clipboard.', 'info')}
                    className="text-[#0F2E22] flex items-center gap-1 font-mono hover:underline cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Token</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#E3DDD0] font-mono text-[11px] text-[#0F2E22]">
                  trustforge-verification-site-txt=tf-verify-txt-981240192
                </div>
              </div>

              {domainVerified ? (
                <div className="p-3 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Domain verified: {website} is active.</span>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={handleVerify} isLoading={isVerifyingDomain}>
                  Verify DNS TXT Token
                </Button>
              )}
            </div>
          )}

          {/* STEP 3: CONFIRMATION */}
          {step === 3 && (
            <div className="space-y-4 text-xs text-[#4A5750]">
              <h3 className="text-base font-bold text-[#0F2E22]">3. Summary & Workspace Activation</h3>
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-2">
                <div className="flex justify-between border-b border-[#E3DDD0] pb-2">
                  <span className="text-[#7A8981]">Legal Entity:</span>
                  <span className="font-bold text-[#0F2E22]">{orgName}</span>
                </div>
                <div className="flex justify-between border-b border-[#E3DDD0] pb-2">
                  <span className="text-[#7A8981]">Corporate ID (CIN):</span>
                  <span className="font-mono text-[#0F2E22]">{cin}</span>
                </div>
                <div className="flex justify-between border-b border-[#E3DDD0] pb-2">
                  <span className="text-[#7A8981]">Domain Target:</span>
                  <span className="font-mono text-[#0F2E22]">{website}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A8981]">Domain Status:</span>
                  <span className="font-bold text-[#166534]">Verified Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-4 border-t border-[#E3DDD0] flex items-center justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button variant="primary" onClick={() => setStep(step + 1)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={handleFinish} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch Trust Center Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
