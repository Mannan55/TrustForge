import { Link } from "react-router-dom";
import { ArrowRight, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { ProgressBar } from "@/components/common/ProgressBar";
import { PageSkeleton } from "@/components/common/Skeleton";
import { useOrg } from "@/context/OrgContext";
import { useAsync } from "@/hooks/useAsync";
import { orgService } from "@/services";
import { cn } from "@/lib/cn";
import type { Pillar } from "@/types";

export function TrustScorePage() {
  const { org } = useOrg();
  const { data: pillars, loading } = useAsync(() => orgService.getPillars(), []);
  if (loading || !pillars) return <PageSkeleton />;

  const coverage = Math.round(pillars.reduce((s, p) => s + p.evidenceCoverage, 0) / pillars.length);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trust Score"
        title="How your posture is scored"
        subtitle="A weighted read across six pillars of the TrustForge Evaluation Framework, each mapped to DPDP obligations."
        actions={
          <Link to="/reports">
            <Button variant="outline" size="sm">
              Export report <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      {/* Summary band */}
      <Card className="bg-emerald-deep text-bone" padded={false}>
        <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center">
          <div className="flex items-center gap-6">
            <div className="rounded-2xl bg-emerald-dark/40 p-4">
              <ScoreRingDark score={org.trustScore} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-beige/80">Current score</p>
              <p className="mt-1 font-display text-4xl font-semibold text-bone tabular">{org.trustScore}</p>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-beige px-2.5 py-0.5 text-xs font-medium text-emerald-deep">
                  {org.posture}
                </span>
              </div>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
            <DarkStat label="Evidence coverage" value={`${coverage}%`} />
            <DarkStat label="Pillars assessed" value={`${pillars.length}`} />
            <DarkStat label="Framework" value="TrustForge TEF" />
          </div>
        </div>
      </Card>

      {/* How it is calculated */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-beige-light text-emerald-light">
            <Info className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display font-semibold text-ink">How the score is calculated</p>
            <p className="mt-1 text-sm text-ink-soft">
              Each pillar is scored from 0 to 100 and carries a weight. Your Trust Score is the
              weighted average. Coverage indicates how much of a pillar is backed by observed
              evidence rather than self-declaration, so a high score with low coverage is treated as
              less certain.
            </p>
          </div>
        </div>
      </Card>

      {/* Pillars */}
      <div className="grid gap-5 lg:grid-cols-2">
        {pillars.map((p) => (
          <PillarCard key={p.id} pillar={p} />
        ))}
      </div>
    </div>
  );
}

function PillarCard({ pillar }: { pillar: Pillar }) {
  return (
    <Card>
      <CardHeader
        title={pillar.name}
        description={pillar.description}
        action={<span className="tabular font-display text-2xl font-semibold text-ink">{pillar.score}</span>}
      />
      <div className="mt-4 flex items-center gap-3">
        <ProgressBar value={pillar.score} className="flex-1" tone={pillar.score >= 80 ? "success" : pillar.score >= 65 ? "warning" : "danger"} />
        <TrendPill trend={pillar.trend} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-xs">
        <span className="text-ink-muted">Weight {pillar.weight}%</span>
        <span className="text-ink-muted">Evidence coverage {pillar.evidenceCoverage}%</span>
      </div>

      <dl className="mt-4 space-y-2">
        {pillar.metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between text-sm">
            <dt className="text-ink-soft">{m.label}</dt>
            <dd className="font-medium text-ink">{m.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function TrendPill({ trend }: { trend: number }) {
  const tone = trend > 0 ? "success" : trend < 0 ? "danger" : "neutral";
  const Icon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  return (
    <Badge tone={tone}>
      <Icon className="h-3.5 w-3.5" />
      {trend > 0 ? "+" : ""}
      {trend} pts
    </Badge>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-mid bg-emerald-dark/40 px-4 py-3">
      <p className="text-xs text-bone/60">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold text-bone tabular">{value}</p>
    </div>
  );
}

/** Score ring tuned for the dark summary band. */
function ScoreRingDark({ score }: { score: number }) {
  const size = 96;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, score) / 100) * c;
  return (
    <div className={cn("relative inline-flex items-center justify-center")} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="#164030" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="#e3cfae"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute tabular font-display text-xl font-semibold text-bone">{score}</span>
    </div>
  );
}
