import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Scale,
  BookOpen,
  ShieldCheck,
  Globe,
  Boxes,
  Layers,
  Target,
  Languages as LanguagesIcon,
  Clock3,
  UserCheck,
  Lock,
  Handshake,
  FileUp,
  ClipboardList,
  ArrowRight,
  Info,
  Paperclip,
} from "lucide-react";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input, Select } from "@/components/common/Input";
import { ScoreRing } from "@/components/common/ScoreRing";
import { ProgressBar } from "@/components/common/ProgressBar";
import { ProcessingVisual } from "@/components/scanner/ProcessingVisual";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import {
  ASSESSMENT_STEPS,
  PERSONAL_DATA_CATEGORIES,
  PROCESSING_PURPOSES,
  SUPPORTED_LANGUAGES,
  DETECTED_INTEGRATIONS,
  DATA_RIGHTS,
  SECURITY_CONTROLS,
  ANALYSIS_STAGES,
} from "@/data/dpdpFramework";
import { PILLARS, FINDINGS, UPLOADED_DOCUMENTS } from "@/data/assessmentData";
import { cn } from "@/lib/cn";
import type { AssessmentStepMeta } from "@/types";

const sensitivityTone: Record<string, "neutral" | "info" | "warning" | "danger"> = {
  Standard: "neutral",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

const riskTone: Record<string, "success" | "warning" | "danger"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
};

interface WizardState {
  categories: string[];
  purposes: string[];
  languages: string[];
  rights: string[];
  processors: string[];
  retention: string;
  erasureAutomated: boolean;
  breachPlan: boolean;
}

const initialState: WizardState = {
  categories: ["identifiers", "financial", "device"],
  purposes: ["service", "auth", "analytics", "support", "security"],
  languages: ["en", "hi", "kn"],
  rights: ["access", "correction", "grievance"],
  processors: ["cloudfront", "razorpay", "intercom"],
  retention: "As long as the account is active, then 90 days",
  erasureAutomated: true,
  breachPlan: false,
};

const RETENTION_OPTIONS = [
  { value: "Until account deletion", label: "Until account deletion" },
  { value: "As long as the account is active, then 90 days", label: "Active account, then 90 days" },
  { value: "12 months rolling", label: "12 months rolling" },
  { value: "No defined schedule", label: "No defined schedule yet" },
];

