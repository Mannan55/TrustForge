import { useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/cn";
import type { EvidenceItem, EvidenceSource, EvidenceStatus } from "@/types";

const sourceIcon: Record<EvidenceSource, typeof ScanLine> = {
  "Website Scanner": ScanLine,
  "Document Upload": FileText,
  "Manual Self-Declaration": ClipboardCheck,
  "System Assessment": Info,
};

const STATUS_ORDER: EvidenceStatus[] = ["VERIFIED", "DETECTED", "INFERRED", "NOT_FOUND", "NOT_ASSESSED"];

export function EvidencePage() {
  const { data: initialEvidence, loading, error } = useAsync(() => evidenceService.list(), []);
  const [evidence, setEvidence] = useState<EvidenceItem[] | null>(null);
  const { notify } = useToast();
  const [filter, setFilter] = useState<"all" | EvidenceStatus>("all");
  const [selected, setSelected] = useState<EvidenceItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useMemo(() => ({ current: null as HTMLInputElement | null }), []);

  useEffect(() => {
    if (initialEvidence) setEvidence(initialEvidence);
  }, [initialEvidence]);

  const reload = async () => {
    try {
      const refreshed = await evidenceService.list();
      setEvidence(refreshed);
    } catch {
      /* ignore */
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      notify("File exceeds maximum allowed size of 10 MB.", "warning");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      await evidenceService.upload(file);
      notify(`Successfully uploaded ${file.name}. Added as detected evidence.`, "success");
      await reload();
    } catch (err: any) {
      console.error("Upload failed:", err);
      notify(err?.detail || err?.message || "Failed to upload evidence document.", "warning");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const currentList = evidence ?? initialEvidence ?? [];

  const tabs = useMemo(() => {
    return [
      { id: "all", label: "All", count: currentList.length },
      ...STATUS_ORDER.map((s) => ({
        id: s,
        label: s[0] + s.slice(1).toLowerCase().replace("_", " "),
        count: currentList.filter((e) => e.status === s).length,
      })).filter((t) => t.count > 0),
    ];
  }, [currentList]);

  if (loading && !evidence) return <PageSkeleton />;
  if (error && !evidence) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-white p-8 text-center">
        <p className="font-display font-semibold text-danger">Unable to load assessment evidence</p>
        <p className="mt-2 text-sm text-ink-muted">{error?.message || "Failed to retrieve evidence from backend."}</p>
      </div>
    );
  }

  const visible = filter === "all" ? currentList : currentList.filter((e) => e.status === filter);
  const verified = currentList.filter((e) => e.status === "VERIFIED").length;
  const coverage = currentList.length > 0
    ? Math.round((currentList.filter((e) => e.status === "VERIFIED" || e.status === "DETECTED").length / currentList.length) * 100)
    : 0;

  const uploadedDocs = currentList.filter((e) => e.sourceType === "Document Upload");

  return (
    <div className="space-y-6">
      <input
        ref={(el) => { fileInputRef.current = el; }}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileUpload}
      />

      <PageHeader
        eyebrow="Compliance"
        title="Evidence"
        subtitle="What backs each claim, and how sure we are. Verified items are strongest; inferred items rely on indirect signals."
        actions={
          <Button
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={cn("h-4 w-4", isUploading && "animate-spin")} />
            {isUploading ? "Uploading..." : "Upload evidence"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Evidence items" value={`${currentList.length}`} hint="Across all pillars" />
        <SummaryCard label="Verified" value={`${verified}`} hint="Confirmed against source" />
        <SummaryCard label="Backed coverage" value={`${coverage}%`} hint="Verified or detected" />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 text-sm text-ink-soft">
        <Info className="h-4 w-4 shrink-0 text-ink-muted" />
        Evidence status reflects how a claim was established, not a judgement. A "Not found" item is a
        prompt to attach evidence, not a penalty on its own.
      </div>

      <Tabs items={tabs} active={filter} onChange={(id) => setFilter(id as typeof filter)} />

      {currentList.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-display font-semibold text-ink">No evidence items recorded yet</p>
          <p className="mt-1 text-sm text-ink-muted">Complete an assessment or upload compliance documentation.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((e) => {
            const Icon = sourceIcon[e.sourceType] || Info;
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
      )}

      {/* Uploaded documents */}
      <Card padded={false}>
        <div className="border-b border-line px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-display text-sm font-semibold text-ink">Uploaded documents</p>
            <p className="text-xs text-ink-muted">Self-uploaded documents registered into the compliance assessment</p>
          </div>
          <span className="text-xs font-mono text-ink-muted">{uploadedDocs.length} attached</span>
        </div>
        <div className="divide-y divide-line">
          {uploadedDocs.length > 0 ? (
            uploadedDocs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-6 py-3.5">
                <Paperclip className="h-4 w-4 text-ink-muted" />
                <span className="flex-1 truncate text-sm text-ink">{d.title}</span>
                <span className="text-xs text-ink-muted">{d.notes}</span>
                <Badge tone="info">Document Upload</Badge>
              </div>
            ))
          ) : (
            <div className="p-5 text-center text-xs text-ink-muted">
              No custom documents uploaded yet. Use "Upload evidence" to attach policy files or reports.
            </div>
          )}
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
