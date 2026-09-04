import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LineChart,
  Building2,
  Users,
  ClipboardList,
  ScanLine,
  ListChecks,
  FolderCheck,
  FileSearch,
  ScrollText,
  FileText,
  Activity,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/common/BrandLogo";

interface NavEntry {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}
const SECTIONS: { heading: string; items: NavEntry[] }[] = [
  {
    heading: "Overview",
    items: [
      { to: "/admin", label: "Command Center", icon: LayoutDashboard, end: true },
      { to: "/admin/analytics", label: "Analytics", icon: LineChart },
    ],
  },
  {
    heading: "Tenants",
    items: [
      { to: "/admin/organizations", label: "Organizations", icon: Building2 },
      { to: "/admin/users", label: "Users", icon: Users },
    ],
  },
  {
    heading: "Assessment Ops",
    items: [
      { to: "/admin/assessments", label: "Assessments", icon: ClipboardList },
      { to: "/admin/scans", label: "Website Scans", icon: ScanLine },
      { to: "/admin/findings", label: "Findings", icon: ListChecks },
      { to: "/admin/evidence", label: "Evidence", icon: FolderCheck },
    ],
  },
  {
    heading: "Review & Rules",
    items: [
      { to: "/admin/review", label: "Analysis Review", icon: FileSearch },
      { to: "/admin/rules", label: "Compliance Rules", icon: ScrollText },
      { to: "/admin/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    heading: "Platform",
    items: [
      { to: "/admin/system", label: "System Health", icon: Activity },
      { to: "/admin/audit", label: "Audit Logs", icon: History },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col bg-emerald-dark text-bone">
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-emerald-mid/60">
        <Link to="/admin" onClick={onNavigate} aria-label="TrustForge admin" className="flex items-center gap-2.5">
          <BrandLogo variant="symbol" height={26} />
          <span className="text-sm font-semibold text-bone font-display">
            Trust<span className="text-beige">Forge</span>
            <span className="ml-1.5 rounded bg-emerald-mid px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-bone/70">
              Admin
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-slim px-3 py-4 space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.heading}>
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-bone/40">
              {section.heading}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
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

      <div className="border-t border-emerald-mid/60 p-3">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-bone/60 hover:bg-emerald-mid/60 hover:text-bone"
        >
          <ArrowUpRight className="h-4 w-4" /> Exit to workspace
        </Link>
        <div className="mt-1 flex items-center gap-2.5 px-2.5 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-beige text-xs font-semibold text-emerald-deep font-display">
            {user?.avatarInitials ?? "TF"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-bone">{user?.name ?? "Platform Operations"}</p>
            <p className="truncate text-xs text-bone/55">{user?.role ?? "Super Admin"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-ink-soft hover:bg-beige-light lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Activity className="h-4 w-4 text-emerald-light" />
            Platform administration
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="ml-auto flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ink-soft hover:bg-beige-light"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 animate-fade-in">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
