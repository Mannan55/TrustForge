import { Link } from "react-router-dom";
import {
  ArrowRight,
  Gauge,
  ListChecks,
  FolderCheck,
  CalendarClock,
  ScanLine,
  ClipboardCheck,
  ChevronRight,
  BookOpen,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { ScoreRing } from "@/components/common/ScoreRing";
import { ProgressBar } from "@/components/common/ProgressBar";
import { SeverityBadge, FindingStatusBadge } from "@/components/common/Badge";
import { PageSkeleton } from "@/components/common/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { useAsync } from "@/hooks/useAsync";
import { orgService, findingsService, remediationService } from "@/services";
import { DATA_RIGHTS } from "@/data/dpdpFramework";
import { postureTone } from "@/lib/format";
import type { Severity } from "@/types";

const severityRank: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function DashboardPage() {
  const { user } = useAuth();
  if (user?.accountMode === "personal") return <PersonalDashboard />;
  return <OrgDashboard />;
}

function OrgDashboard() {
  const { user } = useAuth();
  const { org } = useOrg();
  const { data: pillars, loading: pl } = useAsync(() => orgService.getPillars(), []);
  const { data: findings, loading: fl } = useAsync(() => findingsService.list(), []);
  const { data: tasks, loading: tl } = useAsync(() => remediationService.list(), []);

  if (pl || fl || tl || !pillars || !findings || !tasks) return <PageSkeleton />;

  const open = findings.filter((f) => f.status !== "REMEDIATED" && f.status !== "DISMISSED");
  const priority = [...open].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]).slice(0, 3);
  const coverage = Math.round(pillars.reduce((s, p) => s + p.evidenceCoverage, 0) / pillars.length);
  const doneTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title={`Good to see you, ${firstName}`}
        subtitle={`${org.displayName} was last assessed on ${org.lastAssessed}.`}
        actions={
          <Link to="/website-scan">
            <Button variant="outline" size="sm">
              <ScanLine className="h-4 w-4" /> Run website scan
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Trust Score"
          value={org.trustScore}
          icon={<Gauge className="h-4.5 w-4.5" />}
          hint={org.posture}
        />
        <StatCard label="Open findings" value={open.length} icon={<ListChecks className="h-4.5 w-4.5" />} hint="Across 6 pillars" />
        <StatCard label="Evidence coverage" value={`${coverage}%`} icon={<FolderCheck className="h-4.5 w-4.5" />} hint="Backed by scan or document" />
        <StatCard label="Next review" value="30 days" icon={<CalendarClock className="h-4.5 w-4.5" />} hint="Recommended cadence" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trust score summary */}
        <Card className="lg:col-span-2">
          <CardHeader
            eyebrow="Trust Score"
            title="Posture across six pillars"
            action={
              <Link to="/trust-score">
                <Button variant="ghost" size="sm">
                  Details <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          />
          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex flex-col items-center gap-2">
              <ScoreRing score={org.trustScore} size={132} />
              <Badge tone={postureTone(org.posture)}>{org.posture}</Badge>
            </div>
            <div className="flex-1 space-y-3">
              {pillars.map((p) => (
                <ProgressBar key={p.id} value={p.score} label={p.name} showValue />
              ))}
            </div>
          </div>
        </Card>

        {/* Remediation progress */}
        <Card>
          <CardHeader eyebrow="Remediation" title="Fix progress" />
          <div className="mt-5 flex items-center gap-4">
            <ScoreRing score={Math.round((doneTasks / tasks.length) * 100)} size={92} label="complete" />
            <div>
              <p className="tabular font-display text-2xl font-semibold text-ink">
                {doneTasks}/{tasks.length}
              </p>
              <p className="text-sm text-ink-muted">tasks resolved</p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {tasks.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${t.status === "COMPLETED" ? "bg-success" : t.status === "IN_PROGRESS" ? "bg-info" : "bg-line-strong"}`}
                />
                <span className="truncate text-ink-soft">{t.title}</span>
              </div>
            ))}
          </div>
          <Link to="/remediation" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-light hover:underline">
            Open remediation plan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>

      {/* Priority findings */}
      <Card padded={false}>
        <div className="flex items-center justify-between px-6 py-4">
          <CardHeader eyebrow="Priority" title="Findings to address first" />
          <Link to="/findings">
            <Button variant="ghost" size="sm">
              All findings <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-line border-t border-line">
          {priority.map((f) => (
            <Link
              key={f.id}
              to="/findings"
              className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-beige-light/40"
            >
              <span className="mt-0.5 font-mono text-xs text-ink-muted">{f.id}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{f.title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{f.affectedArea}</p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <SeverityBadge severity={f.severity} />
                <FindingStatusBadge status={f.status} />
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction to="/assessment" icon={ClipboardCheck} title="Continue assessment" body="Review your answers across the six pillars." />
        <QuickAction to="/evidence" icon={FolderCheck} title="Manage evidence" body="Attach documents to strengthen your posture." />
        <QuickAction to="/reports" icon={ShieldCheck} title="Generate report" body="Export a shareable posture summary." />
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: string;
  icon: typeof ClipboardCheck;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-line bg-white p-5 transition-colors hover:border-emerald-light/40 hover:bg-beige-light/30"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-beige-light text-emerald-light">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 flex items-center gap-1 font-display font-semibold text-ink">
        {title}
        <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </p>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
    </Link>
  );
}

function PersonalDashboard() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your space"
        title={`Hello, ${firstName}`}
        subtitle="Explore your rights under the DPDP Act and check the sites you use. No organization needed."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col justify-between bg-emerald-deep text-bone">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-beige text-emerald-deep">
              <ScanLine className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-bone">Scan a website</h3>
            <p className="mt-2 text-sm text-bone/70">
              Check whether a site you use handles consent, privacy notices, and trackers the way it
              should.
            </p>
          </div>
          <Link to="/website-scan" className="mt-5">
            <Button variant="secondary">
              Run a scan <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-beige-light text-emerald-light">
              <Building2 className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">Run this for a business?</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Set up an organization workspace to assess DPDP posture with evidence, scanning, and a
              full Trust Score.
            </p>
          </div>
          <Link to="/onboarding" className="mt-5">
            <Button variant="outline">
              Create organization <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader
          eyebrow="Know your rights"
          title="What the DPDP Act gives you"
          description="As a Data Principal, you can exercise these rights with any organization that holds your data."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {DATA_RIGHTS.map((r) => (
            <div key={r.id} className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-beige-light text-emerald-light">
                <BookOpen className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium text-ink">{r.name}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <Link to="/rights" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-emerald-light hover:underline">
          Learn more about your rights <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Card>
    </div>
  );
}
