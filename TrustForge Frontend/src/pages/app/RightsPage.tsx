import { useState } from "react";
import {
  Eye,
  PencilLine,
  Trash2,
  MessageSquareWarning,
  UserPlus,
  ArrowRight,
  Info,
  Send,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Select, Textarea, Input } from "@/components/common/Input";
import { useToast } from "@/context/ToastContext";
import { DATA_RIGHTS } from "@/data/dpdpFramework";

const rightIcon: Record<string, typeof Eye> = {
  access: Eye,
  correction: PencilLine,
  erasure: Trash2,
  grievance: MessageSquareWarning,
  nominate: UserPlus,
};

const rightExpectation: Record<string, string> = {
  access: "A readable summary of what data an organization holds about you and how it is used.",
  correction: "Inaccurate or outdated details updated once your request is verified.",
  erasure: "Deletion of data that is no longer needed, unless a law requires it to be kept.",
  grievance: "A response from the organization's grievance officer within a reasonable time.",
  nominate: "Another person you name can exercise your rights if you are unable to.",
};

export function RightsPage() {
  const { notify } = useToast();
  const [right, setRight] = useState("access");
  const [org, setOrg] = useState("");

  const submit = () => {
    if (!org.trim()) {
      notify("Add the organization you want to contact.", "warning");
      return;
    }
    notify("Request drafted. Sending is mocked in this demo.", "info");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your rights"
        title="Data rights under the DPDP Act"
        subtitle="As a Data Principal in India, you have specific rights over your personal data. Here is what each one means and how to use it."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {DATA_RIGHTS.map((r) => {
          const Icon = rightIcon[r.id] ?? Eye;
          return (
            <Card key={r.id}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-deep text-beige">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display font-semibold text-ink">{r.name}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{r.detail}</p>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-canvas p-3">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-light" />
                <p className="text-xs text-ink-soft">{rightExpectation[r.id]}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* How to exercise */}
      <Card>
        <p className="font-display font-semibold text-ink">How to exercise a right</p>
        <ol className="mt-4 space-y-3">
          {[
            "Identify the organization that holds your data and find their grievance officer contact.",
            "State clearly which right you are exercising and what you are asking for.",
            "Verify your identity if the organization asks, so they release data to the right person.",
            "Keep a record. If you get no response in a reasonable time, escalate to the Data Protection Board.",
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-beige-light text-xs font-semibold text-emerald-deep tabular">
                {i + 1}
              </span>
              <span className="text-sm text-ink-soft">{s}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* Draft a request */}
      <Card>
        <p className="font-display font-semibold text-ink">Draft a request</p>
        <p className="mt-1 text-sm text-ink-soft">
          Prepare a clear request to send to an organization. TrustForge helps you word it; you send it to the
          organization directly.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select
            label="Right you want to exercise"
            value={right}
            onChange={(e) => setRight(e.target.value)}
            options={DATA_RIGHTS.map((r) => ({ value: r.id, label: r.name }))}
          />
          <Input label="Organization" placeholder="e.g. an app or website you use" value={org} onChange={(e) => setOrg(e.target.value)} />
        </div>
        <div className="mt-4">
          <Textarea
            label="Details (optional)"
            placeholder="Add any specifics, such as the account email you use with them."
            rows={3}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Info className="h-3.5 w-3.5" /> Nothing is sent automatically in this demo.
          </p>
          <Button size="sm" onClick={submit}>
            <Send className="h-4 w-4" /> Draft request
          </Button>
        </div>
      </Card>

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-4 text-sm text-ink-soft">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-light" />
        <span>
          TrustForge is not a government body and does not process requests on an organization's behalf. This
          page is educational and helps you understand and prepare to use your rights.
        </span>
      </div>
    </div>
  );
}
