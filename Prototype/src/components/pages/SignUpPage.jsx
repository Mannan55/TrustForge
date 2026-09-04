import React, { useState } from 'react';
import { Shield, ArrowRight, Mail, Lock, User, Building2 } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

export default function SignUpPage({ onShowToast }) {
  const { navigate } = useRouter();
  const [name, setName] = useState('Rajesh V. Sharma');
  const [email, setEmail] = useState('rajesh.sharma@technova.in');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onShowToast('Account created successfully! Now set up your Organization.', 'success');
      navigate('/onboarding');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-6 relative">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        ← Back to Landing Page
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create your TrustForge Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Start evaluating your DPDP compliance with the Trust Evaluation Framework
          </p>
        </div>

        <Card padding="p-8">
          <button
            onClick={handleSignUp}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors mb-6 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign up with Google Workspace</span>
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 absolute">or email</span>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Work Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full mt-2"
              icon={ArrowRight}
              iconPosition="right"
            >
              Continue to Organization Setup
            </Button>
          </form>

          <div className="text-center mt-6 text-xs text-slate-500">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
