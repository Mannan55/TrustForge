import type { ReactNode } from "react";
import { Printer, Download, ShieldCheck, FileText, Hash, Calendar, CircleCheck, CircleDot, CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { SeverityBadge } from "@/components/common/Badge";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { PILLARS, FINDINGS, EVIDENCE, REPORT_META } from "@/data/assessmentData";
import { cn } from "@/lib/cn";

export function ReportsPage() {
  const { org } = useOrg();
  const { notify } = useToast();

  const open = FINDINGS.filter((f) => f.status !== "REMEDIATED").length;
  const verified = EVIDENCE.filter((e) => e.status === "VERIFIED").length;

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          eyebrow="Reports"
          title="Assessment report"
          subtitle="A shareable summary of your current posture. Print to PDF for your records or to send to a stakeholder."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => notify("PDF export is mocked. Use Print to save as PDF.", "info")}>
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          }
        />
      </div>

      {/* The printable sheet */}
      <div className="print-sheet mx-auto max-w-3xl rounded-2xl border border-line bg-white p-8 sm:p-10">
        {/* Report header */}
        <div className="flex items-start justify-between border-b border-line pb-6">
          <div>
            <BrandLogo variant="primary" height={30} />
            <p className="mt-3 font-display text-xl font-semibold text-ink">DPDP Posture Assessment</p>
            <p className="text-sm text-ink-muted">Preliminary TrustForge Assessment</p>
          </div>
          <div className="text-right text-xs text-ink-muted">
            <MetaLine icon={Hash} value={REPORT_META.reportId} />
            <MetaLine icon={Calendar} value={REPORT_META.issuedOn} />
          </div>
        </div>

        {/* Entity + score */}
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Prepared for</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">{org.legalName}</p>
            <p className="text-sm text-ink-muted">
              {org.primaryDomain} · {org.registeredAddress}
            </p>
            <p className="mt-1 text-sm text-ink-muted">CIN {org.cin}</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-canvas px-5 py-4">
            <div>
              <p className="text-xs text-ink-muted">Trust Score</p>
              <p className="tabular font-display text-4xl font-semibold text-emerald-deep">{org.trustScore}</p>
            </div>
            <div className="h-12 w-px bg-line" />
            <div>
              <p className="text-xs text-ink-muted">Posture</p>
              <p className="font-display text-base font-semibold text-ink">{org.posture}</p>
            </div>
          </div>
        </div>

        {/* Pillar table */}
        <Section title="Pillar breakdown">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="pb-2 font-medium">Pillar</th>
                <th className="pb-2 text-center font-medium">Weight</th>
                <th className="pb-2 text-center font-medium">Coverage</th>
                <th className="pb-2 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PILLARS.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 font-medium text-ink">{p.name}</td>
                  <td className="py-2.5 text-center tabular text-ink-soft">{p.weight}%</td>
                  <td className="py-2.5 text-center tabular text-ink-soft">{p.evidenceCoverage}%</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={cn(
                        "tabular font-semibold",
                        p.score >= 80 ? "text-success" : p.score >= 65 ? "text-warning" : "text-danger",
                      )}
                    >
                      {p.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Summary stats */}
        <Section title="At a glance">
          <div className="grid grid-cols-3 gap-3">
            <StatBox icon={CircleDot} label="Open findings" value={open} />
            <StatBox icon={CircleCheck} label="Verified evidence" value={verified} />
            <StatBox icon={FileText} label="Pillars assessed" value={PILLARS.length} />
          </div>
        </Section>

        {/* Key findings */}
        <Section title="Priority findings">
          <div className="space-y-3">
            {FINDINGS.filter((f) => f.status !== "REMEDIATED")
              .slice(0, 4)
              .map((f) => (
                <div key={f.id} className="page-break flex items-start gap-3 rounded-xl border border-line p-4">
                  <CircleAlert
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      f.severity === "HIGH" ? "text-danger" : f.severity === "MEDIUM" ? "text-warning" : "text-info",
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-muted">{f.id}</span>
                      <SeverityBadge severity={f.severity} />
                    </div>
                    <p className="mt-1 font-medium text-ink">{f.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">{f.recommendedAction}</p>
                    <p className="mt-1.5 font-mono text-xs text-emerald-light">DPDP {f.dpdpReference}</p>
                  </div>
                </div>
              ))}
          </div>
        </Section>

        {/* Disclaimer + signature */}
        <div className="mt-8 rounded-xl border border-line bg-canvas p-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-light" />
            <p className="text-xs leading-relaxed text-ink-muted">
              This report is a Preliminary TrustForge Assessment produced by the {REPORT_META.framework}. It
              reflects responses provided and signals observed as of {REPORT_META.issuedOn}. It is a working
              posture to guide improvement and is not a certification or legal statement of DPDP compliance.
            </p>
          </div>
          <p className="mt-3 font-mono text-[11px] text-ink-muted">Document integrity hash · {REPORT_META.documentHash}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-7">
      <p className="eyebrow mb-3">{title}</p>
      {children}
    </div>
  );
}

function MetaLine({ icon: Icon, value }: { icon: typeof Hash; value: string }) {
  return (
    <p className="flex items-center justify-end gap-1.5 py-0.5">
      <Icon className="h-3.5 w-3.5" /> <span className="font-mono">{value}</span>
    </p>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4 text-center">
      <Icon className="mx-auto h-4 w-4 text-emerald-light" />
      <p className="tabular mt-1.5 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
