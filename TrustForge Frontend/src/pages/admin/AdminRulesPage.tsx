import { useState } from "react";
import { ScrollText, Plus, FileCheck2, BookOpen, Shield, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Badge, SeverityBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { PageSkeleton } from "@/components/common/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/context/ToastContext";
import { adminService } from "@/services";
import { Switch } from "./shared";
import type { ComplianceRule } from "@/types";

export function AdminRulesPage() {
  const { data, loading } = useAsync(() => adminService.rules(), []);
  const { notify } = useToast();
  const [rules, setRules] = useState<ComplianceRule[] | null>(null);

  const list = rules ?? data;
  if (loading || !list) return <PageSkeleton />;

  const toggle = (rule: ComplianceRule) => {
    setRules(list.map((r) => (r.id === rule.id ? { ...r, active: !r.active } : r)));
    notify(`${rule.code} ${rule.active ? "disabled" : "enabled"} (mocked).`, rule.active ? "warning" : "success");
  };

  const active = list.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review & rules"
        title="Compliance rules"
        subtitle="The DPDP-aligned checks that drive findings. Each rule states the requirement and the evidence that satisfies it."
        actions={
          <Button size="sm" onClick={() => notify("Rule authoring is mocked in this demo.", "info")}>
            <Plus className="h-4 w-4" /> New rule
          </Button>
        }
      />

      {/* Statutory authority banner — clarifies how rules originate */}
      <div className="rounded-2xl border border-emerald-light/30 bg-emerald-soft/40 p-5">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-deep text-beige">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-semibold text-ink">How compliance rules work</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-deep/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-deep">
                <Shield className="h-3 w-3" /> DPDP Act 2023
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              These rules are <strong className="text-ink font-medium">extracted directly from India's Digital Personal Data Protection Act, 2023</strong> — enacted by the Government of India via MeitY. Each rule maps a statutory obligation from the Act (e.g., Section 6 on consent, Section 8 on security safeguards) to an automated scan check or an evidence requirement.
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              TrustForge does <em>not</em> create rules from scratch. The platform's rule engine reads the Act's mandatory obligations, translates them into machine-verifiable checks, and evaluates each organisation against those checks. Admins can toggle rules active or inactive to control which checks generate findings for tenants.
            </p>
            <a
              href="https://www.meity.gov.in/data-protection-framework"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-light hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View the official DPDP Act 2023 — MeitY
            </a>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <ScrollText className="h-4 w-4" />
        <span className="tabular">{active}</span> of <span className="tabular">{list.length}</span> rules active
      </div>

      <div className="space-y-3">
        {list.map((rule) => (
          <Card key={rule.id} padded={false} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-ink-muted">{rule.code}</span>
                  <SeverityBadge severity={rule.severity} />
                  <Badge tone="neutral">{rule.category}</Badge>
                </div>
                <p className="mt-2 font-medium text-ink">{rule.requirement}</p>
                <div className="mt-2 flex items-start gap-2 text-sm text-ink-soft">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                  <span>Evidence: {rule.evidenceRequirement}</span>
                </div>
                <p className="mt-2 text-xs text-ink-muted">Updated {rule.updatedAt}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Switch checked={rule.active} onChange={() => toggle(rule)} label={`Toggle ${rule.code}`} />
                <span className="text-xs text-ink-muted">{rule.active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
