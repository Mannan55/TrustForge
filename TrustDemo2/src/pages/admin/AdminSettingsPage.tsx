import { useState, type ReactNode } from "react";
import { Radar, ShieldCheck, Bell, Database, KeyRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Input";
import { useToast } from "@/context/ToastContext";
import { Switch } from "./shared";

interface ToggleDef {
  key: string;
  label: string;
  hint: string;
}

const ENGINE: ToggleDef[] = [
  { key: "autoScan", label: "Auto re-scan tenants weekly", hint: "Queue a fresh website scan for every active tenant each week." },
  { key: "humanReview", label: "Route low-confidence results to review", hint: "Classifications below 60% confidence wait for a human before affecting posture." },
  { key: "draftFindings", label: "Publish findings as drafts", hint: "New findings stay hidden from tenants until a reviewer confirms them." },
];

const NOTIFY: ToggleDef[] = [
  { key: "digest", label: "Weekly platform digest", hint: "A Monday summary of new tenants, scans, and open findings." },
  { key: "incident", label: "Incident alerts", hint: "Notify the on-call reviewer when a service is degraded or down." },
];

const ACCESS: ToggleDef[] = [
  { key: "sso", label: "Enforce SSO for admins", hint: "Require single sign-on for everyone with console access." },
  { key: "audit", label: "Log every privileged action", hint: "Write an audit entry for suspensions, role changes, and exports." },
];

const initial: Record<string, boolean> = {
  autoScan: true,
  humanReview: true,
  draftFindings: false,
  digest: true,
  incident: true,
  sso: false,
  audit: true,
};

export function AdminSettingsPage() {
  const { notify } = useToast();
  const [state, setState] = useState(initial);
  const [retention, setRetention] = useState("365");

  const toggle = (key: string) =>
    setState((s) => {
      const next = { ...s, [key]: !s[key] };
      notify("Setting updated (mocked in this demo).", "success");
      return next;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Console settings"
        subtitle="Platform-wide defaults for how TrustForge scans, reviews, and notifies. Changes here apply to every tenant."
        actions={
          <Button size="sm" onClick={() => notify("Settings saved (mocked in this demo).", "success")}>
            Save changes
          </Button>
        }
      />

      <SettingSection icon={Radar} title="Assessment engine" description="How scans and automated classifications behave by default.">
        {ENGINE.map((t) => (
          <ToggleRow key={t.key} def={t} checked={state[t.key]} onChange={() => toggle(t.key)} />
        ))}
      </SettingSection>

      <SettingSection icon={ShieldCheck} title="Review policy" description="Guardrails that keep a human in the loop.">
        <ToggleRow
          def={{ key: "humanReview", label: "Require reviewer confirmation", hint: "No automated result changes a tenant's posture without a reviewer." }}
          checked={state.humanReview}
          onChange={() => toggle("humanReview")}
        />
        <ToggleRow
          def={{ key: "draftFindings", label: "Publish findings as drafts", hint: "New findings stay hidden from tenants until confirmed." }}
          checked={state.draftFindings}
          onChange={() => toggle("draftFindings")}
        />
      </SettingSection>

      <SettingSection icon={Bell} title="Notifications" description="What the platform team hears about.">
        {NOTIFY.map((t) => (
          <ToggleRow key={t.key} def={t} checked={state[t.key]} onChange={() => toggle(t.key)} />
        ))}
      </SettingSection>

      <SettingSection icon={Database} title="Data and retention" description="How long the platform keeps operational records.">
        <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-ink">Audit log retention</p>
            <p className="text-sm text-ink-muted">How long privileged-action logs are kept before archival.</p>
          </div>
          <Select
            options={[
              { value: "90", label: "90 days" },
              { value: "180", label: "180 days" },
              { value: "365", label: "1 year" },
              { value: "1095", label: "3 years" },
            ]}
            value={retention}
            onChange={(e) => {
              setRetention(e.target.value);
              notify("Retention updated (mocked in this demo).", "success");
            }}
            className="sm:w-40"
          />
        </div>
      </SettingSection>

      <SettingSection icon={KeyRound} title="Access and security" description="Who can reach the console and how it is recorded.">
        {ACCESS.map((t) => (
          <ToggleRow key={t.key} def={t} checked={state[t.key]} onChange={() => toggle(t.key)} />
        ))}
      </SettingSection>
    </div>
  );
}

function SettingSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-beige-light text-emerald-light">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          <p className="text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      <div className="mt-2 divide-y divide-line">{children}</div>
    </Card>
  );
}

function ToggleRow({ def, checked, onChange }: { def: ToggleDef; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="font-medium text-ink">{def.label}</p>
        <p className="text-sm text-ink-muted">{def.hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={def.label} />
    </div>
  );
}
