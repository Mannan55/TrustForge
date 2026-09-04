import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

export type AccountMode = 'ORGANIZATION' | 'PERSONAL';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  accountMode: AccountMode;
  setAccountMode: (mode: AccountMode) => void;
  login: (email: string, mode?: AccountMode) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, name: string, mode?: AccountMode) => Promise<void>;
  logout: () => void;
}

const DEFAULT_USER: User = {
  id: 'usr_1',
  name: 'Rajesh Sharma',
  email: 'rajesh@technova.in',
  role: 'Admin / CTO'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('trustforge_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [accountMode, setAccountMode] = useState<AccountMode>(() => {
    const savedMode = localStorage.getItem('trustforge_account_mode');
    return (savedMode as AccountMode) || 'ORGANIZATION';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('trustforge_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('trustforge_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('trustforge_account_mode', accountMode);
  }, [accountMode]);

  const login = async (email: string, mode: AccountMode = 'ORGANIZATION') => {
    await new Promise((res) => setTimeout(res, 400));
    const loggedUser: User = {
      id: 'usr_' + Date.now(),
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email,
      role: mode === 'ORGANIZATION' ? 'Compliance Lead' : 'Individual User'
    };
    setUser(loggedUser);
    setAccountMode(mode);
  };

  const loginWithGoogle = async () => {
    await new Promise((res) => setTimeout(res, 500));
    const googleUser: User = {
      id: 'usr_google_' + Date.now(),
      name: 'Rajesh (Google Workspace)',
      email: 'rajesh.sharma@gmail.com',
      role: 'Individual User'
    };
    setUser(googleUser);
    setAccountMode('PERSONAL');
  };

  const signup = async (email: string, name: string, mode: AccountMode = 'ORGANIZATION') => {
    await new Promise((res) => setTimeout(res, 400));
    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: name || 'Compliance Lead',
      email,
      role: mode === 'ORGANIZATION' ? 'Admin' : 'Individual User'
    };
    setUser(newUser);
    setAccountMode(mode);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        accountMode,
        setAccountMode,
        login,
        loginWithGoogle,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
