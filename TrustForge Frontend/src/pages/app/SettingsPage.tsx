import { useState } from "react";
import {
  Building2,
  ShieldCheck,
  BadgeCheck,
  Globe,
  KeyRound,
  Bell,
  UserCog,
  Info,
  Save,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/cn";

export function SettingsPage() {
  const { user } = useAuth();
  const { org } = useOrg();
  const { notify } = useToast();
  const isOrg = user?.accountMode === "organization";
  const [notifs, setNotifs] = useState({ findings: true, weekly: true, product: false });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title="Settings" subtitle="Manage your profile, verification, and how TrustForge reaches you." />

      {isOrg && (
        <>
          <Card>
            <CardHeader eyebrow="Organization" title="Company profile" description="Details used across your assessment and reports." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Legal entity name" defaultValue={org.legalName} icon={<Building2 className="h-4 w-4" />} />
              <Input label="Display name" defaultValue={org.displayName} />
              <Input label="CIN" defaultValue={org.cin} />
              <Input label="GSTIN" defaultValue={org.gstin} />
              <Input label="Industry" defaultValue={org.industry} />
              <Input label="Company size" defaultValue={org.companySize} />
              <div className="sm:col-span-2">
                <Input label="Registered address" defaultValue={org.registeredAddress} />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button size="sm" onClick={() => notify("Profile saved.", "success")}>
                <Save className="h-4 w-4" /> Save changes
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Trust & verification"
              title="Verification status"
              description="Identity and control checks that strengthen your posture."
            />
            <div className="mt-4 space-y-3">
              <VerifyRow
                icon={BadgeCheck}
                label="GSTIN identity"
                sub="Confirms the entity exists and its registered name"
                verified={org.gstinVerified}
              />
              <VerifyRow
                icon={Globe}
                label="Domain control"
                sub="Confirms you control the primary domain"
                verified={org.domainVerified}
              />
              <VerifyRow
                icon={KeyRound}
                label="Authorization to act"
                sub="Confirms you are permitted to represent the entity"
                verified={org.authorizationVerified}
              />
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-line bg-canvas p-3 text-sm text-ink-soft">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              Verifying identity is not the same as proving authorization. A confirmed GSTIN shows the entity is
              real; it does not by itself show that you are allowed to act for it.
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Accountability" title="Grievance contact" description="Published as your point of contact for data questions." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Grievance officer" defaultValue={org.grievanceOfficer} icon={<UserCog className="h-4 w-4" />} />
              <Input label="Grievance email" defaultValue={org.grievanceEmail} />
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => notify("Grievance contact updated.", "success")}>
                <Save className="h-4 w-4" /> Update contact
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Personal / shared: profile */}
      <Card>
        <CardHeader eyebrow="Your account" title="Profile" description="How you appear inside TrustForge." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Full name" defaultValue={user?.name} />
          <Input label="Email" defaultValue={user?.email} />
          {user?.title && <Input label="Title" defaultValue={user.title} />}
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader eyebrow="Preferences" title="Notifications" description="Choose what TrustForge emails you about." />
        <div className="mt-4 divide-y divide-line">
          <ToggleRow
            icon={Bell}
            label="New and updated findings"
            hint="When a finding is raised or changes status"
            checked={notifs.findings}
            onChange={() => setNotifs((n) => ({ ...n, findings: !n.findings }))}
          />
          <ToggleRow
            icon={Bell}
            label="Weekly posture summary"
            hint="A short digest of your Trust Score and progress"
            checked={notifs.weekly}
            onChange={() => setNotifs((n) => ({ ...n, weekly: !n.weekly }))}
          />
          <ToggleRow
            icon={Bell}
            label="Product updates"
            hint="Occasional notes about new capabilities"
            checked={notifs.product}
            onChange={() => setNotifs((n) => ({ ...n, product: !n.product }))}
          />
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-danger/30">
        <CardHeader eyebrow="Danger zone" title="Delete account" description="Remove your account and associated assessment data." />
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-danger/20 bg-danger/5 p-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm text-ink-soft">
              This is permanent and cannot be undone. In this demo the action is disabled.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => notify("Account deletion is disabled in this demo.", "warning")}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </Card>
    </div>
  );
}

function VerifyRow({
  icon: Icon,
  label,
  sub,
  verified,
}: {
  icon: typeof BadgeCheck;
  label: string;
  sub: string;
  verified: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-beige-light text-emerald-light">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-muted">{sub}</p>
      </div>
      {verified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Pending</Badge>}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <Icon className="h-4 w-4 text-ink-muted" />
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-muted">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-emerald-deep" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
