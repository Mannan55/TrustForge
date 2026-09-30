import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

/**
 * Split-screen shell for authentication and onboarding flows.
 * Left: a calm emerald brand panel with reassurance points.
 * Right: the form content. On small screens the panel collapses to a header.
 */
export function AuthShell({
  children,
  heading = "Digital trust, built on evidence",
  points = [
    "Assess your DPDP posture across six trust pillars",
    "Back every finding with a scan or a document, not a guess",
    "Scoped to India's DPDP Act 2023, nothing you do not need",
  ],
  footnote,
}: {
  children: ReactNode;
  heading?: string;
  points?: string[];
  footnote?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-emerald-deep p-10 text-bone lg:flex xl:p-14">
        <Link to="/" aria-label="TrustForge home">
          <BrandLogo variant="light" height={30} />
        </Link>

        <div className="max-w-md">
          <h1 className="font-display text-3xl font-semibold leading-tight text-bone">{heading}</h1>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-beige text-emerald-deep">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-sm text-bone/80">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="max-w-md text-xs text-bone/45">
          {footnote ??
            "TrustForge provides posture guidance aligned to the DPDP Act 2023. It is not a substitute for legal advice."}
        </p>

        {/* Quiet decorative grid, no glow, no sparkle */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-beige) 1px, transparent 1px), linear-gradient(90deg, var(--color-beige) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden
        />
      </div>

      {/* Form panel */}
      <div className="flex flex-col bg-canvas">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link to="/" aria-label="TrustForge home">
            <BrandLogo variant="primary" height={26} />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md animate-fade-in">{children}</div>
        </div>
      </div>
    </div>
  );
}
