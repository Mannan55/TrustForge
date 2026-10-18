import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ScanLine,
  CircleCheck,
  TriangleAlert,
  CircleAlert,
  RotateCcw,
  Gauge,
  Lock,
  ClipboardCheck,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ScoreRing } from "@/components/common/ScoreRing";
import { ProcessingVisual } from "@/components/scanner/ProcessingVisual";
import { useOrg } from "@/context/OrgContext";
import { scanService } from "@/services";
import { ANALYSIS_STAGES } from "@/data/dpdpFramework";
import { postureTone } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ScanCheck, ScanResultState, ScanSignalKind } from "@/types";

const stateMeta: Record<ScanResultState, { icon: typeof CircleCheck; color: string; tone: "success" | "warning" | "danger" }> = {
  pass: { icon: CircleCheck, color: "text-success", tone: "success" },
  attention: { icon: TriangleAlert, color: "text-warning", tone: "warning" },
  gap: { icon: CircleAlert, color: "text-danger", tone: "danger" },
};

const kindMeta: Record<ScanSignalKind, { label: string; icon: typeof CircleCheck }> = {
  technical: { label: "Technical & transport", icon: Lock },
  privacy: { label: "Privacy & consent", icon: ClipboardCheck },
  assessment: { label: "Site assessment", icon: Gauge },
};

type Phase = "idle" | "scanning" | "result";

interface ScanData {
  score: number;
  posture: string;
  url: string;
  checks: ScanCheck[];
}

