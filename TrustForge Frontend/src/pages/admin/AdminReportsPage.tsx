import { useMemo, useState } from "react";
import { FileText, Search, Download, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { StatCard } from "@/components/common/StatCard";
import { ScorePill } from "@/components/common/ScoreRing";
import { PageSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/context/ToastContext";
import { adminService } from "@/services";
import { REPORT_META } from "@/data/assessmentData";
import { Table, type Column } from "./shared";

interface ReportRow {
  id: string;
  organization: string;
  framework: string;
  issuedOn: string;
  score: number;
  ready: boolean;
}

export function AdminReportsPage() {
  const { data: orgs } = useAsync(() => adminService.orgs(), []);
  const { notify } = useToast();
  const [query, setQuery] = useState("");

  const registry = useMemo<ReportRow[]>(() => {
    if (!orgs) return [];
    // Reports exist once a tenant has run its assessment. Not-started tenants
    // appear as pending so the queue reads honestly.
    return orgs.map((o, i) => ({
      id: `TF-2026-DPDP-${String(1001 + i).padStart(4, "0")}`,
      organization: o.name,
      framework: REPORT_META.framework,
      issuedOn: o.assessmentStatus === "Not Started" ? "Pending assessment" : o.lastActivity,
      score: o.trustScore,
      ready: o.assessmentStatus === "Completed",
    }));
  }, [orgs]);

  const rows = useMemo(
    () =>
      registry.filter(
        (r) => r.id.toLowerCase().includes(query.toLowerCase()) || r.organization.toLowerCase().includes(query.toLowerCase()),
      ),
    [registry, query],
  );

  if (!orgs) return <PageSkeleton />;

  const ready = registry.filter((r) => r.ready).length;

  const columns: Column<ReportRow>[] = [
    { key: "id", header: "Report ID", render: (r) => <span className="font-mono text-xs text-ink">{r.id}</span> },
    { key: "organization", header: "Organization", render: (r) => <span className="font-medium text-ink">{r.organization}</span> },
    { key: "framework", header: "Framework", hideOnMobile: true, render: (r) => <span className="text-ink-muted">{r.framework}</span> },
    { key: "issuedOn", header: "Issued", hideOnMobile: true, render: (r) => <span className="text-ink-soft">{r.issuedOn}</span> },
    { key: "score", header: "Score", align: "center", render: (r) => <ScorePill score={r.score} size="sm" /> },
    {
      key: "action",
      header: "",
      align: "right",
      render: (r) =>
        r.ready ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => notify(`Download of ${r.id} is mocked in this demo.`, "info")}
          >
            <Download className="h-4 w-4" /> PDF
          </Button>
        ) : (
          <Badge tone="neutral">Pending</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports ops"
        title="Report registry"
        subtitle="Assessment reports issued to tenants. Every report is a preliminary TrustForge assessment, not a certification."
        actions={
          <Button variant="outline" size="sm" onClick={() => notify("Bulk export is mocked in this demo.", "info")}>
            <Download className="h-4 w-4" /> Export registry
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Reports ready" value={ready} icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Tenants tracked" value={registry.length} icon={<FileText className="h-4 w-4" />} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search report ID or org"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:max-w-sm"
        />
        <span className="tabular text-sm text-ink-muted sm:ml-auto">{rows.length} reports</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="No matching reports" description="Try a different report ID or organization." />
      ) : (
        <Table columns={columns} rows={rows} />
      )}
    </div>
  );
}
