import { useState } from "react";
import { FileSearch, Check, Flag, Quote, ScrollText, Info } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { PageSkeleton } from "@/components/common/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/context/ToastContext";
import { adminService } from "@/services";
import { ConfidenceMeter, reviewStatusTone } from "./shared";
import type { AiReviewItem } from "@/types";

export function AdminReviewPage() {
  const { data, loading } = useAsync(() => adminService.aiReviews(), []);
  const { notify } = useToast();
  const [items, setItems] = useState<AiReviewItem[] | null>(null);

  const list = items ?? data;
  if (loading || !list) return <PageSkeleton />;

  const act = (item: AiReviewItem, status: AiReviewItem["status"]) => {
    setItems(list.map((r) => (r.id === item.id ? { ...r, status } : r)));
    notify(status === "Reviewed" ? "Marked as reviewed." : "Flagged for follow-up.", status === "Reviewed" ? "success" : "warning");
  };

  const pending = list.filter((r) => r.status !== "Reviewed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review & rules"
        title="Analysis review"
        subtitle="A reviewer confirms automated assessments before they influence a tenant's posture. Lower confidence goes to a human first."
        actions={<Badge tone={pending ? "warning" : "success"}>{pending} pending</Badge>}
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-4 text-sm text-ink-soft">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
        Confidence reflects how strongly the observed evidence supports the classification. It is a triage aid,
        not a verdict. Items below 60% are queued for review by default.
      </div>

      <div className="space-y-4">
        {list.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-beige-light text-emerald-light">
                  <FileSearch className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display font-semibold text-ink">{item.subject}</p>
                  <p className="text-sm text-ink-muted">{item.organization}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ConfidenceMeter value={item.confidence} />
                <Badge tone={reviewStatusTone[item.status]}>{item.status}</Badge>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-canvas p-4">
                <p className="eyebrow mb-1.5">Why this classification</p>
                <p className="text-sm leading-relaxed text-ink-soft">{item.rationale}</p>
              </div>
              <div className="rounded-xl border border-line bg-canvas p-4">
                <p className="eyebrow mb-1.5">Observed evidence</p>
                <div className="flex items-start gap-2">
                  <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  <p className="font-mono text-xs leading-relaxed text-ink-soft">{item.evidence}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-light">
                <ScrollText className="h-3.5 w-3.5" /> DPDP {item.dpdpRef}
              </span>
              {item.status !== "Reviewed" ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => act(item, "Flagged")}>
                    <Flag className="h-4 w-4" /> Flag
                  </Button>
                  <Button size="sm" onClick={() => act(item, "Reviewed")}>
                    <Check className="h-4 w-4" /> Confirm
                  </Button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-success">
                  <Check className="h-4 w-4" /> Reviewed
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
