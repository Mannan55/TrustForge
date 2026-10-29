import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AccountMode, User } from "@/types";
import { DEMO_USER, DEMO_PERSONAL_USER } from "@/data/organization";
import { loginApi, signupApi, logoutApi, getMeApi, setAuthToken, getAuthToken } from "@/services/api";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (mode: AccountMode, email?: string, password?: string) => Promise<User>;
  loginAsAdmin: (password: string, email: string) => Promise<User>;
  signup: (mode: AccountMode, name: string, email: string, password?: string) => Promise<User>;
  logout: () => void;
}

const STORAGE_KEY = "trustforge.session";

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadSession);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  // P0-5 FIX: Validate stored session against backend on load; revoke on invalid/expired token
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      getMeApi()
        .then((res) => {
          if (!res?.user?.id) {
            setAuthToken(null);
            persist(null);
          } else {
            // Keep user session in sync with authentic server state
            setUser((prev) => {
              if (!prev) return null;
              if (prev.role === res.user.role && prev.id === res.user.id && prev.email === res.user.email) {
                return prev;
              }
              const updated: User = {
                ...prev,
                id: res.user.id,
                email: res.user.email,
                role: res.user.role as any,
              };
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        })
        .catch(() => {
          setAuthToken(null);
          persist(null);
        });
    } else {
      persist(null);
    }
  }, [persist]);

  const login = useCallback<AuthContextValue["login"]>(
    async (mode, email, password) => {
      const targetEmail = (email || (mode === "organization" ? "rajesh@technova.in" : "priya@example.com")).trim();
      const targetPassword = password || (mode === "organization" ? "DemoPassword123!" : "PersonalPass123!");

      // P0-5 FIX: Never catch and persist mock session on authentication failure.
      // Rejections must bubble up to UI so user remains unauthenticated.
      const res = await loginApi(targetEmail, targetPassword);
      setAuthToken(res.token);

      const base = mode === "organization" ? DEMO_USER : DEMO_PERSONAL_USER;
      const next: User = {
        ...base,
        id: res.user.id,
        name: res.user.name || base.name,
        email: res.user.email,
        role: res.user.role as any,
        avatarInitials:
          res.user.name
            ?.split(" ")
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("") || base.avatarInitials,
      };
      persist(next);
      return next;
    },
    [persist],
  );

  const loginAsAdmin = useCallback<AuthContextValue["loginAsAdmin"]>(
    async (password, email) => {
      const cleanEmail = email?.trim();
      const cleanPassword = password?.trim();

      if (!cleanEmail) {
        throw new Error("Administrator work email is required.");
      }
      if (!cleanPassword) {
        throw new Error("Administrator password is required.");
      }

      // 1. Authenticate against server
      const res = await loginApi(cleanEmail, cleanPassword);

      // 2. Verify the authenticated role from the backend before permitting admin session
      const serverRole = res.user?.role;
      const isPlatformAdmin = serverRole === "Super Admin" || serverRole === "Platform Admin";
      if (!isPlatformAdmin) {
        // Customer or unprivileged credentials submitted at /admin/login must be rejected
        setAuthToken(null);
        persist(null);
        throw new Error("Access denied: Account does not have platform administrator privileges.");
      }

      // 3. Set token only after role authorization succeeds
      setAuthToken(res.token);

      // 4. Build user profile from authentic server data
      const adminUserProfile: User = {
        id: res.user.id,
        name: res.user.name || "Platform Administrator",
        email: res.user.email,
        role: res.user.role as any,
        accountMode: "organization",
        avatarInitials:
          res.user.name
            ?.split(" ")
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("") || "TF",
      };
      persist(adminUserProfile);
      return adminUserProfile;
    },
    [persist]
  );

  const signup = useCallback<AuthContextValue["signup"]>(
    async (mode, name, email, password) => {
      const targetEmail = email.trim();
      const targetPassword = password || "DemoPassword123!";

      // P0-5 FIX: No mock user persistence on signup failure
      const res = await signupApi(targetEmail, targetPassword, name, `${name}'s Organization`);
      setAuthToken(res.token);

      const base = mode === "organization" ? DEMO_USER : DEMO_PERSONAL_USER;
      const next: User = {
        ...base,
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as any,
        avatarInitials:
          name
            ?.split(" ")
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("") || base.avatarInitials,
      };
      persist(next);
      return next;
    },
    [persist],
  );

  const logout = useCallback(() => {
    logoutApi().catch(() => {});
    setAuthToken(null);
    persist(null);
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, login, loginAsAdmin, signup, logout }),
    [user, login, loginAsAdmin, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
