import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type {
  Severity,
  FindingStatus,
  EvidenceStatus,
  EvidenceConfidence,
} from "@/types";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-beige-light text-ink-soft border-line-strong",
  success: "bg-success-soft text-success border-success-line",
  warning: "bg-warning-soft text-warning border-warning-line",
  danger: "bg-danger-soft text-danger border-danger-line",
  info: "bg-info-soft text-info border-info-line",
  brand: "bg-emerald-soft text-emerald-deep border-emerald-light/30",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const severityTone: Record<Severity, Tone> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
};
const severityLabel: Record<Severity, string> = {
  HIGH: "High priority",
  MEDIUM: "Medium priority",
  LOW: "Low priority",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge tone={severityTone[severity]}>{severityLabel[severity]}</Badge>;
}

const statusTone: Record<FindingStatus, Tone> = {
  OPEN: "danger",
  IN_PROGRESS: "info",
  REMEDIATED: "success",
  REQUIRES_REVIEW: "warning",
  DISMISSED: "neutral",
};
const statusLabel: Record<FindingStatus, string> = {
  OPEN: "Open action",
  IN_PROGRESS: "In progress",
  REMEDIATED: "Resolved",
  REQUIRES_REVIEW: "Requires review",
  DISMISSED: "Dismissed",
};

export function FindingStatusBadge({ status }: { status: FindingStatus | string }) {
  const normalized = String(status || "").toUpperCase();
  const tone = statusTone[normalized as FindingStatus] ?? (normalized === "PASS" ? "success" : normalized === "FAIL" ? "danger" : "info");
  const label = statusLabel[normalized as FindingStatus] ?? (normalized ? normalized.replace(/_/g, " ") : "Open");
  return <Badge tone={tone}>{label}</Badge>;
}

const evidenceTone: Record<string, Tone> = {
  VERIFIED: "success",
  DETECTED: "brand",
  SELF_REPORTED: "brand",
  INFERRED: "info",
  NOT_FOUND: "danger",
  NOT_ASSESSED: "neutral",
};
const evidenceLabel: Record<string, string> = {
  VERIFIED: "Verified",
  DETECTED: "Detected",
  SELF_REPORTED: "Self-Reported",
  INFERRED: "Inferred",
  NOT_FOUND: "Not found",
  NOT_ASSESSED: "Not assessed",
};

export function EvidenceBadge({ status }: { status: EvidenceStatus | string }) {
  const key = (status || "DETECTED").toUpperCase();
  const tone = evidenceTone[key] || "neutral";
  const label = evidenceLabel[key] || key.replace(/_/g, " ");
  return <Badge tone={tone}>{label}</Badge>;
}

const confidenceTone: Record<string, Tone> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "danger",
};

export function ConfidenceBadge({ confidence }: { confidence: EvidenceConfidence | string | number | undefined | null }) {
  let key: string;
  if (typeof confidence === "number") {
    key = confidence >= 0.8 ? "HIGH" : confidence >= 0.5 ? "MEDIUM" : "LOW";
  } else if (typeof confidence === "string" && confidence.trim()) {
    key = confidence.trim().toUpperCase();
  } else {
    key = "MEDIUM";
  }
  const tone = confidenceTone[key] || "warning";
  const formatted = key.charAt(0) + key.slice(1).toLowerCase();
  return <Badge tone={tone}>{formatted} confidence</Badge>;
}

