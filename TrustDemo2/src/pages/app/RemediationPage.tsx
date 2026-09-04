import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ListTodo,
  Clock,
  CircleCheck,
  CircleDot,
  Circle,
  User,
  CalendarClock,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Badge, SeverityBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Drawer } from "@/components/common/Drawer";
import { ProgressBar } from "@/components/common/ProgressBar";
import { PageSkeleton } from "@/components/common/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/context/ToastContext";
import { remediationService } from "@/services";
import { cn } from "@/lib/cn";
import type { RemediationStatus, RemediationTask } from "@/types";

const COLUMNS: { id: RemediationStatus; label: string; icon: typeof Circle }[] = [
  { id: "NOT_STARTED", label: "Not started", icon: Circle },
  { id: "IN_PROGRESS", label: "In progress", icon: CircleDot },
  { id: "COMPLETED", label: "Completed", icon: CircleCheck },
];

const effortTone = { Low: "success", Moderate: "warning", High: "danger" } as const;

export function RemediationPage() {
  const { data, loading } = useAsync(() => remediationService.list(), []);
  const { notify } = useToast();
  const [tasks, setTasks] = useState<RemediationTask[] | null>(null);
  const [selected, setSelected] = useState<RemediationTask | null>(null);

  const list = tasks ?? data;
  if (loading || !list) return <PageSkeleton />;

  const advance = (task: RemediationTask) => {
    const next: RemediationStatus =
      task.status === "NOT_STARTED" ? "IN_PROGRESS" : task.status === "IN_PROGRESS" ? "COMPLETED" : "COMPLETED";
    const updated = list.map((t) => (t.id === task.id ? { ...t, status: next } : t));
    setTasks(updated);
    setSelected((s) => (s && s.id === task.id ? { ...s, status: next } : s));
    notify(next === "COMPLETED" ? "Task marked complete." : "Task moved to in progress.");
  };

  const done = list.filter((t) => t.status === "COMPLETED").length;
  const progress = Math.round((done / list.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="Remediation plan"
        subtitle="An ordered plan drawn from your findings. Each task states the problem, the fix, and the evidence that closes it."
      />

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display font-semibold text-ink">Overall progress</p>
            <p className="text-sm text-ink-soft">
              {done} of {list.length} tasks resolved
            </p>
          </div>
          <div className="w-full sm:w-64">
            <ProgressBar value={progress} tone={progress === 100 ? "success" : "brand"} showValue label="Completion" />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = list.filter((t) => t.status === col.id);
          return (
            <div key={col.id}>
              <div className="mb-3 flex items-center gap-2">
                <col.icon
                  className={cn(
                    "h-4 w-4",
                    col.id === "COMPLETED" ? "text-success" : col.id === "IN_PROGRESS" ? "text-info" : "text-ink-muted",
                  )}
                />
                <span className="text-sm font-semibold text-ink">{col.label}</span>
                <span className="tabular rounded-full bg-beige-light px-1.5 text-xs text-ink-muted">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-muted">
                    Nothing here
                  </div>
                )}
                {items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="w-full rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-emerald-light/40 hover:bg-beige-light/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <SeverityBadge severity={t.priority} />
                      <Badge tone={effortTone[t.effort]}>{t.effort} effort</Badge>
                    </div>
                    <p className="mt-2.5 font-medium text-ink">{t.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{t.problem}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> {t.assignedTo}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {t.dueDate}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDrawer task={selected} onClose={() => setSelected(null)} onAdvance={advance} />
    </div>
  );
}

function TaskDrawer({
  task,
  onClose,
  onAdvance,
}: {
  task: RemediationTask | null;
  onClose: () => void;
  onAdvance: (t: RemediationTask) => void;
}) {
  return (
    <Drawer
      open={!!task}
      onClose={onClose}
      eyebrow={task?.findingRefId ? `From finding ${task.findingRefId}` : "Remediation task"}
      title={task?.title ?? ""}
      footer={
        task &&
        task.status !== "COMPLETED" && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={() => onAdvance(task)}>
              {task.status === "NOT_STARTED" ? "Start task" : "Mark complete"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    >
      {task && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={task.priority} />
            <Badge tone={effortTone[task.effort]}>{task.effort} effort</Badge>
            {task.status === "COMPLETED" && <Badge tone="success">Completed</Badge>}
          </div>

          <Section title="The problem">
            <p className="text-sm leading-relaxed text-ink-soft">{task.problem}</p>
          </Section>
          <Section title="Why it matters">
            <p className="text-sm leading-relaxed text-ink-soft">{task.why}</p>
          </Section>
          <Section title="Recommended fix">
            <div className="rounded-xl border border-emerald-light/30 bg-emerald-soft/50 p-4">
              <p className="text-sm leading-relaxed text-ink">{task.recommendedFix}</p>
            </div>
          </Section>
          <Section title="Evidence that closes this">
            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas p-4">
              <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              <p className="text-sm text-ink-soft">{task.evidenceNeeded}</p>
            </div>
          </Section>

          <dl className="space-y-2 rounded-xl border border-line bg-white p-4 text-sm">
            <Row icon={User} label="Assigned to" value={task.assignedTo} />
            <Row icon={CalendarClock} label="Due" value={task.dueDate} />
          </dl>

          {task.findingRefId && (
            <Link to="/findings">
              <Button variant="ghost" size="sm">
                <ListTodo className="h-4 w-4" /> View source finding
              </Button>
            </Link>
          )}
        </div>
      )}
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      {children}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="inline-flex items-center gap-2 text-ink-muted">
        <Icon className="h-4 w-4" /> {label}
      </dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
