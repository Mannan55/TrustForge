import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User as UserIcon, ArrowRight, Shield } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { AccountType } from '../types';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [accountType, setAccountType] = useState<AccountType>('organization');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    signup(fullName, email, accountType);
    if (accountType === 'organization') {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <PublicLayout>
      <div className="py-12 px-6 max-w-md mx-auto">
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#0F2E22] text-[#F2EDE1] flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F2E22] tracking-tight">
            Start Your DPDP Baseline
          </h1>
          <p className="text-xs text-slate-600">
            Create a free account to evaluate your web domain or Indian entity.
          </p>
        </div>

        <Card className="p-6 bg-white border-2 border-[#0F2E22]/15 shadow-sm space-y-6">
          {/* Account Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#0F2E22]">
              Select Account Type
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('organization')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  accountType === 'organization'
                    ? 'border-[#0F2E22] bg-[#E6F4EE] text-[#0F2E22]'
                    : 'border-[#0F2E22]/20 hover:border-[#0F2E22]/40 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs">
                  <Building2 className="w-4 h-4 text-[#0F2E22]" />
                  <span>Organization</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">
                  For Indian companies & startups
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('personal')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  accountType === 'personal'
                    ? 'border-[#0F2E22] bg-[#E6F4EE] text-[#0F2E22]'
                    : 'border-[#0F2E22]/20 hover:border-[#0F2E22]/40 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs">
                  <UserIcon className="w-4 h-4 text-[#0F2E22]" />
                  <span>Personal</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">
                  For individual website checks
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              required
              placeholder="e.g. Rohan Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label={accountType === 'organization' ? 'Work Email' : 'Email Address'}
              type="email"
              required
              placeholder={accountType === 'organization' ? 'rohan@technova.in' : 'rohan@gmail.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              icon={ArrowRight}
              iconPosition="right"
            >
              Continue
            </Button>
          </form>

          {/* Social login */}
          <div className="relative border-t border-[#0F2E22]/10 pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                signup('Rohan Sharma', 'rohan@technova.in', accountType);
                navigate(accountType === 'organization' ? '/onboarding' : '/dashboard');
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-[#0F2E22]/20 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F2E22] flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.41l3.99-3.14z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.59l3.99 3.14c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="text-center text-xs text-slate-600 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#0F2E22] hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </PublicLayout>
  );
};
