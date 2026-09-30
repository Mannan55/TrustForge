import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2, User } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { AccountMode } from "@/types";

export function LoginPage() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [mode, setMode] = useState<AccountMode>("organization");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(mode, email.trim() || undefined);
    notify(`Welcome back, ${user.name.split(" ")[0]}.`);
    navigate(from ?? "/dashboard");
  };

  return (
    <AuthShell heading="Welcome back to TrustForge">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          Continue to your workspace. This demo accepts any email and password.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-line bg-white p-1">
          <ModeButton active={mode === "organization"} onClick={() => setMode("organization")} icon={Building2} label="Organization" />
          <ModeButton active={mode === "personal"} onClick={() => setMode("personal")} icon={User} label="Personal" />
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder={mode === "organization" ? "you@company.in" : "you@email.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            autoComplete="email"
          />
          <Input
            label="Password"
            type={show ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            autoComplete="current-password"
            trailing={
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="rounded-md p-1.5 text-ink-muted hover:text-ink"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-ink-soft">
              <input type="checkbox" className="h-4 w-4 rounded border-line-strong accent-emerald-deep" defaultChecked />
              Keep me signed in
            </label>
            <button type="button" className="font-medium text-emerald-light hover:underline">
              Forgot password?
            </button>
          </div>
          <Button type="submit" size="lg" className="w-full">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-line bg-beige-light/50 px-4 py-3 text-sm">
          <p className="text-ink-soft">
            Reviewing the platform console?{" "}
            <Link to="/admin/login" className="font-medium text-emerald-light hover:underline">
              Sign in as platform admin
            </Link>
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center border-t border-line pt-6">
          <button
            type="button"
            onClick={() => {
              const user = login("organization", "mannan@google.com");
              notify(`Signed in with Google as ${user.name.split(" ")[0]}.`, "success");
              navigate(from ?? "/dashboard");
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-white py-2.5 px-4 text-sm font-medium text-ink shadow-sm transition-all hover:bg-beige-light hover:border-emerald-light/40"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-ink-soft">
            New to TrustForge?{" "}
            <Link to="/signup" className="font-medium text-emerald-light hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Building2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
        active ? "bg-emerald-deep text-bone" : "text-ink-soft hover:bg-beige-light",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
