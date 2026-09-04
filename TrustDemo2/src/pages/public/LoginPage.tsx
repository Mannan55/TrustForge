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

        <p className="mt-6 text-center text-sm text-ink-soft">
          New to TrustForge?{" "}
          <Link to="/signup" className="font-medium text-emerald-light hover:underline">
            Create an account
          </Link>
        </p>
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
