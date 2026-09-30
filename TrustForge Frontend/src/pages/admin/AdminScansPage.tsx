import { useMemo, useState } from "react";
import { RotateCcw, TriangleAlert, CircleCheck, Loader, Clock } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Tabs } from "@/components/common/Tabs";
import { PageSkeleton } from "@/components/common/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/context/ToastContext";
import { adminService } from "@/services";
import { scanStateTone } from "./shared";
import { cn } from "@/lib/cn";
import type { AdminScan, ScanState } from "@/types";

const stateIcon: Record<ScanState, typeof CircleCheck> = {
  Completed: CircleCheck,
  Scanning: Loader,
  Queued: Clock,
  Failed: TriangleAlert,
};

export function AdminScansPage() {
  const { data: scans } = useAsync(() => adminService.scans(), []);
  const { notify } = useToast();
  const [filter, setFilter] = useState<"all" | ScanState>("all");

  const tabs = useMemo(() => {
    const src = scans ?? [];
    const states: ScanState[] = ["Completed", "Scanning", "Queued", "Failed"];
    return [
      { id: "all", label: "All", count: src.length },
      ...states.map((s) => ({ id: s, label: s, count: src.filter((x) => x.state === s).length })),
    ];
  }, [scans]);

  if (!scans) return <PageSkeleton />;

  const visible = filter === "all" ? scans : scans.filter((s) => s.state === filter);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Assessment ops" title="Website scans" subtitle="Every scan in the queue, in progress, or completed across tenants." />

      <Tabs items={tabs} active={filter} onChange={(id) => setFilter(id as typeof filter)} />

      <div className="space-y-3">
        {visible.map((s) => (
          <ScanRow key={s.id} scan={s} onRescan={() => notify(`Rescan queued for ${s.url} (mocked).`, "info")} />
        ))}
      </div>
    </div>
  );
}

function ScanRow({ scan, onRescan }: { scan: AdminScan; onRescan: () => void }) {
  const Icon = stateIcon[scan.state];
  const iconColor =
    scan.state === "Completed"
      ? "text-success"
      : scan.state === "Failed"
        ? "text-danger"
        : scan.state === "Scanning"
          ? "text-info"
          : "text-ink-muted";

  return (
    <Card padded={false} className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-start gap-3">
          <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconColor, scan.state === "Scanning" && "animate-spin")} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-ink">{scan.url}</p>
              <span className="font-mono text-xs text-ink-muted">{scan.id}</span>
            </div>
            <p className="text-sm text-ink-muted">{scan.organization}</p>
            {scan.failureReason && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-ink-soft">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                <span className="font-mono">{scan.failureReason}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <div className="flex items-center gap-2">
            <Badge tone={scanStateTone[scan.state]}>{scan.state}</Badge>
            {scan.score != null && <span className="tabular font-display text-lg font-semibold text-ink">{scan.score}</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span>{scan.startedAt}</span>
            {(scan.state === "Failed" || scan.state === "Completed") && (
              <Button variant="ghost" size="sm" onClick={onRescan}>
                <RotateCcw className="h-3.5 w-3.5" /> Rescan
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
