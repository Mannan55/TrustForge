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

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (mode: AccountMode, email?: string) => User;
  loginAsAdmin: () => User;
  signup: (mode: AccountMode, name: string, email: string) => User;
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
    (mode, email) => {
      const base = mode === "organization" ? DEMO_USER : DEMO_PERSONAL_USER;
      const next: User = email ? { ...base, email } : base;
      persist(next);
      return next;
    },
    [persist],
  );

  const loginAsAdmin = useCallback(() => {
    persist(ADMIN_USER);
    return ADMIN_USER;
  }, [persist]);

  const signup = useCallback<AuthContextValue["signup"]>(
    (mode, name, email) => {
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
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

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
