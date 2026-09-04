import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileCheck2,
  Upload,
  ExternalLink,
  ScanLine,
  FileText,
  ClipboardCheck,
  Info,
  Paperclip,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Badge, EvidenceBadge, ConfidenceBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Tabs } from "@/components/common/Tabs";
import { Drawer } from "@/components/common/Drawer";
import { PageSkeleton } from "@/components/common/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/context/ToastContext";
import { evidenceService } from "@/services";
import { UPLOADED_DOCUMENTS } from "@/data/assessmentData";
import type { EvidenceItem, EvidenceSource, EvidenceStatus } from "@/types";

const sourceIcon: Record<EvidenceSource, typeof ScanLine> = {
  "Website Scanner": ScanLine,
  "Document Upload": FileText,
  "Manual Self-Declaration": ClipboardCheck,
  "System Assessment": Info,
};

const STATUS_ORDER: EvidenceStatus[] = ["VERIFIED", "DETECTED", "INFERRED", "NOT_FOUND", "NOT_ASSESSED"];

export function EvidencePage() {
  const { data: evidence, loading } = useAsync(() => evidenceService.list(), []);
  const { notify } = useToast();
  const [filter, setFilter] = useState<"all" | EvidenceStatus>("all");
  const [selected, setSelected] = useState<EvidenceItem | null>(null);

  const tabs = useMemo(() => {
    const src = evidence ?? [];
    return [
      { id: "all", label: "All", count: src.length },
      ...STATUS_ORDER.map((s) => ({
        id: s,
        label: s[0] + s.slice(1).toLowerCase().replace("_", " "),
        count: src.filter((e) => e.status === s).length,
      })).filter((t) => t.count > 0),
    ];
  }, [evidence]);

  if (loading || !evidence) return <PageSkeleton />;

  const visible = filter === "all" ? evidence : evidence.filter((e) => e.status === filter);
  const verified = evidence.filter((e) => e.status === "VERIFIED").length;
  const coverage = Math.round((evidence.filter((e) => e.status === "VERIFIED" || e.status === "DETECTED").length / evidence.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="Evidence"
        subtitle="What backs each claim, and how sure we are. Verified items are strongest; inferred items rely on indirect signals."
        actions={
          <Button size="sm" onClick={() => notify("Evidence upload is mocked in this demo.", "info")}>
            <Upload className="h-4 w-4" /> Upload evidence
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Evidence items" value={`${evidence.length}`} hint="Across all pillars" />
        <SummaryCard label="Verified" value={`${verified}`} hint="Confirmed against source" />
        <SummaryCard label="Backed coverage" value={`${coverage}%`} hint="Verified or detected" />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 text-sm text-ink-soft">
        <Info className="h-4 w-4 shrink-0 text-ink-muted" />
        Evidence status reflects how a claim was established, not a judgement. A "Not found" item is a
        prompt to attach evidence, not a penalty on its own.
      </div>

      <Tabs items={tabs} active={filter} onChange={(id) => setFilter(id as typeof filter)} />

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((e) => {
          const Icon = sourceIcon[e.sourceType];
          return (
            <button
              key={e.id}
              onClick={() => setSelected(e)}
              className="rounded-2xl border border-line bg-white p-5 text-left transition-colors hover:border-emerald-light/40 hover:bg-beige-light/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-beige-light text-emerald-light">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="font-medium text-ink">{e.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{e.sourceType}</p>
                  </div>
                </div>
                <EvidenceBadge status={e.status} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{e.notes}</p>
              <div className="mt-3 flex items-center justify-between">
                <ConfidenceBadge confidence={e.confidence} />
                <span className="text-xs text-ink-muted">Checked {e.lastChecked}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Uploaded documents */}
      <Card padded={false}>
        <div className="border-b border-line px-6 py-4">
          <p className="font-display text-sm font-semibold text-ink">Uploaded documents</p>
        </div>
        <div className="divide-y divide-line">
          {UPLOADED_DOCUMENTS.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-6 py-3.5">
              <Paperclip className="h-4 w-4 text-ink-muted" />
              <span className="flex-1 truncate text-sm text-ink">{d.name}</span>
              <span className="text-xs text-ink-muted tabular">{d.sizeLabel}</span>
              <Badge tone={d.status === "Verified" ? "success" : "info"}>{d.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <EvidenceDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function EvidenceDrawer({ item, onClose }: { item: EvidenceItem | null; onClose: () => void }) {
  return (
    <Drawer open={!!item} onClose={onClose} eyebrow={item?.sourceType} title={item?.title ?? ""}>
      {item && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <EvidenceBadge status={item.status} />
            <ConfidenceBadge confidence={item.confidence} />
          </div>

          <Section title="How this was established">
            <p className="text-sm leading-relaxed text-ink-soft">{item.method}</p>
          </Section>

          <Section title="Notes">
            <p className="text-sm leading-relaxed text-ink-soft">{item.notes}</p>
          </Section>

          <dl className="space-y-2 rounded-xl border border-line bg-canvas p-4 text-sm">
            <Row label="Source type" value={item.sourceType} />
            <Row label="Last checked" value={item.lastChecked} />
            {item.findingRefId && <Row label="Related finding" value={item.findingRefId} />}
          </dl>

          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-light hover:underline"
            >
              <ExternalLink className="h-4 w-4" /> {item.sourceUrl}
            </a>
          )}

          {item.findingRefId && (
            <Link to="/findings">
              <Button variant="outline" size="sm" className="w-full">
                <FileCheck2 className="h-4 w-4" /> View related finding {item.findingRefId}
              </Button>
            </Link>
          )}
        </div>
      )}
    </Drawer>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold tabular text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{hint}</p>
    </Card>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
