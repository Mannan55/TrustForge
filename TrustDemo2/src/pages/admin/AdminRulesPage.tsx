import { useState } from "react";
import { ScrollText, Plus, FileCheck2 } from "lucide-react";
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
