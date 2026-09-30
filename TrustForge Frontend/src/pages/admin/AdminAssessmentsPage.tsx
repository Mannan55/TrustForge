import { CircleCheck, Loader, Circle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/common/Badge";
import { StatCard } from "@/components/common/StatCard";
import { ProgressBar } from "@/components/common/ProgressBar";
import { ScorePill } from "@/components/common/ScoreRing";
import { PageSkeleton } from "@/components/common/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { adminService } from "@/services";
import { Table, assessmentStatusTone, type Column } from "./shared";
import type { AdminOrg, AssessmentProgress } from "@/types";

const progressFor: Record<AssessmentProgress, number> = {
  Completed: 100,
  "In Progress": 45,
  "Not Started": 0,
};

export function AdminAssessmentsPage() {
  const { data: orgs } = useAsync(() => adminService.orgs(), []);
  if (!orgs) return <PageSkeleton />;

  const completed = orgs.filter((o) => o.assessmentStatus === "Completed").length;
  const inProgress = orgs.filter((o) => o.assessmentStatus === "In Progress").length;
  const notStarted = orgs.filter((o) => o.assessmentStatus === "Not Started").length;

  const columns: Column<AdminOrg>[] = [
    { key: "name", header: "Organization", render: (o) => <span className="font-medium text-ink">{o.name}</span> },
    {
      key: "assessmentStatus",
      header: "Status",
      render: (o) => <Badge tone={assessmentStatusTone[o.assessmentStatus]}>{o.assessmentStatus}</Badge>,
    },
    {
      key: "progress",
      header: "Progress",
      hideOnMobile: true,
      render: (o) => <ProgressBar value={progressFor[o.assessmentStatus]} tone={o.assessmentStatus === "Completed" ? "success" : "brand"} className="w-40" />,
    },
    { key: "trustScore", header: "Score", align: "center", render: (o) => <ScorePill score={o.trustScore} size="sm" /> },
    { key: "lastActivity", header: "Last activity", align: "right", hideOnMobile: true, render: (o) => <span className="text-ink-muted">{o.lastActivity}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Assessment ops" title="Assessments" subtitle="Where each tenant stands in the guided DPDP assessment." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Completed" value={completed} icon={<CircleCheck className="h-4 w-4" />} />
        <StatCard label="In progress" value={inProgress} icon={<Loader className="h-4 w-4" />} />
        <StatCard label="Not started" value={notStarted} icon={<Circle className="h-4 w-4" />} />
      </div>

      <Table columns={columns} rows={orgs} />
    </div>
  );
}
