# TrustForge Brand Assets

Production-ready brand assets for the TrustForge frontend. Every file in this
package is derived directly from the finalized, approved logo — the mark was
traced from its exact approved pixels into true vector paths (via `potrace`),
never redrawn or reinterpreted. Geometry, proportions, and typography are
locked and identical across every format below.

**Locked palette:** Deep Emerald `#0F2E22` · Warm Beige `#E3CFAE` · Soft Bone `#F2EDE1`
**Typography:** General Sans (primary) · IBM Plex Sans (secondary)

Full specification, color values (HEX/RGB/CMYK), clear-space rules, and
correct/incorrect usage examples are documented in
`05-brand-guidelines/TrustForge-Brand-Guidelines.pdf`.

---

## Folder structure

```
TrustForge-Brand-Assets/
├── 01-logos/              Primary lockups, symbol, wordmark — SVG + PNG
├── 02-icons/               Favicon and app icon — SVG + PNG at required sizes
├── 03-social/               Pre-sized social profile images
├── 04-docs/                 Transparent logo for letterheads, certificates, reports
├── 05-brand-guidelines/      Full PDF brand guideline document
└── README.md                 This file
```

---

## Quick reference — which file do I use?

| Need | File |
|---|---|
| Logo on a **light / beige** background | `01-logos/trustforge-logo-dark.svg` |
| Logo on a **dark / emerald** background | `01-logos/trustforge-logo-light.svg` |
| Default logo import in the React app | `01-logos/trustforge-logo-primary.svg` (identical to `-dark`) |
| Just the symbol (no wordmark) | `01-logos/trustforge-symbol.svg` |
| Just the wordmark (no symbol) | `01-logos/trustforge-wordmark.svg` |
| Browser tab favicon | `02-icons/favicon.svg` (+ PNG fallbacks) |
| PWA / mobile app icon | `02-icons/app-icon.svg` (+ 192/512 PNG) |
| LinkedIn or social avatar | `03-social/trustforge-social-profile.png` or `trustforge-linkedin-logo.png` |
| Letterhead, certificate, or PDF report | `04-docs/` (transparent background, drop onto any light stock) |

---

## 01-logos/

| File | Description |
|---|---|
| `trustforge-logo-primary.svg` / `.png` | Symbol + wordmark, emerald. The canonical default — same artwork as `-dark`. |
| `trustforge-logo-dark.svg` / `.png` | Emerald mark, **for light backgrounds**. Transparent background. |
| `trustforge-logo-light.svg` / `.png` | Bone mark, **for dark/emerald backgrounds**. Transparent background. |
| `trustforge-wordmark.svg` | "TRUSTFORGE" text only, no symbol. Emerald, transparent background. |
| `trustforge-symbol.svg` / `.png` | Ribbon symbol only, no text. Emerald, transparent background. |

All PNGs are exported at high resolution (2400px wide for lockups, 1600px for
the symbol) directly from the SVG source, so raster and vector always match
exactly.

> **Naming note:** "dark" and "light" describe the *color of the logo itself*
> (a dark-emerald logo, or a light-bone logo) — not the background. A dark
> logo goes on a light background, and vice versa.

## 02-icons/

| File | Use |
|---|---|
| `favicon.svg` | Vector favicon, beige rounded tile + emerald symbol. Modern browsers use this directly. |
| `favicon-16.png` / `favicon-32.png` / `favicon-48.png` | Raster fallbacks for browsers/contexts that don't support SVG favicons. |
| `app-icon.svg` | Vector app icon, same tile treatment, exported at 512px viewBox for a crisp squircle. |
| `app-icon-192.png` / `app-icon-512.png` | Standard PWA manifest icon sizes. |

**index.html (Vite root):**
```html
<link rel="icon" type="image/svg+xml" href="/assets/brand/02-icons/favicon.svg" />
<link rel="alternate icon" href="/assets/brand/02-icons/favicon-32.png" />
<link rel="apple-touch-icon" href="/assets/brand/02-icons/app-icon-192.png" />
```

**public/manifest.json (PWA):**
```json
{
  "icons": [
    { "src": "/assets/brand/02-icons/app-icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/brand/02-icons/app-icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## 03-social/

| File | Size | Use |
|---|---|---|
| `trustforge-social-profile.png` | 1080×1080 | Twitter/X, Instagram, general profile photo |
| `trustforge-linkedin-logo.png` | 800×800 | LinkedIn company page logo |

Both are the symbol only (emerald on beige), centered with generous margin —
safe for the circular crop most platforms apply automatically.

## 04-docs/

`trustforge-letterhead-logo.svg`, `trustforge-certificate-logo.svg`, and
`trustforge-report-logo.svg` are all the same transparent, emerald primary
lockup — split into three filenames so each can be swapped independently
later (e.g. if a certificate-specific treatment is needed down the line)
without touching the others. Drop any of them onto letterhead, PDF reports,
or certificate templates with a light/beige base.

## 05-brand-guidelines/

`TrustForge-Brand-Guidelines.pdf` — 7 pages covering the primary logo and
variations, symbol/wordmark, clear space and minimum size, correct vs.
incorrect usage, full color palette (HEX/RGB/CMYK) with light/dark/print/
digital pairings, typography, and applied examples (website header, app icon,
certificate).

---

## Using these in the React/Vite frontend

Copy the whole folder into:
```
TrustForge/frontend/public/assets/brand/
```

Then reference assets by absolute path from `public/`:
```jsx
// Static <img>, background-agnostic default
<img src="/assets/brand/01-logos/trustforge-logo-primary.svg" alt="TrustForge" />

// Explicit light/dark switching
<img
  src={isDarkBackground
    ? "/assets/brand/01-logos/trustforge-logo-light.svg"
    : "/assets/brand/01-logos/trustforge-logo-dark.svg"}
  alt="TrustForge"
/>

// Symbol only, e.g. in a collapsed sidebar
<img src="/assets/brand/01-logos/trustforge-symbol.svg" alt="TrustForge" width={32} height={32} />
```

All SVGs are plain vector markup — a single `<svg>` root with one `<path>`
per asset (or a background shape + path for the icon tiles). No embedded
raster, no external font or image references, no HTML wrapper. They render
identically as an `<img src>`, a CSS `background-image`, or inlined/imported
directly as a component if your build pipeline supports SVG-as-component
(e.g. `vite-plugin-svgr`).

---

## Verification

Every SVG in this package was checked before delivery: confirmed well-formed,
confirmed it renders without error, and confirmed it contains no HTML
wrapper, no embedded raster images, and no external dependencies (the only
`http://` string present is the required `xmlns="http://www.w3.org/2000/svg"`
namespace declaration every SVG file must have — not a network dependency).
All PNGs were rendered directly from these same SVGs, so vector and raster
versions are pixel-consistent with each other.
