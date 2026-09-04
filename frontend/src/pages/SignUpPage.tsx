import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, AccountMode } from '../context/AuthContext';
import { BrandLogo } from '../components/layout/BrandLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowRight, Lock, Mail, User, Building2 } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const { signup, loginWithGoogle, setAccountMode } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedMode, setSelectedMode] = useState<AccountMode>('ORGANIZATION');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await signup(email, name, selectedMode);
      if (selectedMode === 'ORGANIZATION') {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    await loginWithGoogle();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block focus:outline-none">
            <BrandLogo variant="primary" height={36} />
          </Link>
          <h2 className="text-2xl font-bold text-[#0F2E22]">Start Your DPDP Baseline</h2>
          <p className="text-xs text-[#4A5750]">
            Create a free account to evaluate your web domain or Indian entity.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-[#E3DDD0] shadow-sm space-y-6">
          {/* Account Mode Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#0F2E22]">Select Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setSelectedMode('ORGANIZATION')}
                className={`p-3 rounded-xl border cursor-pointer text-xs space-y-1 transition-all ${
                  selectedMode === 'ORGANIZATION'
                    ? 'border-[#0F2E22] bg-[#FAF8F5] ring-1 ring-[#0F2E22]'
                    : 'border-[#E3DDD0] bg-white'
                }`}
              >
                <div className="font-bold text-[#0F2E22] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Organization</span>
                </div>
                <p className="text-[10px] text-[#7A8981]">For Indian companies & startups</p>
              </div>

              <div
                onClick={() => setSelectedMode('PERSONAL')}
                className={`p-3 rounded-xl border cursor-pointer text-xs space-y-1 transition-all ${
                  selectedMode === 'PERSONAL'
                    ? 'border-[#0F2E22] bg-[#FAF8F5] ring-1 ring-[#0F2E22]'
                    : 'border-[#E3DDD0] bg-white'
                }`}
              >
                <div className="font-bold text-[#0F2E22] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Personal</span>
                </div>
                <p className="text-[10px] text-[#7A8981]">For individual website checks</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Rajesh Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label={selectedMode === 'ORGANIZATION' ? 'Work Email' : 'Personal Email'}
              type="email"
              placeholder="name@company.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {selectedMode === 'ORGANIZATION' ? 'Continue to Organization Setup' : 'Create Free Personal Account'}
            </Button>
          </form>

          {/* Continue with Google */}
          <div className="pt-2 border-t border-[#E3DDD0] space-y-3">
            <button
              onClick={handleGoogleAuth}
              className="w-full py-2.5 px-4 rounded-xl border border-[#CFC7B7] bg-white text-xs font-semibold text-[#0F2E22] hover:bg-[#FAF8F5] transition-colors cursor-pointer flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="text-center text-xs text-[#7A8981]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0F2E22] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
