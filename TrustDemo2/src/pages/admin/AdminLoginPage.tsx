import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";

export function AdminLoginPage() {
  const { loginAsAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("ops@trustforge.in");
  const [password, setPassword] = useState("demo-console");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    loginAsAdmin();
    setTimeout(() => navigate("/admin"), 250);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-dark px-4 py-12">
      {/* Calm decorative grid, no AI motifs */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#F2EDE1 1px, transparent 1px), linear-gradient(90deg, #F2EDE1 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo variant="light" height={30} />
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-mid/50 px-3 py-1 text-xs font-medium text-bone/80">
            <Lock className="h-3.5 w-3.5" /> Platform Console
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-mid/60 bg-emerald-deep p-6 shadow-xl sm:p-7">
          <h1 className="font-display text-lg font-semibold text-bone">Operations sign-in</h1>
          <p className="mt-1 text-sm text-bone/60">Restricted to authorized TrustForge staff.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-bone/85">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-emerald-mid bg-emerald-dark/60 px-3 text-sm text-bone placeholder:text-bone/40 focus:border-beige focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-bone/85">Password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-emerald-mid bg-emerald-dark/60 px-3 pr-10 text-sm text-bone placeholder:text-bone/40 focus:border-beige focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-bone/50 hover:text-bone"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in..." : "Sign in to console"}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-emerald-mid/60 bg-emerald-dark/40 p-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-beige/70" />
            <p className="text-xs text-bone/60">
              Access attempts are logged. This console is separate from the customer workspace.
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="mt-5 flex items-center justify-center gap-1.5 text-sm text-bone/60 transition-colors hover:text-bone"
        >
          <ArrowLeft className="h-4 w-4" /> Back to TrustForge
        </Link>
      </div>
    </div>
  );
}
