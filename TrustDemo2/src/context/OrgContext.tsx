import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Organization } from "@/types";
import { DEMO_ORG } from "@/data/organization";
import { postureForScore } from "@/lib/format";

interface OrgContextValue {
  org: Organization;
  updateOrg: (patch: Partial<Organization>) => void;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Organization>(DEMO_ORG);

  const updateOrg = useCallback((patch: Partial<Organization>) => {
    setOrg((prev) => {
      const next = { ...prev, ...patch };
      if (patch.trustScore != null) next.posture = postureForScore(patch.trustScore);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ org, updateOrg }), [org, updateOrg]);
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
