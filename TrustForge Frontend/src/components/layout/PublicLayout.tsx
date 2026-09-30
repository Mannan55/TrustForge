import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Home", hash: null, end: true },
  { to: "/scan", label: "Website Scan", hash: null },
  { to: null, label: "How it works", hash: "how-it-works" },
  { to: null, label: "Framework", hash: "framework" },
];

function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="TrustForge home" className="flex items-center">
          <BrandLogo variant="primary" height={28} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            if (item.hash) {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    const el = document.getElementById(item.hash!);
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-emerald-deep"
                >
                  {item.label}
                </button>
              );
            }
            return (
              <NavLink
                key={item.to!}
                to={item.to!}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive && item.to === pathname
                      ? "text-emerald-deep"
                      : "text-ink-soft hover:text-emerald-deep",
                  )
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="sm">Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-ink-soft hover:bg-beige-light md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-canvas px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-beige-light"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="flex-1">
                <Button size="sm" className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-line bg-emerald-deep text-bone">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <BrandLogo variant="light" height={26} />
            <p className="mt-4 max-w-xs text-sm text-bone/60">
              Digital trust and DPDP posture for Indian startups and SMEs. Evidence-backed, not
              checkbox theatre.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { label: "Website Scan", to: "/scan" },
              { label: "Assessment", to: "/signup" },
              { label: "Trust Score", to: "/signup" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "How it works", to: "/#how" },
              { label: "Framework", to: "/#framework" },
              { label: "Sign in", to: "/login" },
            ]}
          />
          <div>
            <p className="mb-3 text-sm font-semibold text-bone font-display">Scope</p>
            <p className="text-sm text-bone/60">
              Aligned to India's Digital Personal Data Protection Act, 2023. TrustForge provides
              posture guidance, not legal advice.
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-emerald-mid/60 pt-6 text-xs text-bone/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TrustForge. Built for the Indian data protection landscape (DPDP Act 2023).</p>
          <p>Assessment results are preliminary and self-reported unless verified with evidence.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-bone font-display">{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-bone/60 transition-colors hover:text-beige">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PublicHeader />
      <div className="flex-1">{children ?? <Outlet />}</div>
      <PublicFooter />
    </div>
  );
}
