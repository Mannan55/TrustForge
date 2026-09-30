import type { PostureLevel } from "@/types";

/** Map a numeric TrustForge score to its posture band. */
export function postureForScore(score: number): PostureLevel {
  if (score >= 80) return "Strong Alignment";
  if (score >= 65) return "Needs Attention";
  if (score >= 50) return "Potential Gaps";
  return "Critical";
}

/** Tailwind tone key for a posture band, used by badges and pills. */
export function postureTone(posture: PostureLevel): "success" | "warning" | "info" | "danger" {
  switch (posture) {
    case "Strong Alignment":
      return "success";
    case "Needs Attention":
      return "warning";
    case "Potential Gaps":
      return "info";
    case "Critical":
      return "danger";
  }
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
