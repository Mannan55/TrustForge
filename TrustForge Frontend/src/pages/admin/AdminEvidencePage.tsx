import { useMemo, useState } from "react";
import { FileCheck2, Search, ShieldCheck, CircleHelp } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Input, Select } from "@/components/common/Input";
import { StatCard } from "@/components/common/StatCard";
import { HBars } from "@/components/charts/Charts";
import { PageSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { evidenceService, adminService } from "@/services";
import { Table, type Column, type Tone } from "./shared";
import type { EvidenceItem, EvidenceStatus, EvidenceConfidence } from "@/types";

interface FleetEvidence extends EvidenceItem {
  organization: string;
}

const statusLabel: Record<EvidenceStatus, string> = {
  VERIFIED: "Verified",
  DETECTED: "Detected",
  INFERRED: "Inferred",
  NOT_FOUND: "Not found",
  NOT_ASSESSED: "Not assessed",
};

const statusTone: Record<EvidenceStatus, Tone> = {
  VERIFIED: "success",
  DETECTED: "info",
  INFERRED: "warning",
  NOT_FOUND: "danger",
  NOT_ASSESSED: "neutral",
};

const confidenceTone: Record<EvidenceConfidence, Tone> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "danger",
};

const chartTone: Record<EvidenceStatus, "success" | "info" | "warning" | "danger" | "brand"> = {
  VERIFIED: "success",
  DETECTED: "info",
  INFERRED: "warning",
  NOT_FOUND: "danger",
  NOT_ASSESSED: "brand",
};

export function AdminEvidencePage() {
  const { data: evidence } = useAsync(() => evidenceService.list(), []);
  const { data: orgs } = useAsync(() => adminService.orgs(), []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const fleet = useMemo<FleetEvidence[]>(() => {
    if (!evidence || !orgs) return [];
    return evidence.map((e, i) => ({ ...e, id: `${e.id}-${i}`, organization: orgs[i % orgs.length].name }));
  }, [evidence, orgs]);

  const rows = useMemo(
    () =>
      fleet.filter(
        (e) =>
          (status === "all" || e.status === status) &&
          (e.title.toLowerCase().includes(query.toLowerCase()) || e.organization.toLowerCase().includes(query.toLowerCase())),
      ),
    [fleet, query, status],
  );

  const distribution = useMemo(() => {
    const order: EvidenceStatus[] = ["VERIFIED", "DETECTED", "INFERRED", "NOT_FOUND", "NOT_ASSESSED"];
    return order
      .map((s) => ({ label: statusLabel[s], value: fleet.filter((e) => e.status === s).length, tone: chartTone[s] }))
      .filter((d) => d.value > 0);
  }, [fleet]);

  if (!evidence || !orgs) return <PageSkeleton />;

  const verified = fleet.filter((e) => e.status === "VERIFIED").length;
  const gaps = fleet.filter((e) => e.status === "NOT_FOUND").length;

  const columns: Column<FleetEvidence>[] = [
    {
      key: "title",
      header: "Evidence",
      render: (e) => (
        <div className="min-w-0">
          <p className="font-medium text-ink">{e.title}</p>
          <p className="text-xs text-ink-muted">{e.method}</p>
        </div>
      ),
    },
    { key: "organization", header: "Organization", hideOnMobile: true },
    { key: "sourceType", header: "Source", hideOnMobile: true, render: (e) => <span className="text-ink-soft">{e.sourceType}</span> },
    { key: "confidence", header: "Confidence", align: "center", render: (e) => <Badge tone={confidenceTone[e.confidence]}>{e.confidence}</Badge> },
    { key: "status", header: "Status", align: "right", render: (e) => <Badge tone={statusTone[e.status]}>{statusLabel[e.status]}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evidence ops"
        title="Evidence"
        subtitle="What the platform has observed, uploaded, or inferred, and how strongly each signal is supported."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Total evidence" value={fleet.length} icon={<FileCheck2 className="h-4 w-4" />} />
        <StatCard label="Verified" value={verified} icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Gaps (not found)" value={gaps} icon={<CircleHelp className="h-4 w-4" />} />
      </div>

      <Card>
        <p className="font-display text-sm font-semibold text-ink">Evidence by status</p>
        <p className="mb-4 text-sm text-ink-muted">Across all tenants.</p>
        <HBars data={distribution} unit="" />
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search evidence or org"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:max-w-sm"
        />
        <Select
          options={[
            { value: "all", label: "All statuses" },
            { value: "VERIFIED", label: "Verified" },
            { value: "DETECTED", label: "Detected" },
            { value: "INFERRED", label: "Inferred" },
            { value: "NOT_FOUND", label: "Not found" },
            { value: "NOT_ASSESSED", label: "Not assessed" },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:max-w-[190px]"
        />
        <span className="tabular text-sm text-ink-muted sm:ml-auto">{rows.length} items</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<FileCheck2 className="h-6 w-6" />} title="No matching evidence" description="Adjust your search or status filter." />
      ) : (
        <Table columns={columns} rows={rows} />
      )}
    </div>
  );
}
