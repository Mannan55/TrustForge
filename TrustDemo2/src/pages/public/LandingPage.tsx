import { Link } from "react-router-dom";
import {
  ArrowRight,
  ScanLine,
  ClipboardCheck,
  ListTodo,
  ShieldCheck,
  FileCheck2,
  Globe,
  Languages,
  Lock,
  Building2,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { ScoreRing } from "@/components/common/ScoreRing";
import { ProgressBar } from "@/components/common/ProgressBar";
import { PILLARS } from "@/data/assessmentData";

const STEPS = [
  {
    icon: ScanLine,
    title: "Scan your website",
    body: "Point TrustForge at your domain. It reviews transport security, your privacy notice, consent handling, and third-party trackers, then returns a preliminary posture.",
  },
  {
    icon: ClipboardCheck,
    title: "Complete the assessment",
    body: "A guided review across six trust pillars. Each question explains why it is asked and which part of the DPDP Act it maps to, so nothing feels arbitrary.",
  },
  {
    icon: ListTodo,
    title: "Act on clear findings",
    body: "Every finding names the problem, why it matters, the evidence behind it, and the specific fix. You get a short, ordered list, not a wall of alerts.",
  },
];

const CAPABILITIES = [
  { icon: FileCheck2, title: "Evidence, not claims", body: "Findings trace back to a scan result or an uploaded document. Self-declaration is labelled as such." },
  { icon: Globe, title: "Website scanning", body: "Observes your live site the way a data principal would, from consent banners to tracker timing." },
  { icon: Languages, title: "India-first notice checks", body: "Flags where a privacy notice is missing in the regional languages your users actually read." },
  { icon: Lock, title: "Security posture", body: "Checks encryption in transit and at rest, access control, and breach readiness as reasonable safeguards." },
  { icon: Building2, title: "Accountability mapping", body: "Confirms a named grievance officer and published contact, as the Act expects of a Data Fiduciary." },
  { icon: ShieldCheck, title: "Scoped to DPDP 2023", body: "No borrowed GDPR modules. Every control maps to India's Digital Personal Data Protection Act." },
];

export function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <Badge tone="brand" className="mb-5">
              Built for India's DPDP Act, 2023
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Know where your data protection posture really stands.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              TrustForge helps Indian startups and SMEs assess their DPDP readiness with website
              scanning, a guided assessment, and findings backed by evidence. No jargon, no checkbox
              theatre.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/scan">
                <Button size="lg" className="w-full sm:w-auto">
                  Run a free website scan
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Start an assessment
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-muted">
              A public scan needs no account. It returns a preliminary view, not a compliance
              certificate.
            </p>
          </div>

          {/* Product visual: a real Trust Score panel, no decorative AI graphics */}
          <div className="relative">
            <Card className="relative z-10 shadow-[0_20px_60px_-24px_rgba(15,46,34,0.35)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Trust Score</p>
                  <p className="mt-1 font-display text-lg font-semibold text-ink">TechNova Solutions</p>
                </div>
                <Badge tone="success">Strong Alignment</Badge>
              </div>
              <div className="mt-6 flex items-center gap-6">
                <ScoreRing score={89} size={128} />
                <div className="flex-1 space-y-3">
                  {PILLARS.slice(0, 4).map((p) => (
                    <ProgressBar key={p.id} value={p.score} label={p.name} showValue />
                  ))}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
                <MiniStat label="Findings" value="6" />
                <MiniStat label="Evidence items" value="24" />
                <MiniStat label="DPDP pillars" value="6" />
              </div>
            </Card>
            <div className="absolute -right-6 -top-6 -z-0 h-40 w-40 rounded-full bg-beige/50 blur-2xl" aria-hidden />
            <div className="absolute -bottom-8 -left-6 -z-0 h-40 w-40 rounded-full bg-emerald-soft blur-2xl" aria-hidden />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-6 text-sm text-ink-muted sm:px-6">
          <span className="font-medium text-ink-soft">Purpose-built for the Indian data landscape</span>
          <Divider />
          <span>DPDP Act 2023 aligned</span>
          <Divider />
          <span>Evidence-backed findings</span>
          <Divider />
          <span>Data residency in India</span>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">How it works</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Three steps from unsure to a clear plan.
            </h2>
            <p className="mt-3 text-ink-soft">
              TrustForge answers one question at a time and shows its reasoning, so you always know
              what a result means and what to do next.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Card key={s.title} className="relative">
                <span className="absolute right-5 top-5 font-display text-sm font-semibold text-line-strong tabular">
                  0{i + 1}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-deep text-bone">
                  <s.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-y border-line bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">What you get</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Substance over signals.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="rounded-2xl border border-line bg-canvas p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-beige-light text-emerald-light">
                  <c.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">{c.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Framework */}
      <section id="framework" className="scroll-mt-20 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-2">The framework</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Six pillars, one honest score.
            </h2>
            <p className="mt-3 text-ink-soft">
              Your Trust Score is a weighted read across six pillars of the TrustForge Evaluation
              Framework, each mapped to specific DPDP obligations. Coverage shows how much of each
              pillar is backed by real evidence rather than self-declaration.
            </p>
            <div className="mt-6 space-y-3">
              <Distinction
                good="Preliminary TrustForge Assessment"
                bad="DPDP compliant"
                note="A scan or assessment gives you a posture. It does not certify legal compliance."
              />
              <Distinction
                good="Verified entity identity"
                bad="Proven authorization"
                note="Confirming a GSTIN shows the entity exists. Domain verification confirms you can act for it."
              />
            </div>
          </div>
          <Card padded={false} className="overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <p className="font-display text-sm font-semibold text-ink">Trust pillars</p>
            </div>
            <div className="divide-y divide-line">
              {PILLARS.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">{p.name}</span>
                      <span className="tabular text-sm font-semibold text-ink">{p.score}</span>
                    </div>
                    <ProgressBar value={p.score} className="mt-1.5" />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs text-ink-muted tabular">
                    {p.weight}% weight
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-emerald-deep px-8 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold text-bone">
            See your posture in minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-bone/70">
            Start with a free website scan, then move into the full assessment when you are ready.
            Your evidence stays in your workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/scan">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Run a free scan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                size="lg"
                className="w-full border border-bone/25 bg-transparent text-bone hover:bg-emerald-hover sm:w-auto"
              >
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="tabular font-display text-xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

function Divider() {
  return <span className="hidden h-4 w-px bg-line-strong sm:block" aria-hidden />;
}

function Distinction({ good, bad, note }: { good: string; bad: string; note: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-success">
          <CircleCheck className="h-4 w-4" /> {good}
        </span>
        <span className="inline-flex items-center gap-1.5 text-ink-muted line-through">
          <CircleAlert className="h-4 w-4" /> {bad}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{note}</p>
    </div>
  );
}
