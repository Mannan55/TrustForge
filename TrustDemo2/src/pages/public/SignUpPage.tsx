import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2, User, UserRound } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { AccountMode } from "@/types";

export function SignUpPage() {
  const { signup } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AccountMode>("organization");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    signup(mode, name.trim(), email.trim());
    if (mode === "organization") {
      notify("Account created. Let's set up your organization.");
      navigate("/onboarding");
    } else {
      notify("Account created. Welcome to TrustForge.");
      navigate("/dashboard");
    }
  };

  return (
    <AuthShell
      heading="Start with evidence, not assumptions"
      points={[
        "Run a guided DPDP assessment across six trust pillars",
        "Attach documents and scan results as real evidence",
        "Get a Trust Score with a short, ordered list of fixes",
      ]}
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Create your account</h2>
        <p className="mt-1.5 text-sm text-ink-soft">Choose how you want to use TrustForge.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <ModeCard
            active={mode === "organization"}
            onClick={() => setMode("organization")}
            icon={Building2}
            title="Organization"
            body="Assess and improve your company's DPDP posture."
          />
          <ModeCard
            active={mode === "personal"}
            onClick={() => setMode("personal")}
            icon={User}
            title="Personal"
            body="Explore your rights and scan sites you use."
          />
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input
            label="Full name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<UserRound className="h-4 w-4" />}
            required
          />
          <Input
            label={mode === "organization" ? "Work email" : "Email"}
            type="email"
            placeholder={mode === "organization" ? "you@company.in" : "you@email.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            hint={mode === "organization" ? "Use your company domain to verify ownership later." : undefined}
            required
          />
          <Input
            label="Password"
            type={show ? "text" : "password"}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
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
            required
          />
          <Button type="submit" size="lg" className="w-full">
            {mode === "organization" ? "Continue to setup" : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-4 text-xs text-ink-muted">
          By continuing you agree to use TrustForge for lawful data protection assessment. This is a
          product demonstration.
        </p>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-emerald-light hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Building2;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-emerald-deep bg-emerald-soft/60 ring-1 ring-emerald-deep"
          : "border-line bg-white hover:border-line-strong",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          active ? "bg-emerald-deep text-bone" : "bg-beige-light text-emerald-light",
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 font-display text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs text-ink-soft">{body}</p>
    </button>
  );
}
