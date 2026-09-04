import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  Gauge,
  ListChecks,
  FolderCheck,
  ListTodo,
  ScanLine,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ScorePill } from "@/components/common/ScoreRing";
import { Badge } from "@/components/common/Badge";

interface NavEntry {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}
interface NavSection {
  heading: string;
  items: NavEntry[];
  modes: ("organization" | "personal")[];
}

const SECTIONS: NavSection[] = [
  {
    heading: "Overview",
    modes: ["organization", "personal"],
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Assessment",
    modes: ["organization"],
    items: [
      { to: "/assessment", label: "Assessment", icon: ClipboardCheck },
      { to: "/trust-score", label: "Trust Score", icon: Gauge },
      { to: "/website-scan", label: "Website Scan", icon: ScanLine },
    ],
  },
  {
    heading: "Compliance",
    modes: ["organization"],
    items: [
      { to: "/findings", label: "Findings", icon: ListChecks },
      { to: "/evidence", label: "Evidence", icon: FolderCheck },
      { to: "/remediation", label: "Remediation", icon: ListTodo },
      { to: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    heading: "Personal",
    modes: ["personal"],
    items: [
      { to: "/website-scan", label: "Website Scan", icon: ScanLine },
      { to: "/rights", label: "Your Rights", icon: BookOpen },
    ],
  },
  {
    heading: "Account",
    modes: ["organization", "personal"],
    items: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const { org } = useOrg();
  const mode = user?.accountMode ?? "organization";
  const sections = SECTIONS.filter((s) => s.modes.includes(mode));

  return (
    <div className="flex h-full flex-col bg-emerald-deep text-bone">
      <div className="flex h-16 items-center px-5 border-b border-emerald-mid/60">
        <Link to="/dashboard" onClick={onNavigate} aria-label="TrustForge home">
          <BrandLogo variant="light" height={26} />
        </Link>
      </div>

      {mode === "organization" && (
        <div className="mx-3 mt-4 rounded-xl border border-emerald-mid bg-emerald-dark/50 p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-beige text-emerald-deep">
              <Building2 className="h-4.5 w-4.5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-bone font-display">{org.displayName}</p>
              <p className="truncate text-xs text-bone/55">{org.primaryDomain}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-bone/55">Trust Score</span>
            <ScorePill score={org.trustScore} size="sm" />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto scroll-slim px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.heading}>
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-bone/40">
              {section.heading}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-beige text-emerald-deep"
                        : "text-bone/75 hover:bg-emerald-mid/60 hover:text-bone",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-emerald-deep" : "text-bone/60")}
                        strokeWidth={2}
                      />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {mode === "personal" && (
        <div className="mx-3 mb-3 rounded-xl border border-emerald-mid bg-emerald-dark/50 p-3.5">
          <p className="text-sm font-medium text-bone font-display">Run a business workspace?</p>
          <p className="mt-1 text-xs text-bone/60">
            Set up an organization to assess DPDP posture with evidence and scanning.
          </p>
          <Link
            to="/onboarding"
            onClick={onNavigate}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-beige hover:underline"
          >
            Create organization
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const crumb = location.pathname.split("/").filter(Boolean)[0] ?? "dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-ink-soft hover:bg-beige-light lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <ShieldCheck className="h-4 w-4 text-emerald-light" />
        <span className="capitalize text-ink-soft">{crumb.replace("-", " ")}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {user?.role === "Super Admin" && (
          <Link to="/admin">
            <Badge tone="brand">Admin console</Badge>
          </Link>
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-beige-light"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-deep text-xs font-semibold text-bone font-display">
              {user?.avatarInitials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-ink">{user?.name}</span>
              <span className="block text-xs leading-tight text-ink-muted">{user?.title ?? user?.role}</span>
            </span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
              <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-line bg-white p-1.5 shadow-lg animate-fade-in">
                <div className="px-2.5 py-2">
                  <p className="text-sm font-medium text-ink">{user?.name}</p>
                  <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                </div>
                <div className="my-1 h-px bg-line" />
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:bg-beige-light"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:bg-beige-light"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-emerald-dark/50 animate-fade" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 animate-drawer-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute -right-11 top-3 rounded-lg bg-white/10 p-2 text-bone"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 animate-fade-in">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
