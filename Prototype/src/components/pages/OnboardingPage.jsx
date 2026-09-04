import React, { useState } from 'react';
import { Shield, Building2, Globe, Users, Briefcase, ArrowRight } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card from '../ui/Card';

export default function OnboardingPage({ onUpdateOrganization, onShowToast }) {
  const { navigate } = useRouter();
  const [companyName, setCompanyName] = useState('TechNova Solutions Pvt Ltd');
  const [website, setWebsite] = useState('https://www.technova.in');
  const [industry, setIndustry] = useState('B2B SaaS / Enterprise Software');
  const [companySize, setCompanySize] = useState('51-200 employees');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onUpdateOrganization({
        name: companyName,
        website: website,
        industry: industry,
        size: companySize,
      });
      onShowToast(`Organization ${companyName} initialized in Trust Center.`, 'success');
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wide">First Login Setup</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Create your Organization
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provide company parameters to calibrate the Trust Evaluation Framework (TEF) for your domain.
          </p>
        </div>

        <Card padding="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Company Name"
              icon={Building2}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. TechNova Solutions Pvt Ltd"
              required
            />

            <Input
              label="Website URL"
              icon={Globe}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.yourcompany.com"
              required
            />

            <Select
              label="Industry Category"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              options={[
                { value: 'B2B SaaS / Enterprise Software', label: 'B2B SaaS / Enterprise Software' },
                { value: 'FinTech / Digital Payments', label: 'FinTech / Digital Payments' },
                { value: 'HealthTech / Digital Health', label: 'HealthTech / Digital Health' },
                { value: 'E-Commerce / Consumer Tech', label: 'E-Commerce / Consumer Tech' },
                { value: 'EdTech / Learning Platforms', label: 'EdTech / Learning Platforms' },
                { value: 'Other Tech Enterprise', label: 'Other Tech Enterprise' }
              ]}
              required
            />

            <Select
              label="Company Size"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              options={[
                { value: '1-10 employees (Early Stage)', label: '1-10 employees (Early Stage)' },
                { value: '11-50 employees (Growth)', label: '11-50 employees (Growth)' },
                { value: '51-200 employees (Scale-up)', label: '51-200 employees (Scale-up)' },
                { value: '201-500 employees (Mid-Market)', label: '201-500 employees (Mid-Market)' },
                { value: '500+ employees (Enterprise)', label: '500+ employees (Enterprise)' }
              ]}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full py-3"
                icon={ArrowRight}
                iconPosition="right"
              >
                Launch Trust Center Dashboard
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
