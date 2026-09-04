import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileText, ListChecks, ArrowRight, Quote } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Badge, SeverityBadge, FindingStatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Tabs } from "@/components/common/Tabs";
import { Drawer } from "@/components/common/Drawer";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSkeleton } from "@/components/common/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { findingsService } from "@/services";
import type { Finding, FindingStatus } from "@/types";

type Filter = "all" | "open" | "action" | "resolved";

const FILTERS: { id: Filter; label: string; match: (s: FindingStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "open", label: "Open", match: (s) => s === "OPEN" },
  { id: "action", label: "In progress", match: (s) => s === "IN_PROGRESS" || s === "REQUIRES_REVIEW" },
  { id: "resolved", label: "Resolved", match: (s) => s === "REMEDIATED" },
];

export function FindingsPage() {
  const { data: findings, loading } = useAsync(() => findingsService.list(), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Finding | null>(null);

  const counts = useMemo(() => {
    const src = findings ?? [];
    return FILTERS.map((f) => ({ id: f.id, label: f.label, count: src.filter((x) => f.match(x.status)).length }));
  }, [findings]);

  if (loading || !findings) return <PageSkeleton />;

  const active = FILTERS.find((f) => f.id === filter)!;
  const visible = findings.filter((f) => active.match(f.status));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="Findings"
        subtitle="Each finding names the problem, why it matters, the evidence behind it, and the specific fix."
      />

      <Tabs items={counts} active={filter} onChange={(id) => setFilter(id as Filter)} />

      {visible.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="Nothing here"
          description="No findings match this filter. Try a different view."
        />
      ) : (
        <Card padded={false}>
          <div className="divide-y divide-line">
            {visible.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-beige-light/40 sm:px-6"
              >
                <span className="mt-0.5 shrink-0 font-mono text-xs text-ink-muted">{f.id}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{f.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{f.affectedArea}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
                    <SeverityBadge severity={f.severity} />
                    <FindingStatusBadge status={f.status} />
                  </div>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                  <SeverityBadge severity={f.severity} />
                  <FindingStatusBadge status={f.status} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <FindingDrawer finding={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function FindingDrawer({ finding, onClose }: { finding: Finding | null; onClose: () => void }) {
  return (
    <Drawer
      open={!!finding}
      onClose={onClose}
      eyebrow={finding ? `${finding.id} · ${finding.pillar}` : ""}
      title={finding?.title ?? ""}
      footer={
        finding && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-muted">
              Score impact <span className="font-semibold text-ink tabular">{finding.scoreImpact} pts</span>
            </span>
            <Link to="/remediation">
              <Button size="sm">
                View in remediation <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )
      }
    >
      {finding && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            <FindingStatusBadge status={finding.status} />
            <Badge tone="neutral">{finding.affectedArea}</Badge>
          </div>

          <Section title="Why it matters">
            <p className="text-sm leading-relaxed text-ink-soft">{finding.whyItMatters}</p>
          </Section>

          <Section title="Evidence">
            <div className="rounded-xl border border-line bg-canvas p-4">
              <div className="flex items-start gap-2.5">
                <Quote className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                <p className="font-mono text-xs leading-relaxed text-ink-soft">{finding.evidenceSnippet}</p>
              </div>
              {finding.evidenceUrl && (
                <a
                  href={finding.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-light hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {finding.evidenceUrl}
                </a>
              )}
            </div>
          </Section>

          <Section title="Recommended action">
            <div className="rounded-xl border border-emerald-light/30 bg-emerald-soft/50 p-4">
              <p className="text-sm leading-relaxed text-ink">{finding.recommendedAction}</p>
            </div>
          </Section>

          <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-4">
            <FileText className="h-4 w-4 text-ink-muted" />
            <span className="text-sm text-ink-soft">DPDP reference</span>
            <span className="ml-auto font-medium text-ink">{finding.dpdpReference}</span>
          </div>

          <p className="text-xs text-ink-muted">Detected {finding.detectedDate}.</p>
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
