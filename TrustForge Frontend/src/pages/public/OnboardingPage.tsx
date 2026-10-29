import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
  ShieldCheck,
  BadgeCheck,
  Loader,
  CircleAlert,
  UserRound,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { Input, Select } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/cn";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { identityService, type GstinVerification } from "@/services";
import { createDomainChallengeApi, verifyDomainApi } from "@/services/api";

const STEPS = [
  { id: 1, label: "Identity", icon: Building2 },
  { id: 2, label: "Authorization", icon: Globe },
  { id: 3, label: "Context", icon: UserRound },
];

const INDUSTRIES = [
  "Enterprise Software & SaaS",
  "Fintech",
  "Healthtech",
  "Edtech",
  "E-commerce & Retail",
  "Logistics",
  "Other",
].map((v) => ({ value: v, label: v }));

const SIZES = ["1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "500+ employees"].map(
  (v) => ({ value: v, label: v }),
);

export function OnboardingPage() {
  const { org, updateOrg } = useOrg();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    legalName: org.legalName,
    gstin: org.gstin,
    primaryDomain: org.primaryDomain,
    grievanceOfficer: org.grievanceOfficer,
    grievanceEmail: org.grievanceEmail,
    industry: org.industry,
    companySize: org.companySize,
  });

  const [gstinState, setGstinState] = useState<"idle" | "checking" | "done">("idle");
  const [gstinResult, setGstinResult] = useState<GstinVerification | null>(null);
  const [domainState, setDomainState] = useState<"idle" | "checking" | "done">("idle");
  const [domainResult, setDomainResult] = useState<any | null>(null);
  const [challengeData, setChallengeData] = useState<any | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const verifyGstin = () => {
    setGstinState("checking");
    identityService.verifyGstin(form.gstin).then((r) => {
      setGstinResult(r);
      setGstinState("done");
      if (r.legalName) set("legalName", r.legalName);
    });
  };

  const requestChallenge = async () => {
    if (!form.primaryDomain.trim()) return;
    setChallengeLoading(true);
    try {
      const res = await createDomainChallengeApi(form.primaryDomain);
      setChallengeData(res);
      setDomainState("idle");
      setDomainResult(null);
    } catch (err: any) {
      notify(err?.message || "Failed to generate domain verification challenge.", "warning");
    } finally {
      setChallengeLoading(false);
    }
  };

  const verifyDomain = async () => {
    if (!challengeData) {
      await requestChallenge();
      return;
    }
    setDomainState("checking");
    try {
      const res = await verifyDomainApi(form.primaryDomain);
      setDomainResult(res);
      setDomainState("done");
    } catch (err: any) {
      setDomainResult({
        verified: false,
        note: err?.message || "Verification request failed."
      });
      setDomainState("done");
    }
  };

  const finish = async () => {
    setFinishing(true);
    const isDomainGenuine = domainResult?.verified ?? false;
    const isGstinGenuine = gstinResult?.found ?? false;

    try {
      await updateOrg({
        legalName: form.legalName,
        gstin: form.gstin,
        primaryDomain: form.primaryDomain,
        grievanceOfficer: form.grievanceOfficer,
        grievanceEmail: form.grievanceEmail,
        industry: form.industry,
        companySize: form.companySize,
        gstinVerified: isGstinGenuine,
        domainVerified: isDomainGenuine,
        authorizationVerified: isDomainGenuine,
      });
      notify(isDomainGenuine ? "Organization workspace is ready and verified." : "Organization workspace created (Domain verification pending).");
      navigate("/dashboard");
    } catch (err: any) {
      notify(err?.message || "Failed to persist organization profile.", "warning");
    } finally {
      setFinishing(false);
    }
  };

  const canNext = step === 1 ? gstinState === "done" : step === 2 ? domainState === "done" : true;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="TrustForge home">
            <BrandLogo variant="primary" height={26} />
          </Link>
          <Link to="/dashboard" className="text-sm text-ink-muted hover:text-ink">
            Skip for now
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Stepper */}
        <ol className="mb-10 flex items-center">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <li key={s.id} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                      done
                        ? "border-emerald-deep bg-emerald-deep text-bone"
                        : active
                          ? "border-emerald-deep bg-white text-emerald-deep"
                          : "border-line-strong bg-white text-ink-muted",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : s.id}
                  </span>
                  <span className={cn("hidden text-sm font-medium sm:block", active || done ? "text-ink" : "text-ink-muted")}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className={cn("mx-3 h-px flex-1", step > s.id ? "bg-emerald-deep" : "bg-line-strong")} />
                )}
              </li>
            );
          })}
        </ol>

        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 animate-fade-in">
          {step === 1 && (
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">Confirm your legal identity</h1>
              <p className="mt-2 text-sm text-ink-soft">
                We look up your registered entity by GSTIN. This confirms the company exists on
                record. It is a separate step from proving you are authorized to act for it.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Input
                    label="GSTIN"
                    value={form.gstin}
                    onChange={(e) => set("gstin", e.target.value.toUpperCase())}
                    className="font-mono sm:flex-1"
                    maxLength={15}
                  />
                  <Button variant="outline" onClick={verifyGstin} disabled={gstinState === "checking"} className="shrink-0">
                    {gstinState === "checking" ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" /> Checking
                      </>
                    ) : (
                      "Verify GSTIN"
                    )}
                  </Button>
                </div>

                {gstinState === "done" && gstinResult && (
                  <div className="rounded-xl border border-success-line bg-success-soft/50 p-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-5 w-5 text-success" />
                      <p className="font-medium text-ink">Entity found on record</p>
                      <Badge tone="success">{gstinResult.status}</Badge>
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <Row label="Registered name" value={gstinResult.legalName} />
                      <Row label="GSTIN" value={form.gstin} mono />
                    </dl>
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/70 p-3 text-xs text-ink-soft">
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <span>{gstinResult.note}</span>
                    </div>
                  </div>
                )}

                <Input
                  label="Legal entity name"
                  value={form.legalName}
                  onChange={(e) => set("legalName", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">Verify domain authorization</h1>
              <p className="mt-2 text-sm text-ink-soft">
                This proves you can act for the entity. We confirm control of your primary domain via
                a DNS record or a business email on that domain.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Input
                    label="Primary domain"
                    value={form.primaryDomain}
                    onChange={(e) => {
                      set("primaryDomain", e.target.value);
                      setChallengeData(null);
                      setDomainResult(null);
                      setDomainState("idle");
                    }}
                    icon={<Globe className="h-4 w-4" />}
                    className="sm:flex-1"
                    placeholder="e.g. technova.in"
                  />
                  {!challengeData ? (
                    <Button
                      variant="outline"
                      onClick={requestChallenge}
                      disabled={challengeLoading || !form.primaryDomain.trim()}
                      className="shrink-0"
                    >
                      {challengeLoading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" /> Generating...
                        </>
                      ) : (
                        "Generate DNS Challenge"
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={verifyDomain}
                      disabled={domainState === "checking"}
                      className="shrink-0"
                    >
                      {domainState === "checking" ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" /> Verifying DNS...
                        </>
                      ) : (
                        "Verify DNS Record"
                      )}
                    </Button>
                  )}
                </div>

                {challengeData && (
                  <div className="rounded-xl border border-line bg-canvas p-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">Active Cryptographic TXT Challenge</p>
                      <span className="text-xs text-ink-muted font-mono">
                        Expires: {new Date(challengeData.challengeExpiresAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <code className="mt-2 block overflow-x-auto rounded-lg bg-emerald-deep px-3 py-2 font-mono text-xs text-bone select-all">
                      {challengeData.challengeRecord}
                    </code>
                    <p className="mt-2 text-xs text-ink-soft">
                      {challengeData.note}
                    </p>
                  </div>
                )}

                {domainState === "done" && domainResult?.verified && (
                  <div className="rounded-xl border border-success-line bg-success-soft/50 p-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-success" />
                      <p className="font-medium text-ink">Authorization confirmed</p>
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">
                      Control of {form.primaryDomain} verified via DNS TXT record. You can now act for
                      this organization in TrustForge.
                    </p>
                  </div>
                )}

                {domainState === "done" && !domainResult?.verified && (
                  <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <CircleAlert className="h-5 w-5 text-warning" />
                      <p className="font-medium text-ink">Domain verification pending</p>
                      <Badge tone="warning">Pending</Badge>
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">
                      {domainResult?.note || "DNS TXT record not yet detected. Authority not established until record propagates."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">Accountability and context</h1>
              <p className="mt-2 text-sm text-ink-soft">
                A named grievance officer and published contact is expected of a Data Fiduciary under
                the Act. This is where data principals reach you.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Select label="Industry" options={INDUSTRIES} value={form.industry} onChange={(e) => set("industry", e.target.value)} />
                <Select label="Company size" options={SIZES} value={form.companySize} onChange={(e) => set("companySize", e.target.value)} />
                <Input label="Grievance officer" value={form.grievanceOfficer} onChange={(e) => set("grievanceOfficer", e.target.value)} />
                <Input
                  label="Grievance email"
                  type="email"
                  value={form.grievanceEmail}
                  onChange={(e) => set("grievanceEmail", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={finishing}>
                {finishing ? "Entering workspace..." : "Enter workspace"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {!canNext && step < 3 && (
          <p className="mt-3 text-center text-xs text-ink-muted">
            {step === 1 ? "Verify your GSTIN to continue." : "Verify your domain to continue."}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={cn("text-right font-medium text-ink", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}
