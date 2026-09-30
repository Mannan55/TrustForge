import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  CircleCheck,
  CircleAlert,
  TriangleAlert,
  Lock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { ScoreRing } from "@/components/common/ScoreRing";
import { ProcessingVisual } from "@/components/scanner/ProcessingVisual";
import { scanService } from "@/services";
import type { PublicScanResult, ScanResultState } from "@/types";
import { postureTone } from "@/lib/format";

const SCAN_STAGES = [
  "Resolving domain and endpoints",
  "Checking transport security",
  "Reading the privacy notice",
  "Inspecting the consent banner",
  "Reviewing third-party trackers",
  "Scoring preliminary posture",
];

type Phase = "idle" | "scanning" | "result";

const stateMeta: Record<
  ScanResultState,
  { icon: typeof CircleCheck; tone: "success" | "warning" | "danger"; color: string; label: string }
> = {
  pass: { icon: CircleCheck, tone: "success", color: "text-success", label: "Looks good" },
  attention: { icon: TriangleAlert, tone: "warning", color: "text-warning", label: "Worth a look" },
  gap: { icon: CircleAlert, tone: "danger", color: "text-danger", label: "Needs attention" },
};

export function PublicScanPage() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<PublicScanResult | null>(null);
  const [visualDone, setVisualDone] = useState(false);

  useEffect(() => {
    if (visualDone && result) setPhase("result");
  }, [visualDone, result]);

  const runScan = () => {
    setPhase("scanning");
    setResult(null);
    setVisualDone(false);
    scanService.runPublicScan(url.trim() || "https://www.technova.in").then(setResult);
  };

  const reset = () => {
    setPhase("idle");
    setResult(null);
    setVisualDone(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="text-center">
        <Badge tone="brand" className="mb-4">
          Free preliminary scan
        </Badge>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Scan your website for DPDP signals
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          Enter a public URL. TrustForge reviews what a visitor can observe, then returns a
          preliminary posture. No account needed, and nothing is stored.
        </p>
      </div>

      {phase === "idle" && (
        <Card className="mx-auto mt-10 max-w-xl">
          <label htmlFor="scan-url" className="text-sm font-medium text-ink">
            Website URL
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Input
              id="scan-url"
              placeholder="https://www.yourcompany.in"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              onKeyDown={(e) => e.key === "Enter" && runScan()}
              className="sm:flex-1"
            />
            <Button onClick={runScan} className="shrink-0">
              Run scan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Try it with the demo domain www.technova.in if you do not have a URL handy.
          </p>
        </Card>
      )}

      {phase === "scanning" && (
        <div className="mx-auto mt-10 max-w-3xl">
          <ProcessingVisual
            stages={SCAN_STAGES}
            stageMs={620}
            onComplete={() => setVisualDone(true)}
            title="Scanning your website"
            subtitle={url.trim() || "https://www.technova.in"}
          />
        </div>
      )}

      {phase === "result" && result && (
        <div className="mt-10 animate-fade-in">
          <Card className="overflow-hidden" padded={false}>
            <div className="flex flex-col gap-6 border-b border-line p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <ScoreRing score={result.score} size={104} label="preliminary" />
                <div>
                  <p className="eyebrow">Preliminary TrustForge Assessment</p>
                  <p className="mt-1 font-display text-xl font-semibold text-ink">{result.url}</p>
                  <div className="mt-2">
                    <Badge tone={postureTone(result.posture)}>{result.posture}</Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                Scan another
              </Button>
            </div>

            <div className="divide-y divide-line">
              {result.highlights.map((h) => {
                const meta = stateMeta[h.state];
                return (
                  <div key={h.label} className="flex items-start gap-3 p-5">
                    <meta.icon className={`mt-0.5 h-5 w-5 shrink-0 ${meta.color}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">{h.label}</p>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">{h.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Gate to full assessment */}
          <Card className="mt-5 border-emerald-light/30 bg-emerald-soft/60">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-deep text-bone">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display font-semibold text-ink">
                    This is a surface scan. The full picture needs context.
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    Create an account to run the guided assessment, attach evidence, and get your
                    complete Trust Score with prioritised findings.
                  </p>
                </div>
              </div>
              <Link to="/signup" className="w-full shrink-0 sm:w-auto">
                <Button className="w-full sm:w-auto">
                  Start full assessment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>

          <p className="mt-4 text-center text-xs text-ink-muted">
            A preliminary scan reflects observable signals only. It is not a statement of DPDP
            compliance.
          </p>
        </div>
      )}
    </div>
  );
}
