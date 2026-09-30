import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileText, ListChecks, ArrowRight, Quote, X, BookOpen } from "lucide-react";
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

// DPDP Act 2023 section text — sourced from the official Act
const DPDP_SECTIONS: Record<string, { title: string; text: string }> = {
  "3": {
    title: "Section 3 — Definitions",
    text: "In this Act, unless the context otherwise requires, 'consent manager' means a person registered with the Board, who acts as a single point of contact to enable a Data Principal to give, manage, review and withdraw her consent through an accessible, transparent and interoperable platform. 'data fiduciary' means any person who alone or in conjunction with other persons determines the purpose and means of processing of personal data. 'data principal' means the individual to whom the personal data relates.",
  },
  "4": {
    title: "Section 4 — Grounds for Processing Personal Data",
    text: "A Data Fiduciary may process the personal data of a Data Principal only in accordance with the provisions of this Act for any lawful purpose — (a) for which the Data Principal has given her consent; or (b) for certain legitimate uses specified under this Act.",
  },
  "5": {
    title: "Section 5 — Notice",
    text: "Every Data Fiduciary, who intends to process personal data, shall give to the Data Principal a notice before seeking her consent. Such notice shall contain: (a) the personal data sought and the purpose of processing; (b) the manner in which the Data Principal may exercise her rights under the provisions of this Act; and (c) the manner in which the Data Principal may make a complaint to the Board.",
  },
  "6": {
    title: "Section 6 — Consent",
    text: "Consent given by a Data Principal shall be free, specific, informed, unconditional and unambiguous with a clear affirmative action, and shall signify an agreement to the processing of her personal data for a specified purpose. The Data Principal shall have the right to withdraw her consent at any time, with the ease of the same standard as giving consent. The withdrawal of consent shall not affect the lawfulness of processing of personal data based on consent before its withdrawal.",
  },
  "7": {
    title: "Section 7 — Certain Legitimate Uses",
    text: "A Data Fiduciary may process personal data of a Data Principal without obtaining consent under section 6 for any of the following purposes: (a) performance of a function under any law; (b) provision of benefits or services to a Data Principal by the State; (c) compliance with any judgment or decree; (d) response to a medical emergency; (e) purposes related to employment.",
  },
  "8": {
    title: "Section 8 — General Obligations of Data Fiduciary",
    text: "Every Data Fiduciary shall: (1) make reasonable efforts to ensure that the personal data of a Data Principal is accurate, complete and consistent; (6) take reasonable security safeguards to prevent a personal data breach; (7) in the event of a breach, give the Board and each affected Data Principal notice in such manner as may be prescribed; (9) establish an effective mechanism to redress the grievances of Data Principals; and (11) publish the contact details of a Data Protection Officer or other key personnel who shall respond to any communication from Data Principals.",
  },
  "9": {
    title: "Section 9 — Processing of Personal Data of Children",
    text: "A Data Fiduciary shall, before processing any personal data of a child, obtain verifiable consent of the parent or the lawful guardian of such child. A Data Fiduciary shall not undertake such processing of personal data which is likely to cause any detrimental effect on the well-being of a child, or engage in tracking, behavioural monitoring, or targeted advertising directed at children.",
  },
  "11": {
    title: "Section 11 — Right to Access Information about Personal Data",
    text: "A Data Principal shall, subject to such terms and conditions as may be prescribed, have the right to obtain from the Data Fiduciary: (a) a summary of personal data which is being processed and the processing activities; (b) identities of all other Data Fiduciaries and Data Processors with whom the personal data has been shared, along with a description of the personal data shared.",
  },
  "12": {
    title: "Section 12 — Right to Correction and Erasure of Personal Data",
    text: "A Data Principal shall have the right to — (a) correction of inaccurate or misleading personal data; (b) completion of incomplete personal data; (c) updating of personal data; and (d) erasure of personal data, the retention of which is no longer necessary for the purpose for which it was processed.",
  },
  "14": {
    title: "Section 14 — Significant Data Fiduciary",
    text: "The Central Government may, on the basis of an assessment of relevant factors, notify any Data Fiduciary or class of Data Fiduciaries as Significant Data Fiduciary. Such Significant Data Fiduciary shall: (a) appoint a Data Protection Officer; (b) appoint an independent data auditor; (c) conduct periodic Data Protection Impact Assessments.",
  },
};

function parseSectionNumber(ref: string): string | null {
  const m = ref.match(/Section\s+(\d+)/i);
  return m ? m[1] : null;
}

function DpdpModal({ reference, onClose }: { reference: string; onClose: () => void }) {
  const sectionNum = parseSectionNumber(reference);
  const section = sectionNum ? DPDP_SECTIONS[sectionNum] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-emerald-dark/40 backdrop-blur-sm" />
      <div
        className="relative z-10 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-deep text-beige">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">DPDP Act 2023</p>
              <p className="font-display text-sm font-semibold text-ink">{section ? section.title : reference}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-beige-light">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          {section ? (
            <>
              <div className="mb-4 rounded-xl border border-emerald-light/30 bg-emerald-soft/30 px-4 py-3">
                <p className="font-mono text-xs font-semibold text-emerald-light">{reference}</p>
                <p className="mt-0.5 text-xs text-ink-muted">Digital Personal Data Protection Act, 2023</p>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">{section.text}</p>
            </>
          ) : (
            <p className="text-sm text-ink-soft">
              Section text not available in the offline viewer. Please refer to the official Act document below.
            </p>
          )}
          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <p className="text-xs text-ink-muted">Government of India · MeitY</p>
            <a
              href="https://www.meity.gov.in/data-protection-framework"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-light hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Official MeitY document
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FindingsPage() {
  const { data: findings, loading } = useAsync(() => findingsService.list(), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Finding | null>(null);
  const [dpdpRef, setDpdpRef] = useState<string | null>(null);

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
      <FindingDrawer finding={selected} onClose={() => setSelected(null)} onOpenDpdp={(ref) => setDpdpRef(ref)} />
      {dpdpRef && <DpdpModal reference={dpdpRef} onClose={() => setDpdpRef(null)} />}
    </div>
  );
}

function FindingDrawer({
  finding,
  onClose,
  onOpenDpdp,
}: {
  finding: Finding | null;
  onClose: () => void;
  onOpenDpdp: (ref: string) => void;
}) {
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

          {/* Clickable DPDP Reference — opens inline Act viewer */}
          <button
            onClick={() => onOpenDpdp(finding.dpdpReference)}
            className="flex w-full items-center gap-2 rounded-xl border border-line bg-white p-4 text-left transition-all hover:border-emerald-light/50 hover:bg-emerald-soft/20 hover:shadow-sm"
          >
            <FileText className="h-4 w-4 text-ink-muted" />
            <span className="text-sm text-ink-soft">DPDP reference</span>
            <span className="ml-auto font-semibold text-emerald-light">{finding.dpdpReference}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-emerald-light/70" />
          </button>

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
