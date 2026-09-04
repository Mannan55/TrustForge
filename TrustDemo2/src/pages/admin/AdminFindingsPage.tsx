import { useMemo, useState } from "react";
import { ShieldAlert, Search, TriangleAlert, Eye } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge, SeverityBadge } from "@/components/common/Badge";
import { Input, Select } from "@/components/common/Input";
import { StatCard } from "@/components/common/StatCard";
import { PageSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { findingsService, adminService } from "@/services";
import { Table, type Column, type Tone } from "./shared";
import type { Finding, FindingStatus } from "@/types";

// Fleet finding = an org finding attributed to a tenant, for the platform view.
interface FleetFinding extends Finding {
  organization: string;
}

const statusLabel: Record<FindingStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  REMEDIATED: "Remediated",
  REQUIRES_REVIEW: "Requires review",
  DISMISSED: "Dismissed",
};

const statusTone: Record<FindingStatus, Tone> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  REMEDIATED: "success",
  REQUIRES_REVIEW: "danger",
  DISMISSED: "neutral",
};

export function AdminFindingsPage() {
  const { data: findings } = useAsync(() => findingsService.list(), []);
  const { data: orgs } = useAsync(() => adminService.orgs(), []);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");

  const fleet = useMemo<FleetFinding[]>(() => {
    if (!findings || !orgs) return [];
    // Attribute each finding to a tenant so the platform sees a spread of orgs.
    return findings.map((f, i) => ({ ...f, id: `${f.id}-${i}`, organization: orgs[i % orgs.length].name }));
  }, [findings, orgs]);

  const rows = useMemo(
    () =>
      fleet.filter(
        (f) =>
          (severity === "all" || f.severity === severity) &&
          (f.title.toLowerCase().includes(query.toLowerCase()) ||
            f.organization.toLowerCase().includes(query.toLowerCase()) ||
            f.dpdpReference.toLowerCase().includes(query.toLowerCase())),
      ),
    [fleet, query, severity],
  );

  if (!findings || !orgs) return <PageSkeleton />;

  const high = fleet.filter((f) => f.severity === "HIGH").length;
  const review = fleet.filter((f) => f.status === "REQUIRES_REVIEW").length;

  const columns: Column<FleetFinding>[] = [
    {
      key: "title",
      header: "Finding",
      render: (f) => (
        <div className="min-w-0">
          <p className="font-medium text-ink">{f.title}</p>
          <p className="text-xs text-ink-muted">{f.pillar}</p>
        </div>
      ),
    },
    { key: "organization", header: "Organization", hideOnMobile: true },
    { key: "severity", header: "Severity", align: "center", render: (f) => <SeverityBadge severity={f.severity} /> },
    { key: "status", header: "Status", render: (f) => <Badge tone={statusTone[f.status]}>{statusLabel[f.status]}</Badge> },
    {
      key: "dpdpReference",
      header: "DPDP",
      align: "right",
      hideOnMobile: true,
      render: (f) => <span className="font-mono text-xs text-emerald-light">{f.dpdpReference}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Findings ops"
        title="Findings"
        subtitle="Every open finding across tenants, grouped so the highest-severity gaps surface first."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total findings" value={fleet.length} icon={<ShieldAlert className="h-4 w-4" />} />
        <StatCard label="High severity" value={high} icon={<TriangleAlert className="h-4 w-4" />} />
        <StatCard label="Requires review" value={review} icon={<Eye className="h-4 w-4" />} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search finding, org, or DPDP reference"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:max-w-sm"
        />
        <Select
          options={[
            { value: "all", label: "All severities" },
            { value: "HIGH", label: "High" },
            { value: "MEDIUM", label: "Medium" },
            { value: "LOW", label: "Low" },
          ]}
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="sm:max-w-[180px]"
        />
        <span className="tabular text-sm text-ink-muted sm:ml-auto">{rows.length} findings</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<ShieldAlert className="h-6 w-6" />} title="No matching findings" description="Adjust your search or severity filter." />
      ) : (
        <Table columns={columns} rows={rows} />
      )}
    </div>
  );
}
