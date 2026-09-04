import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Organization, AccountType } from '../types';
import { MOCK_ORGANIZATION } from '../data/dpdpFramework';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  login: (email: string, accountType: AccountType, name?: string) => void;
  signup: (name: string, email: string, accountType: AccountType) => void;
  logout: () => void;
  updateOrganization: (orgData: Partial<Organization>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'usr_technova_admin',
    name: 'Rohan Sharma',
    email: 'rohan@technova.in',
    accountType: 'organization',
    orgId: 'org_technova',
    createdAt: '2026-08-01'
  });

  const [organization, setOrganization] = useState<Organization | null>(MOCK_ORGANIZATION);

  const login = (email: string, accountType: AccountType, name?: string) => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name || (email.split('@')[0] || 'User'),
      email,
      accountType,
      orgId: accountType === 'organization' ? 'org_technova' : undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUser(newUser);
    if (accountType === 'organization') {
      setOrganization(MOCK_ORGANIZATION);
    } else {
      setOrganization(null);
    }
  };

  const signup = (name: string, email: string, accountType: AccountType) => {
    login(email, accountType, name);
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
  };

  const updateOrganization = (orgData: Partial<Organization>) => {
    setOrganization(prev => prev ? { ...prev, ...orgData } : {
      id: `org_${Date.now()}`,
      legalName: orgData.legalName || 'New Entity Pvt Ltd',
      industry: orgData.industry || 'Technology',
      companySize: orgData.companySize || '1-50 employees',
      primaryDomain: orgData.primaryDomain || 'https://example.in',
      publicDomain: orgData.publicDomain || 'https://app.example.in',
      detectedIntegrations: orgData.detectedIntegrations || [],
      gstinVerified: orgData.gstinVerified || false,
      domainVerified: orgData.domainVerified || false,
      ...orgData
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateOrganization
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
