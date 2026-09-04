import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStagedProgress } from "@/hooks/useStagedProgress";

/**
 * The TrustForge processing visual.
 *
 * An original, brand-native loading experience: a document being read by a
 * horizontal scan line inside a framed panel, paired with a segmented stage
 * checklist and a thin progress bar. No sparkle, no star, no magic-wand, no
 * robot, no glow. The aesthetic is a quiet technical document scan.
 */
export function ProcessingVisual({
  stages,
  stageMs = 700,
  run = true,
  onComplete,
  title = "Running TrustForge analysis",
  subtitle = "Reviewing your responses and observed signals",
}: {
  stages: string[];
  stageMs?: number;
  run?: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
}) {
  const { stage, progress, done } = useStagedProgress(stages.length, {
    stageMs,
    run,
    onDone: onComplete,
  });

  return (
    <div className="rounded-2xl border border-emerald-mid bg-emerald-deep text-bone overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left: framed document with a sweeping scan line */}
        <div className="relative p-6 sm:p-8 border-b md:border-b-0 md:border-r border-emerald-mid">
          <p className="eyebrow text-beige/80 mb-1">TrustForge processing</p>
          <h3 className="text-lg font-semibold font-display text-bone">{title}</h3>
          <p className="text-sm text-bone/70 mt-1">{subtitle}</p>

          <div className="relative mt-6 mx-auto aspect-[4/3] max-w-xs rounded-xl border border-emerald-light/40 bg-emerald-dark/60 overflow-hidden">
            {/* Document lines */}
            <div className="absolute inset-0 p-5 flex flex-col gap-2.5">
              {[92, 78, 85, 60, 88, 70, 82, 54].map((w, i) => (
                <div
                  key={i}
                  className="h-2 rounded-full bg-emerald-light/25"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
            {/* Scan sweep */}
            {!done && (
              <div className="absolute inset-x-0 h-14 animate-scan-sweep pointer-events-none">
                <div className="h-full w-full bg-gradient-to-b from-transparent via-beige/25 to-transparent" />
                <div className="h-px w-full bg-beige/70 -mt-px" />
              </div>
            )}
            {/* Corner registration marks */}
            {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos) => (
              <span
                key={pos}
                className={cn("absolute h-3 w-3 border-beige/50", pos)}
                style={{
                  borderTopWidth: pos.includes("top") ? 1 : 0,
                  borderBottomWidth: pos.includes("bottom") ? 1 : 0,
                  borderLeftWidth: pos.includes("left") ? 1 : 0,
                  borderRightWidth: pos.includes("right") ? 1 : 0,
                }}
              />
            ))}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-bone/70 mb-2">
              <span>{done ? "Analysis complete" : "Working"}</span>
              <span className="tabular">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-emerald-dark overflow-hidden">
              <div
                className="h-full rounded-full bg-beige transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: stage checklist */}
        <div className="p-6 sm:p-8">
          <p className="eyebrow text-beige/80 mb-4">Stages</p>
          <ol className="space-y-3">
            {stages.map((label, i) => {
              const complete = i < stage || done;
              const active = i === stage && !done;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                      complete
                        ? "bg-beige text-emerald-deep border-beige"
                        : active
                          ? "border-beige text-beige animate-pulse-ring"
                          : "border-emerald-light/40 text-bone/40",
                    )}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      complete ? "text-bone/80" : active ? "text-bone font-medium" : "text-bone/40",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
