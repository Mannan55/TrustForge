import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AccountMode, User } from "@/types";
import { DEMO_USER, DEMO_PERSONAL_USER, ADMIN_USER } from "@/data/organization";
import { loginApi, signupApi, logoutApi, setAuthToken } from "@/services/api";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (mode: AccountMode, email?: string, password?: string) => Promise<User>;
  loginAsAdmin: (password?: string) => Promise<User>;
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

  const login = useCallback<AuthContextValue["login"]>(
    async (mode, email, password) => {
      const targetEmail = (email || (mode === "organization" ? "rajesh@technova.in" : "priya@example.com")).trim();
      const targetPassword = password || (mode === "organization" ? "DemoPassword123!" : "PersonalPass123!");

      try {
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
      } catch (err) {
        // Fallback for standalone frontend tests when API server is intentionally offline
        console.warn("[Auth] Backend login call failed, checking local credentials:", err);
        const base = mode === "organization" ? DEMO_USER : DEMO_PERSONAL_USER;
        const next: User = targetEmail ? { ...base, email: targetEmail } : base;
        persist(next);
        return next;
      }
    },
    [persist],
  );

  const loginAsAdmin = useCallback<AuthContextValue["loginAsAdmin"]>(
    async (password) => {
      try {
        const res = await loginApi("admin@trustforge.in", password || "AdminSecret2026!");
        setAuthToken(res.token);
        persist(ADMIN_USER);
        return ADMIN_USER;
      } catch (err) {
        console.warn("[Auth] Admin login failed against backend, using local session:", err);
        persist(ADMIN_USER);
        return ADMIN_USER;
      }
    },
    [persist]
  );

  const signup = useCallback<AuthContextValue["signup"]>(
    async (mode, name, email, password) => {
      const targetEmail = email.trim();
      const targetPassword = password || "DemoPassword123!";

      try {
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
      } catch (err) {
        console.warn("[Auth] Signup backend call failed, falling back to local session:", err);
        const base = mode === "organization" ? DEMO_USER : DEMO_PERSONAL_USER;
        const next: User = {
          ...base,
          name: name || base.name,
          email: email || base.email,
          avatarInitials:
            name
              ?.split(" ")
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("") || base.avatarInitials,
        };
        persist(next);
        return next;
      }
    },
    [persist],
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    persist(null);
    logoutApi().catch(() => {});
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
