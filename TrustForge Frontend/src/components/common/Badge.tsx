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

export function FindingStatusBadge({ status }: { status: FindingStatus }) {
  return <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>;
}

const evidenceTone: Record<EvidenceStatus, Tone> = {
  VERIFIED: "success",
  DETECTED: "brand",
  INFERRED: "info",
  NOT_FOUND: "danger",
  NOT_ASSESSED: "neutral",
};
const evidenceLabel: Record<EvidenceStatus, string> = {
  VERIFIED: "Verified",
  DETECTED: "Detected",
  INFERRED: "Inferred",
  NOT_FOUND: "Not found",
  NOT_ASSESSED: "Not assessed",
};

export function EvidenceBadge({ status }: { status: EvidenceStatus }) {
  return <Badge tone={evidenceTone[status]}>{evidenceLabel[status]}</Badge>;
}

const confidenceTone: Record<EvidenceConfidence, Tone> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "danger",
};

export function ConfidenceBadge({ confidence }: { confidence: EvidenceConfidence }) {
  return <Badge tone={confidenceTone[confidence]}>{confidence[0] + confidence.slice(1).toLowerCase()} confidence</Badge>;
}
