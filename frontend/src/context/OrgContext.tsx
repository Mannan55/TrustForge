import React, { createContext, useContext, useState } from 'react';
import { Organization } from '../types';
import { MOCK_ORGANIZATIONS } from '../data/mockData';

export interface VerifiedOrganization extends Organization {
  cin?: string;
  dpoName?: string;
  dpoEmail?: string;
  isDomainVerified: boolean;
  domainVerificationToken?: string;
}

const EXTENDED_MOCK_ORGS: VerifiedOrganization[] = MOCK_ORGANIZATIONS.map((org) => ({
  ...org,
  cin: 'U72900KA2021PTC145123',
  dpoName: 'Rajesh V. Sharma',
  dpoEmail: 'grievance@technova.in',
  isDomainVerified: true,
  domainVerificationToken: 'tf-verify-txt-981240192'
}));

interface OrgContextType {
  currentOrg: VerifiedOrganization;
  organizations: VerifiedOrganization[];
  switchOrg: (orgId: string) => void;
  updateOrg: (updated: Partial<VerifiedOrganization>) => void;
  verifyDomain: (domain: string) => Promise<boolean>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizations, setOrganizations] = useState<VerifiedOrganization[]>(EXTENDED_MOCK_ORGS);
  const [currentOrgId, setCurrentOrgId] = useState<string>(EXTENDED_MOCK_ORGS[0].id);

  const currentOrg = organizations.find((o) => o.id === currentOrgId) || organizations[0];

  const switchOrg = (orgId: string) => {
    if (organizations.some((o) => o.id === orgId)) {
      setCurrentOrgId(orgId);
    }
  };

  const updateOrg = (updated: Partial<VerifiedOrganization>) => {
    setOrganizations((prev) =>
      prev.map((org) => (org.id === currentOrgId ? { ...org, ...updated } : org))
    );
  };

  const verifyDomain = async (domain: string) => {
    await new Promise((res) => setTimeout(res, 600));
    updateOrg({ isDomainVerified: true, website: domain });
    return true;
  };

  return (
    <OrgContext.Provider value={{ currentOrg, organizations, switchOrg, updateOrg, verifyDomain }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};
