import { useMemo, useState } from "react";
import { History, Search, Download } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input, Select } from "@/components/common/Input";
import { PageSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/context/ToastContext";
import { adminService } from "@/services";
import { Table, auditResultTone, type Column } from "./shared";
import type { AuditLog } from "@/types";

export function AdminAuditPage() {
  const { data: logs } = useAsync(() => adminService.auditLogs(), []);
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("all");

  const rows = useMemo(() => {
    if (!logs) return [];
    return logs.filter(
      (l) =>
        (result === "all" || l.result === result) &&
        (l.actor.toLowerCase().includes(query.toLowerCase()) ||
          l.action.toLowerCase().includes(query.toLowerCase()) ||
          l.resource.toLowerCase().includes(query.toLowerCase())),
    );
  }, [logs, query, result]);

  if (!logs) return <PageSkeleton />;

  const columns: Column<AuditLog>[] = [
    { key: "timestamp", header: "Time", render: (l) => <span className="font-mono text-xs text-ink-muted">{l.timestamp}</span> },
    { key: "actor", header: "Actor", render: (l) => <span className="font-medium text-ink">{l.actor}</span> },
    { key: "action", header: "Action", hideOnMobile: true },
    { key: "resource", header: "Resource", hideOnMobile: true, render: (l) => <span className="font-mono text-xs text-ink-soft">{l.resource}</span> },
    { key: "organization", header: "Organization", hideOnMobile: true },
    { key: "result", header: "Result", align: "right", render: (l) => <Badge tone={auditResultTone[l.result]}>{l.result}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Audit logs"
        subtitle="A tamper-evident record of privileged actions across the platform."
        actions={
          <Button variant="outline" size="sm" onClick={() => notify("Log export is mocked in this demo.", "info")}>
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search actor, action, or resource"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:max-w-sm"
        />
        <Select
          options={[
            { value: "all", label: "All results" },
            { value: "Success", label: "Success" },
            { value: "Denied", label: "Denied" },
            { value: "Warning", label: "Warning" },
          ]}
          value={result}
          onChange={(e) => setResult(e.target.value)}
          className="sm:max-w-[180px]"
        />
        <span className="tabular text-sm text-ink-muted sm:ml-auto">{rows.length} events</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<History className="h-6 w-6" />} title="No matching events" description="Adjust your search or result filter." />
      ) : (
        <Table columns={columns} rows={rows} />
      )}
    </div>
  );
}
