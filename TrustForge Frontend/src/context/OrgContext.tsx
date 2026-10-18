import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Organization } from "@/types";
import { DEMO_ORG } from "@/data/organization";
import { postureForScore } from "@/lib/format";
import { orgService } from "@/services";

interface OrgContextValue {
  org: Organization;
  updateOrg: (patch: Partial<Organization>) => void;
  reloadOrg: () => Promise<void>;
  loading: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Organization>(DEMO_ORG);
  const [loading, setLoading] = useState(true);

  const reloadOrg = useCallback(async () => {
    try {
      const real = await orgService.getOrganization();
      setOrg(real);
    } catch (err) {
      console.warn("Failed to load initial organization:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadOrg();
  }, [reloadOrg]);

  const updateOrg = useCallback((patch: Partial<Organization>) => {
    setOrg((prev) => {
      const next = { ...prev, ...patch };
      if (patch.trustScore != null) next.posture = postureForScore(patch.trustScore);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ org, updateOrg, reloadOrg, loading }), [org, updateOrg, reloadOrg, loading]);
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