export function WebsiteScanPage() {
  const { org } = useOrg();
  const [domain, setDomain] = useState(org.primaryDomain || "example.com");
  const [phase, setPhase] = useState<Phase>("idle");
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [visualDone, setVisualDone] = useState(false);

  const targetUrl = domain.startsWith("http://") || domain.startsWith("https://") ? domain : `https://${domain}`;

  useEffect(() => {
    if (visualDone && scanData) {
      setPhase("result");
    }
  }, [visualDone, scanData]);

  const run = async () => {
    setPhase("scanning");
    setVisualDone(false);
    setScanData(null);
    setScanError(null);

    try {
      const res = await scanService.runOrgScanFull(org.id, targetUrl);
      setScanData(res);
      // If network finishes, we can let visual finish naturally or snap
    } catch (err: any) {
      console.error("Scan failed:", err);
      setScanError(err?.detail || err?.message || "Failed to complete website scan. Verify the URL is publicly reachable.");
      setPhase("idle");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assessment"
        title="Website scan"
        subtitle="A deeper look at your live site: transport security, privacy signals, and observable assessment checks."
        actions={
          phase === "result" ? (
            <Button variant="outline" size="sm" onClick={run}>
              <RotateCcw className="h-4 w-4" /> Rescan
            </Button>
          ) : undefined
        }
      />

      {scanError && (
        <Card className="border-danger/30 bg-danger/5">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="font-semibold text-danger">Website Scan Incomplete</p>
              <p className="mt-1 text-sm text-ink-soft">{scanError}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={run}>
                Try again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {phase === "idle" && (
        <Card>
          <label htmlFor="domain" className="text-sm font-medium text-ink">
            Domain to scan
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="sm:flex-1"
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
            <Button onClick={run} className="shrink-0">
              <ScanLine className="h-4 w-4" /> Run scan
            </Button>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            The scan observes only what is publicly reachable. It does not attempt to log in or probe
            protected endpoints.
          </p>
        </Card>
      )}

      {phase === "scanning" && (
        <ProcessingVisual
          stages={ANALYSIS_STAGES}
          stageMs={560}
          onComplete={() => setVisualDone(true)}
          title="Scanning your website"
          subtitle={domain}
        />
      )}

      {phase === "result" && scanData && <ScanResults scanData={scanData} domain={domain} />}
    </div>
  );
}

function ScanResults({ scanData, domain }: { scanData: ScanData; domain: string }) {
  const { checks, score, posture } = scanData;
  const counts = useMemo(
    () => ({
      pass: checks.filter((c) => c.state === "pass").length,
      attention: checks.filter((c) => c.state === "attention").length,
      gap: checks.filter((c) => c.state === "gap").length,
    }),
    [checks],
  );
  const kinds: ScanSignalKind[] = ["technical", "privacy", "assessment"];

  return (
    <div className="animate-fade-in space-y-6">
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <ScoreRing score={score} size={100} label="preliminary" />
            <div>
              <p className="eyebrow">Preliminary Website Technical Readiness</p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">{domain}</p>
              <div className="mt-2">
                <Badge tone={postureTone(posture as any)}>{posture}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <CountPill icon={CircleCheck} color="text-success" label="Passed" value={counts.pass} />
            <CountPill icon={TriangleAlert} color="text-warning" label="Attention" value={counts.attention} />
            <CountPill icon={CircleAlert} color="text-danger" label="Gaps" value={counts.gap} />
          </div>
        </div>
      </Card>

      {/* Scope distinction & Gate to Full Assessment Wizard */}
      <Card className="border-emerald-light/40 bg-emerald-soft/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-display font-semibold text-ink">
              Ready to evaluate complete DPDP compliance?
            </p>
            <p className="text-sm text-ink-soft">
              This score measures observable technical signals (transport security, public headers, notice availability). It is preliminary and does not replace the full organizational assessment.
            </p>
          </div>
          <Link to="/assessment" className="shrink-0">
            <Button size="sm">
              Continue into Assessment Wizard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>

      {kinds.map((kind) => {
        const items = checks.filter((c) => c.kind === kind);
        if (items.length === 0) return null;
        const meta = kindMeta[kind];
        return (
          <div key={kind}>
            <div className="mb-3 flex items-center gap-2">
              <meta.icon className="h-4 w-4 text-emerald-light" />
              <h2 className="font-display text-sm font-semibold text-ink">{meta.label}</h2>
              <span className="tabular text-xs text-ink-muted">{items.length} checks</span>
            </div>
            <Card padded={false}>
              <div className="divide-y divide-line">
                {items.map((c) => (
                  <CheckRow key={c.id} check={c} />
                ))}
              </div>
            </Card>
          </div>
        );
      })}

      <p className="text-center text-xs text-ink-muted">
        Scan results reflect observable signals at the time of scanning. They inform your posture but
        are not a statement of DPDP compliance.
      </p>
    </div>
  );
}

function CheckRow({ check }: { check: ScanCheck }) {
  const [open, setOpen] = useState(false);
  const meta = stateMeta[check.state];
  const expandable = check.state !== "pass" && (check.recommendation || check.evidence);

  return (
    <div>
      <button
        onClick={() => expandable && setOpen((v) => !v)}
        className={cn("flex w-full items-start gap-3 px-5 py-3.5 text-left sm:px-6", expandable && "hover:bg-beige-light/40")}
      >
        <meta.icon className={cn("mt-0.5 h-5 w-5 shrink-0", meta.color)} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">{check.label}</p>
          <p className="mt-0.5 text-sm text-ink-soft">{check.detail}</p>
        </div>
        {expandable && (
          <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-ink-muted transition-transform", open && "rotate-180")} />
        )}
      </button>
      {open && expandable && (
        <div className="space-y-3 px-5 pb-4 pl-14 sm:px-6 sm:pl-15 animate-fade-in">
          {check.recommendation && (
            <div className="rounded-lg border border-emerald-light/30 bg-emerald-soft/50 p-3">
              <p className="eyebrow mb-1">Recommendation</p>
              <p className="text-sm text-ink">{check.recommendation}</p>
            </div>
          )}
          {check.evidence && (
            <div className="rounded-lg border border-line bg-canvas p-3">
              <p className="eyebrow mb-1">Observed</p>
              <p className="font-mono text-xs text-ink-soft">{check.evidence}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CountPill({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof CircleCheck;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
      <Icon className={cn("h-4 w-4", color)} />
      <span className="tabular font-display text-lg font-semibold text-ink">{value}</span>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}
