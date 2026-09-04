import React, { useState } from 'react';
import { Settings, Building2, Globe, Shield, Save, User as UserIcon } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { organization, user, updateOrganization } = useAuth();

  const [legalName, setLegalName] = useState(organization?.legalName || 'TechNova Solutions Pvt Ltd');
  const [cin, setCin] = useState(organization?.cin || 'U72900MH2021PTC354912');
  const [gstin, setGstin] = useState(organization?.gstin || '27AABCT3549R1ZM');
  const [primaryDomain, setPrimaryDomain] = useState(organization?.primaryDomain || 'https://www.technova.in');
  const [grievanceName, setGrievanceName] = useState(organization?.grievanceOfficerName || 'Rohan Sharma');
  const [grievanceEmail, setGrievanceEmail] = useState(organization?.grievanceOfficerEmail || 'grievance@technova.in');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization({
      legalName,
      cin,
      gstin,
      primaryDomain,
      grievanceOfficerName: grievanceName,
      grievanceOfficerEmail: grievanceEmail
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <AppLayout
      title="Organization Settings"
      subtitle="Manage corporate entity identity & domain parameters"
    >
      <div className="max-w-3xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6 bg-white border-2 border-[#0F2E22]/15 space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#0F2E22]/10 pb-3">
              <Building2 className="w-5 h-5 text-[#0F2E22]" />
              <h2 className="text-base font-bold text-[#0F2E22]">
                Organization Profile
              </h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Legal Entity Name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="MCA Corporate ID (CIN)"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                />
                <Input
                  label="GSTIN Identification"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
              </div>

              <Input
                label="Primary Web Domain"
                value={primaryDomain}
                onChange={(e) => setPrimaryDomain(e.target.value)}
              />
            </div>
          </Card>

          <Card className="p-6 bg-white border-2 border-[#0F2E22]/15 space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#0F2E22]/10 pb-3">
              <UserIcon className="w-5 h-5 text-[#0F2E22]" />
              <h2 className="text-base font-bold text-[#0F2E22]">
                Designated Grievance Officer
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Grievance Officer Name"
                value={grievanceName}
                onChange={(e) => setGrievanceName(e.target.value)}
              />
              <Input
                label="Grievance Officer Email"
                value={grievanceEmail}
                onChange={(e) => setGrievanceEmail(e.target.value)}
              />
            </div>
          </Card>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                Settings saved successfully!
              </span>
            ) : <span />}

            <Button
              type="submit"
              variant="primary"
              icon={Save}
            >
              Save Organization Settings
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};