export function AssessmentPage() {
  const { org } = useOrg();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [index, setIndex] = useState(1);
  const [state, setState] = useState<WizardState>(initialState);
  const [running, setRunning] = useState(false);
  const [resultReady, setResultReady] = useState(false);

  const step = ASSESSMENT_STEPS[index - 1];
  const isFirst = index === 1;
  const isReview = step.id === "review";
  const isResult = step.id === "result";
  const progress = Math.round(((index - 1) / (ASSESSMENT_STEPS.length - 1)) * 100);

  const toggle = (key: keyof WizardState, value: string) =>
    setState((s) => {
      const arr = s[key] as string[];
      return { ...s, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });

  const goNext = () => {
    if (isReview) {
      setIndex(ASSESSMENT_STEPS.length);
      setRunning(true);
      setResultReady(false);
      return;
    }
    setIndex((i) => Math.min(ASSESSMENT_STEPS.length, i + 1));
  };
  const goBack = () => setIndex((i) => Math.max(1, i - 1));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[248px_1fr]">
        {/* Step rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <p className="eyebrow mb-3">DPDP assessment</p>
            <ol className="space-y-1">
              {ASSESSMENT_STEPS.map((s) => {
                const isDone = s.index < index;
                const isCurrent = s.index === index;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => !running && s.index <= index && setIndex(s.index)}
                      disabled={running || s.index > index}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                        isCurrent
                          ? "bg-emerald-deep text-bone"
                          : isDone
                            ? "text-ink-soft hover:bg-beige-light"
                            : "text-ink-muted",
                        s.index > index && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] tabular",
                          isCurrent
                            ? "bg-beige text-emerald-deep"
                            : isDone
                              ? "bg-emerald-light/15 text-emerald-light"
                              : "border border-line-strong text-ink-muted",
                        )}
                      >
                        {isDone ? <Check className="h-3 w-3" /> : s.index}
                      </span>
                      <span className="truncate">{s.shortTitle}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        {/* Content */}
        <div>
          {/* Mobile progress */}
          <div className="mb-5 lg:hidden">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-ink">
                Step {index} of {ASSESSMENT_STEPS.length}
              </span>
              <span className="text-ink-muted">{step.shortTitle}</span>
            </div>
            <ProgressBar value={progress} tone="brand" />
          </div>

          <div className="mb-6 hidden items-center gap-3 lg:flex">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-beige">
              <div className="h-full rounded-full bg-emerald-light transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="tabular text-xs text-ink-muted">{progress}%</span>
          </div>

          {isResult ? (
            <ResultStep
              running={running}
              resultReady={resultReady}
              onComplete={() => {
                setRunning(false);
                setResultReady(true);
              }}
              onFinish={() => {
                notify("Assessment saved to your workspace.", "success");
                navigate("/dashboard");
              }}
              onViewFindings={() => navigate("/findings")}
            />
          ) : (
            <>
              <header className="mb-5">
                <p className="eyebrow">{step.title}</p>
                <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{step.description}</h1>
              </header>

              <div className="space-y-6">
                <StepBody step={step} state={state} toggle={toggle} setState={setState} org={org} notify={notify} />
                <LegalRationale step={step} />
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
                <Button variant="ghost" onClick={goBack} disabled={isFirst}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={goNext}>
                  {isFirst ? "Begin assessment" : isReview ? "Run analysis" : "Continue"}
                  {isReview ? <ArrowRight className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The legal rationale panel shown on every step. This is the heart of the
// "explain why we ask" promise: plain-language reason + concise DPDP context.
// ---------------------------------------------------------------------------
function LegalRationale({ step }: { step: AssessmentStepMeta }) {
  const [open, setOpen] = useState(true);
  return (
    <Card padded={false} className="overflow-hidden border-emerald-light/25 bg-emerald-soft/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-deep text-beige">
          <Scale className="h-4 w-4" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-ink">Why we ask this</span>
          <span className="block text-xs text-ink-muted">Plain-language reason and DPDP context</span>
        </span>
        <ChevronRight className={cn("h-4 w-4 text-ink-muted transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-emerald-light/20 px-5 py-4">
          <p className="text-sm leading-relaxed text-ink-soft">{step.whyWeAsk}</p>
          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-white/70 p-3">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-light" />
            <div>
              <p className="text-sm leading-relaxed text-ink-soft">{step.dpdpContext}</p>
              <p className="mt-1.5 font-mono text-xs text-emerald-light">DPDP {step.dpdpRef}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step bodies
// ---------------------------------------------------------------------------
function StepBody({
  step,
  state,
  toggle,
  setState,
  org,
  notify,
}: {
  step: AssessmentStepMeta;
  state: WizardState;
  toggle: (key: keyof WizardState, value: string) => void;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  org: ReturnType<typeof useOrg>["org"];
  notify: (m: string, tone?: "success" | "info" | "warning") => void;
}) {
  switch (step.id) {
    case "welcome":
      return (
        <Card>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-deep text-beige">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">A guided baseline, in about ten minutes</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                We will walk through six trust pillars, confirm what we already detected about{" "}
                <span className="font-medium text-ink">{org.displayName}</span>, and ask you to fill the gaps.
                Every question shows why it matters and which part of the DPDP Act it maps to. Nothing here is
                filed with any regulator; this builds your private baseline.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniFact icon={Layers} label="6 pillars" hint="Weighted evaluation" />
            <MiniFact icon={ClipboardList} label="14 steps" hint="Short, guided" />
            <MiniFact icon={ShieldCheck} label="Evidence-backed" hint="Traceable findings" />
          </div>
        </Card>
      );

    case "organization":
      return (
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Legal entity name" defaultValue={org.legalName} icon={<ShieldCheck className="h-4 w-4" />} />
            <Input label="CIN" defaultValue={org.cin} />
            <Input label="Grievance officer" defaultValue={org.grievanceOfficer} icon={<UserCheck className="h-4 w-4" />} />
            <Input label="Grievance email" defaultValue={org.grievanceEmail} />
            <div className="sm:col-span-2">
              <Input label="Registered address" defaultValue={org.registeredAddress} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-canvas p-3 text-sm text-ink-soft">
            <Info className="h-4 w-4 shrink-0 text-ink-muted" />
            A named, reachable grievance contact is a specific DPDP obligation, shown under Section 8(9).
          </div>
        </Card>
      );

    case "infrastructure":
      return (
        <div className="space-y-4">
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Primary domain" defaultValue={org.primaryDomain} icon={<Globe className="h-4 w-4" />} />
              <Input label="Application domain" defaultValue={org.appDomain ?? `app.${org.primaryDomain}`} icon={<Globe className="h-4 w-4" />} />
            </div>
          </Card>
          <Card padded={false}>
            <div className="border-b border-line px-5 py-3.5">
              <p className="text-sm font-semibold text-ink">Detected integrations</p>
              <p className="text-xs text-ink-muted">Third-party scripts observed loading on your site</p>
            </div>
            <div className="divide-y divide-line">
              {DETECTED_INTEGRATIONS.map((i) => (
                <div key={i.id} className="flex items-center gap-3 px-5 py-3">
                  <Boxes className="h-4 w-4 text-ink-muted" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{i.name}</p>
                    <p className="text-xs text-ink-muted">{i.category}</p>
                  </div>
                  <Badge tone={riskTone[i.risk]}>{i.risk} risk</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );

    case "collection":
      return (
        <Card>
          <p className="text-sm text-ink-soft">
            Confirm the channels where personal data enters your systems. These map to the collection points
            we assess for lawful basis.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {["Website forms", "Mobile application", "Payment checkout", "Support tickets", "Server & API logs", "Marketing sign-ups"].map(
              (c) => (
                <div key={c} className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-light/15 text-emerald-light">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-ink">{c}</span>
                </div>
              ),
            )}
          </div>
        </Card>
      );

    case "categories":
      return (
        <SelectGrid>
          {PERSONAL_DATA_CATEGORIES.map((c) => (
            <OptionCard
              key={c.id}
              selected={state.categories.includes(c.id)}
              onClick={() => toggle("categories", c.id)}
              title={c.name}
              description={c.description}
              badge={<Badge tone={sensitivityTone[c.sensitivity]}>{c.sensitivity}</Badge>}
              footnote={c.examples.join(" · ")}
            />
          ))}
        </SelectGrid>
      );

    case "purpose":
      return (
        <SelectGrid>
          {PROCESSING_PURPOSES.map((p) => (
            <OptionCard
              key={p.id}
              selected={state.purposes.includes(p.id)}
              onClick={() => toggle("purposes", p.id)}
              title={p.name}
              description={p.description}
              icon={Target}
            />
          ))}
        </SelectGrid>
      );

    case "consent":
      return (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2">
              <LanguagesIcon className="h-4 w-4 text-emerald-light" />
              <p className="text-sm font-semibold text-ink">Languages your notice is available in</p>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              DPDP expects notice in English or any language in the Eighth Schedule. Select all you offer.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((l) => {
                const on = state.languages.includes(l.code);
                return (
                  <button
                    key={l.code}
                    onClick={() => toggle("languages", l.code)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      on
                        ? "border-emerald-deep bg-emerald-deep text-bone"
                        : "border-line-strong bg-white text-ink-soft hover:border-emerald-light/50",
                    )}
                  >
                    {l.native}
                    <span className={cn("ml-1.5 text-xs", on ? "text-beige/70" : "text-ink-muted")}>{l.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card>
            <SwitchRow
              label="Consent can be withdrawn as easily as it is given"
              hint="A one-tap withdrawal path is expected under Section 6"
              checked
              onChange={() => {}}
            />
            <div className="my-2 h-px bg-line" />
            <SwitchRow
              label="A clear, itemised notice is shown before consent"
              hint="Purpose, categories, and rights stated up front"
              checked
              onChange={() => {}}
            />
          </Card>
        </div>
      );

    case "retention":
      return (
        <Card>
          <Select
            label="Default retention schedule"
            options={RETENTION_OPTIONS}
            value={state.retention}
            onChange={(e) => setState((s) => ({ ...s, retention: e.target.value }))}
          />
          <div className="mt-4">
            <SwitchRow
              label="Erasure runs automatically when the schedule is reached"
              hint="Manual-only erasure is a common gap"
              checked={state.erasureAutomated}
              onChange={() => setState((s) => ({ ...s, erasureAutomated: !s.erasureAutomated }))}
            />
          </div>
          {state.retention === "No defined schedule" && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-ink-soft">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              Holding data with no defined schedule tends to raise a finding. A simple written schedule usually
              resolves it.
            </div>
          )}
        </Card>
      );

    case "rights":
      return (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">
            Mark the rights you can honour today within a reasonable time. Unchecked rights become priorities,
            not penalties.
          </p>
          <div className="space-y-2.5">
            {DATA_RIGHTS.map((r) => {
              const on = state.rights.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggle("rights", r.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors",
                    on ? "border-emerald-light/50" : "border-line hover:border-line-strong",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                      on ? "border-emerald-deep bg-emerald-deep text-bone" : "border-line-strong text-transparent",
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{r.name}</p>
                    <p className="text-xs text-ink-muted">{r.detail}</p>
                  </div>
                  <UserCheck className={cn("h-4 w-4", on ? "text-emerald-light" : "text-ink-muted")} />
                </button>
              );
            })}
          </div>
        </div>
      );

    case "security":
      return (
        <div className="space-y-4">
          <Card padded={false}>
            <div className="divide-y divide-line">
              {SECURITY_CONTROLS.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Lock className="h-4 w-4 text-emerald-light" />
                  <span className="flex-1 text-sm text-ink">{c.label}</span>
                  <span className="text-sm font-medium text-ink">{c.value}</span>
                  <Badge tone="success">
                    <Check className="h-3 w-3" /> Verified
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SwitchRow
              label="A written breach response plan exists and has been rehearsed"
              hint="Section 8(6) expects prompt breach handling and notification"
              checked={state.breachPlan}
              onChange={() => setState((s) => ({ ...s, breachPlan: !s.breachPlan }))}
            />
          </Card>
        </div>
      );

    case "processors":
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            For each processor, confirm a data processing contract is in place. You stay accountable for data
            they handle on your behalf.
          </p>
          {DETECTED_INTEGRATIONS.map((i) => {
            const on = state.processors.includes(i.id);
            return (
              <div key={i.id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
                <Handshake className="h-4 w-4 text-ink-muted" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{i.name}</p>
                  <p className="text-xs text-ink-muted">{i.category}</p>
                </div>
                <SwitchRow compact label="Contract in place" checked={on} onChange={() => toggle("processors", i.id)} />
              </div>
            );
          })}
        </div>
      );

    case "evidence":
      return (
        <div className="space-y-4">
          <button
            onClick={() => notify("Document upload is mocked in this demo.", "info")}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-canvas px-6 py-10 text-center transition-colors hover:border-emerald-light/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-beige-light text-emerald-light">
              <FileUp className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-ink">Upload privacy policy, DPA, or audit reports</span>
            <span className="text-xs text-ink-muted">PDF or DOCX up to 10 MB</span>
          </button>
          <Card padded={false}>
            <div className="border-b border-line px-5 py-3">
              <p className="text-sm font-semibold text-ink">Already attached</p>
            </div>
            <div className="divide-y divide-line">
              {UPLOADED_DOCUMENTS.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <Paperclip className="h-4 w-4 text-ink-muted" />
                  <span className="flex-1 truncate text-sm text-ink">{d.name}</span>
                  <span className="tabular text-xs text-ink-muted">{d.sizeLabel}</span>
                  <Badge tone={d.status === "Verified" ? "success" : "info"}>{d.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );

    case "review":
      return <ReviewStep state={state} org={org} />;

    default:
      return null;
  }
}

function ReviewStep({ state, org }: { state: WizardState; org: ReturnType<typeof useOrg>["org"] }) {
  const catNames = PERSONAL_DATA_CATEGORIES.filter((c) => state.categories.includes(c.id)).map((c) => c.name);
  const purposeNames = PROCESSING_PURPOSES.filter((p) => state.purposes.includes(p.id)).map((p) => p.name);
  const langNames = SUPPORTED_LANGUAGES.filter((l) => state.languages.includes(l.code)).map((l) => l.name);
  const rightNames = DATA_RIGHTS.filter((r) => state.rights.includes(r.id)).map((r) => r.name);
  const missingRights = DATA_RIGHTS.filter((r) => !state.rights.includes(r.id)).map((r) => r.name);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-ink-soft">
          Confirm your responses. You can go back and adjust any step before running the analysis.
        </p>
        <dl className="mt-4 divide-y divide-line">
          <ReviewRow label="Entity" value={org.legalName} />
          <ReviewRow label="Grievance officer" value={`${org.grievanceOfficer} · ${org.grievanceEmail}`} />
          <ReviewRow label="Data categories" value={catNames.join(", ")} />
          <ReviewRow label="Processing purposes" value={purposeNames.join(", ")} />
          <ReviewRow label="Notice languages" value={langNames.join(", ")} />
          <ReviewRow label="Rights supported" value={rightNames.join(", ") || "None marked"} />
          <ReviewRow label="Retention" value={state.retention} />
          <ReviewRow label="Automated erasure" value={state.erasureAutomated ? "Yes" : "No"} />
          <ReviewRow label="Breach response plan" value={state.breachPlan ? "Yes" : "Not confirmed"} />
        </dl>
      </Card>
      {(missingRights.length > 0 || !state.breachPlan) && (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-ink-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            The analysis is likely to raise items around{" "}
            <span className="font-medium text-ink">
              {[missingRights.length > 0 && "unsupported data rights", !state.breachPlan && "breach readiness"]
                .filter(Boolean)
                .join(" and ")}
            </span>
            . That is expected. These become tracked priorities, not a failing grade.
          </span>
        </div>
      )}
    </div>
  );
}

function ResultStep({
  running,
  resultReady,
  onComplete,
  onFinish,
  onViewFindings,
}: {
  running: boolean;
  resultReady: boolean;
  onComplete: () => void;
  onFinish: () => void;
  onViewFindings: () => void;
}) {
  const { org } = useOrg();
  const priorities = useMemo(
    () =>
      [...FINDINGS]
        .filter((f) => f.status !== "REMEDIATED")
        .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
        .slice(0, 3),
    [],
  );

  if (running && !resultReady) {
    return (
      <ProcessingVisual
        stages={ANALYSIS_STAGES}
        stageMs={620}
        onComplete={onComplete}
        title="Analysing your responses"
        subtitle="Combining your answers with observed signals"
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="bg-emerald-deep text-bone" padded={false}>
        <div className="flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left">
          <ScoreRing score={org.trustScore} size={120} label="Trust Score" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-beige/80">Assessment complete</p>
            <p className="mt-1 font-display text-2xl font-semibold text-bone">{org.posture}</p>
            <p className="mt-2 max-w-md text-sm text-bone/80">
              Your baseline is set. This reflects your responses combined with what we observed. It is a working
              posture you can improve, not a compliance certificate.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {PILLARS.slice(0, 3).map((p) => (
          <Card key={p.id}>
            <p className="text-sm text-ink-muted">{p.name}</p>
            <p className="tabular mt-1 font-display text-2xl font-semibold text-ink">{p.score}</p>
            <ProgressBar
              className="mt-2"
              value={p.score}
              tone={p.score >= 80 ? "success" : p.score >= 65 ? "warning" : "danger"}
            />
          </Card>
        ))}
      </div>

      <Card>
        <p className="font-display font-semibold text-ink">What to fix first</p>
        <div className="mt-3 space-y-2.5">
          {priorities.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  f.severity === "HIGH" ? "bg-danger" : f.severity === "MEDIUM" ? "bg-warning" : "bg-info",
                )}
              />
              <span className="flex-1 text-sm text-ink">{f.title}</span>
              <Badge tone="neutral">{f.pillar}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onViewFindings}>
          View all findings
        </Button>
        <Button onClick={onFinish}>
          Go to dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function severityRank(s: string) {
  return s === "HIGH" ? 3 : s === "MEDIUM" ? 2 : 1;
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function SelectGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function OptionCard({
  selected,
  onClick,
  title,
  description,
  badge,
  footnote,
  icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  badge?: React.ReactNode;
  footnote?: string;
  icon?: typeof Target;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border bg-white p-4 text-left transition-all",
        selected ? "border-emerald-deep ring-1 ring-emerald-deep/20" : "border-line hover:border-line-strong",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-emerald-light" />}
          <p className="font-medium text-ink">{title}</p>
        </div>
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            selected ? "border-emerald-deep bg-emerald-deep text-bone" : "border-line-strong text-transparent",
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{description}</p>
      <div className="mt-2 flex items-center gap-2">
        {badge}
        {footnote && <span className="truncate text-xs text-ink-muted">{footnote}</span>}
      </div>
    </button>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
  compact,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
  compact?: boolean;
}) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-3", !compact && "justify-between")}>
      {!compact && (
        <span>
          <span className="block text-sm font-medium text-ink">{label}</span>
          {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-emerald-deep" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      {compact && <span className="text-xs text-ink-soft">{label}</span>}
    </label>
  );
}

function MiniFact({ icon: Icon, label, hint }: { icon: typeof Layers; label: string; hint: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-3">
      <Icon className="h-4 w-4 text-emerald-light" />
      <p className="mt-1.5 text-sm font-semibold text-ink">{label}</p>
      <p className="text-xs text-ink-muted">{hint}</p>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink sm:max-w-[60%] sm:text-right">{value}</dd>
    </div>
  );
}
