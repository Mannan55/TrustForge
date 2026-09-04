import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  Search,
  ArrowLeft,
  Users,
  ScanLine,
  ClipboardCheck,
  Ban,
  RotateCcw,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input, Select } from "@/components/common/Input";
import { ScorePill } from "@/components/common/ScoreRing";
import { PageSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/context/ToastContext";
import { adminService } from "@/services";
import {
  Table,
  postureToneMap,
  orgStatusTone,
  assessmentStatusTone,
  type Column,
} from "./shared";
import type { AdminOrg } from "@/types";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Suspended", label: "Suspended" },
  { value: "Onboarding", label: "Onboarding" },
];

export function AdminOrganizationsPage() {
  const navigate = useNavigate();
  const { data: orgs } = useAsync(() => adminService.orgs(), []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    if (!orgs) return [];
    return orgs.filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (o.name.toLowerCase().includes(query.toLowerCase()) || o.industry.toLowerCase().includes(query.toLowerCase())),
    );
  }, [orgs, query, status]);

  if (!orgs) return <PageSkeleton />;

  const columns: Column<AdminOrg>[] = [
    {
      key: "name",
      header: "Organization",
      render: (o) => (
        <div>
          <p className="font-medium text-ink">{o.name}</p>
          <p className="text-xs text-ink-muted">{o.industry}</p>
        </div>
      ),
    },
    { key: "userCount", header: "Users", align: "center", hideOnMobile: true, render: (o) => <span className="tabular">{o.userCount}</span> },
    { key: "trustScore", header: "Score", align: "center", render: (o) => <ScorePill score={o.trustScore} /> },
    { key: "posture", header: "Posture", hideOnMobile: true, render: (o) => <Badge tone={postureToneMap[o.posture]}>{o.posture}</Badge> },
    {
      key: "assessmentStatus",
      header: "Assessment",
      hideOnMobile: true,
      render: (o) => <Badge tone={assessmentStatusTone[o.assessmentStatus]}>{o.assessmentStatus}</Badge>,
    },
    { key: "status", header: "Status", render: (o) => <Badge tone={orgStatusTone[o.status]}>{o.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tenants" title="Organizations" subtitle="Every organization on the platform and its current posture." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name or industry"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:max-w-xs"
        />
        <Select options={STATUS_FILTERS} value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-[200px]" />
        <span className="tabular text-sm text-ink-muted sm:ml-auto">{rows.length} of {orgs.length}</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Building2 className="h-6 w-6" />} title="No organizations match" description="Try a different search or status filter." />
      ) : (
        <Table columns={columns} rows={rows} onRowClick={(o) => navigate(`/admin/organizations/${o.id}`)} />
      )}
    </div>
  );
}

export function AdminOrganizationDetailPage() {
  const { id } = useParams();
  const { notify } = useToast();
  const { data: org, loading } = useAsync(() => adminService.org(id!), [id]);

  if (loading) return <PageSkeleton />;
  if (!org)
    return (
      <EmptyState
        icon={<Building2 className="h-6 w-6" />}
        title="Organization not found"
        description="This tenant may have been removed."
        action={
          <Link to="/admin/organizations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to organizations
            </Button>
          </Link>
        }
      />
    );

  return (
    <div className="space-y-6">
      <Link to="/admin/organizations" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Organizations
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-deep text-beige">
            <Building2 className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{org.name}</h1>
            <p className="text-sm text-ink-muted">
              {org.industry} · {org.userCount} users · Last activity {org.lastActivity}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={orgStatusTone[org.status]}>{org.status}</Badge>
              <Badge tone={assessmentStatusTone[org.assessmentStatus]}>{org.assessmentStatus}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => notify("Rescan queued (mocked).", "info")}>
            <RotateCcw className="h-4 w-4" /> Rescan
          </Button>
          <Button
            variant={org.status === "Suspended" ? "primary" : "danger"}
            size="sm"
            onClick={() => notify(org.status === "Suspended" ? "Tenant reinstated (mocked)." : "Tenant suspended (mocked).", "warning")}
          >
            <Ban className="h-4 w-4" /> {org.status === "Suspended" ? "Reinstate" : "Suspend"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-ink-muted">Trust Score</p>
          <div className="mt-1.5 flex items-center gap-3">
            <span className="tabular font-display text-3xl font-semibold text-ink">{org.trustScore}</span>
            <Badge tone={postureToneMap[org.posture]}>{org.posture}</Badge>
          </div>
        </Card>
        <StatMini icon={Users} label="Users" value={`${org.userCount}`} />
        <StatMini icon={ClipboardCheck} label="Assessment" value={org.assessmentStatus} />
      </div>

      <Card>
        <CardHeader title="Tenant activity" eyebrow="Recent" description="A read-only view of this organization's recent platform events." />
        <div className="mt-4 space-y-3">
          {[
            { icon: ScanLine, text: `Website scan completed for ${org.name.split(" ")[0].toLowerCase()}.in`, time: org.lastActivity },
            { icon: ClipboardCheck, text: "Assessment responses updated", time: "1 day ago" },
            { icon: Mail, text: "Grievance contact verified", time: "3 days ago" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
              <a.icon className="h-4 w-4 text-emerald-light" />
              <span className="flex-1 text-sm text-ink">{a.text}</span>
              <span className="text-xs text-ink-muted">{a.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatMini({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-ink-muted">
        <Icon className="h-4 w-4" />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-1.5 font-display text-lg font-semibold text-ink">{value}</p>
    </Card>
  );
}
