import { cn } from "@/lib/cn";

type Variant = "primary" | "dark" | "light" | "symbol" | "symbol-beige" | "wordmark";

const src: Record<Variant, string> = {
  primary: "/assets/brand/01-logos/trustforge-logo-primary.svg",
  dark: "/assets/brand/01-logos/trustforge-logo-dark.svg",
  light: "/assets/brand/01-logos/trustforge-logo-light.svg",
  symbol: "/assets/brand/01-logos/trustforge-symbol.svg",
  "symbol-beige": "/assets/brand/01-logos/trustforge-symbol-beige.svg",
  wordmark: "/assets/brand/01-logos/trustforge-wordmark.svg",
};

/**
 * The approved TrustForge mark. Never redrawn.
 * Use `light` on emerald/dark surfaces and `dark`/`primary` on light surfaces.
 */
export function BrandLogo({
  variant = "primary",
  height = 28,
  className,
}: {
  variant?: Variant;
  height?: number;
  className?: string;
}) {
  return (
    <img
      src={src[variant]}
      alt="TrustForge"
      height={height}
      style={{ height }}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}
