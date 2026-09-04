import { Activity, CircleCheck, TriangleAlert, CircleAlert, Gauge, Timer } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { PageSkeleton } from "@/components/common/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { adminService } from "@/services";
import { cn } from "@/lib/cn";
import type { ServiceStatus, SystemService } from "@/types";

const statusMeta: Record<ServiceStatus, { tone: "success" | "warning" | "danger"; icon: typeof CircleCheck; dot: string }> = {
  Operational: { tone: "success", icon: CircleCheck, dot: "bg-success" },
  Degraded: { tone: "warning", icon: TriangleAlert, dot: "bg-warning" },
  Down: { tone: "danger", icon: CircleAlert, dot: "bg-danger" },
};

export function AdminSystemPage() {
  const { data: services } = useAsync(() => adminService.systemHealth(), []);
  if (!services) return <PageSkeleton />;

  const degraded = services.filter((s) => s.status !== "Operational");
  const worst = degraded.some((s) => s.status === "Down") ? "Down" : degraded.length ? "Degraded" : "Operational";
  const banner = statusMeta[worst as ServiceStatus];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform" title="System health" subtitle="Live status of the services behind TrustForge." />

      {/* Overall banner */}
      <Card
        className={cn(
          "border",
          worst === "Operational" ? "border-success/30 bg-success/5" : worst === "Degraded" ? "border-warning/30 bg-warning/5" : "border-danger/30 bg-danger/5",
        )}
      >
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              worst === "Operational" ? "bg-success/10 text-success" : worst === "Degraded" ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger",
            )}
          >
            <banner.icon className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">
              {worst === "Operational" ? "All systems operational" : `${degraded.length} service${degraded.length > 1 ? "s" : ""} need attention`}
            </p>
            <p className="text-sm text-ink-soft">
              {degraded.length ? `${degraded.map((s) => s.name).join(", ")} reporting degraded performance.` : "Every monitored service is responding normally."}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>

      {degraded.length > 0 && (
        <Card>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-warning" />
            <p className="font-display text-sm font-semibold text-ink">Open incident</p>
          </div>
          <div className="mt-3 rounded-xl border border-warning/20 bg-warning/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">Scan Engine elevated latency</p>
              <Badge tone="warning">Investigating</Badge>
            </div>
            <p className="mt-1.5 text-sm text-ink-soft">
              Scan throughput is reduced while a worker pool is being scaled. Queued scans continue to run and no
              data is lost. Next update in 30 minutes.
            </p>
            <p className="mt-2 font-mono text-xs text-ink-muted">Started 04 Sep 2026 · 09:15 IST</p>
          </div>
        </Card>
      )}
    </div>
  );
}

function ServiceCard({ service }: { service: SystemService }) {
  const meta = statusMeta[service.status];
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
          <p className="font-medium text-ink">{service.name}</p>
        </div>
        <Badge tone={meta.tone}>{service.status}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-canvas p-3">
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Timer className="h-3.5 w-3.5" /> Latency
          </p>
          <p className="tabular mt-1 font-display text-lg font-semibold text-ink">{service.latencyMs} ms</p>
        </div>
        <div className="rounded-lg bg-canvas p-3">
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Gauge className="h-3.5 w-3.5" /> Uptime
          </p>
          <p className="tabular mt-1 font-display text-lg font-semibold text-ink">{service.uptime}%</p>
        </div>
      </div>
    </Card>
  );
}
