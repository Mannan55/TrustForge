import { useEffect, useRef, useState } from "react";

/**
 * Drives a staged progress sequence. Returns the active stage index and a
 * 0-100 progress value. When finished, `done` flips true.
 *
 * This is the timing engine behind the TrustForge processing visual. It is
 * deliberately plain: fixed cadence, no randomness, no "thinking" theatrics.
 */
export function useStagedProgress(
  stageCount: number,
  {
    stageMs = 700,
    run = true,
    onDone,
  }: { stageMs?: number; run?: boolean; onDone?: () => void } = {},
) {
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!run) return;
    setStage(0);
    setDone(false);
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      if (current >= stageCount) {
        clearInterval(timer);
        setStage(stageCount);
        setDone(true);
        onDoneRef.current?.();
      } else {
        setStage(current);
      }
    }, stageMs);
    return () => clearInterval(timer);
  }, [stageCount, stageMs, run]);

  const progress = Math.min(100, Math.round((Math.min(stage, stageCount) / stageCount) * 100));
  return { stage, progress, done };
}
