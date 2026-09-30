import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  ClipboardCheck,
  ScanLine,
  ArrowRight,
  CircleCheck,
  TriangleAlert,
  FileSearch,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { StatCard } from "@/components/common/StatCard";
import { PageSkeleton } from "@/components/common/Skeleton";
import { HBars, DonutChart, Sparkline } from "@/components/charts/Charts";
import { useAsync } from "@/hooks/useAsync";
import { adminService } from "@/services";
import {
  PLATFORM_KPIS,
  TRUST_DISTRIBUTION,
  ASSESSMENT_TREND,
  COMMON_GAPS,
} from "@/data/adminData";
import { cn } from "@/lib/cn";
import { Table, scanStateTone, reviewStatusTone, ConfidenceMeter, type Column } from "./shared";
import type { AdminScan, ServiceStatus } from "@/types";

const serviceDot: Record<ServiceStatus, string> = {
  Operational: "bg-success",
  Degraded: "bg-warning",
  Down: "bg-danger",
};

export function AdminOverviewPage() {
  const navigate = useNavigate();
  const { data: scans } = useAsync(() => adminService.scans(), []);
  const { data: reviews } = useAsync(() => adminService.aiReviews(), []);
  const { data: health } = useAsync(() => adminService.systemHealth(), []);

  if (!scans || !reviews || !health) return <PageSkeleton />;

  const degraded = health.filter((s) => s.status !== "Operational");
  const pendingReviews = reviews.filter((r) => r.status !== "Reviewed");
  const trendValues = ASSESSMENT_TREND.map((t) => t.value);

  const scanColumns: Column<AdminScan>[] = [
    { key: "url", header: "Target", render: (s) => <span className="font-medium text-ink">{s.url}</span> },
    { key: "organization", header: "Organization", hideOnMobile: true },
    { key: "state", header: "State", render: (s) => <Badge tone={scanStateTone[s.state]}>{s.state}</Badge> },
    {
      key: "score",
      header: "Score",
      align: "right",
      render: (s) => <span className="tabular font-medium text-ink">{s.score ?? "—"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Command Center"
        subtitle="Activity and health across every tenant."
        actions={
          <Badge tone={degraded.length ? "warning" : "success"}>
            {degraded.length ? <TriangleAlert className="h-3.5 w-3.5" /> : <CircleCheck className="h-3.5 w-3.5" />}
            {degraded.length ? `${degraded.length} service degraded` : "All systems operational"}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations" value={PLATFORM_KPIS.organizations} icon={<Building2 className="h-4 w-4" />} hint="Active tenants" />
        <StatCard label="Active users" value={PLATFORM_KPIS.activeUsers} icon={<Users className="h-4 w-4" />} hint="Across all tenants" />
        <StatCard label="Assessments" value={PLATFORM_KPIS.assessments} icon={<ClipboardCheck className="h-4 w-4" />}>
          <Sparkline values={trendValues} width={90} height={28} tone="brand" />
        </StatCard>
        <StatCard label="Website scans" value={PLATFORM_KPIS.websiteScans.toLocaleString("en-IN")} icon={<ScanLine className="h-4 w-4" />} hint="Lifetime" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padded={false}>
            <div className="flex items-center justify-between px-6 py-4">
              <CardHeader title="Recent website scans" eyebrow="Assessment ops" />
              <Link to="/admin/scans" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-light hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="px-4 pb-4">
              <Table columns={scanColumns} rows={scans.slice(0, 5)} onRowClick={() => navigate("/admin/scans")} />
            </div>
          </Card>
        </div>

        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-emerald-light" />
              <p className="font-display text-sm font-semibold text-ink">Needs review</p>
            </div>
            <Badge tone="warning">{pendingReviews.length}</Badge>
          </div>
          <div className="divide-y divide-line">
            {pendingReviews.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate("/admin/review")}
                className="w-full px-5 py-3.5 text-left transition-colors hover:bg-beige-light/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{r.subject}</p>
                  <Badge tone={reviewStatusTone[r.status]}>{r.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">{r.organization}</p>
                <div className="mt-2">
                  <ConfidenceMeter value={r.confidence} />
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-line px-5 py-3">
            <Link to="/admin/review" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-light hover:underline">
              Open review queue <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Trust Score distribution" eyebrow="Fleet posture" />
          <div className="mt-5">
            <DonutChart segments={TRUST_DISTRIBUTION} centerLabel={`${PLATFORM_KPIS.organizations}`} centerSub="orgs" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Most common gaps" eyebrow="Across tenants" />
          <div className="mt-5">
            <HBars data={COMMON_GAPS} unit="%" />
          </div>
        </Card>

        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-light" />
              <p className="font-display text-sm font-semibold text-ink">System health</p>
            </div>
            <Link to="/admin/system" className="text-sm font-medium text-emerald-light hover:underline">
              Details
            </Link>
          </div>
          <div className="divide-y divide-line">
            {health.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", serviceDot[s.status])} />
                <span className="flex-1 text-sm text-ink">{s.name}</span>
                <span className="tabular text-xs text-ink-muted">{s.latencyMs} ms</span>
                <span className="tabular text-xs text-ink-muted">{s.uptime}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
