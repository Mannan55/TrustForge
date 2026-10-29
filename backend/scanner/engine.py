"""
TrustForge Website Scanner Engine.

Performs non-intrusive HTTP/HTML analysis of a publicly reachable URL.
Produces:
  - ScanCheck list  (for the UI scan results screen)
  - EvidenceItem list  (normalised evidence for the compliance engine)

IMPORTANT: Scanner output is OBSERVATION, not legal conclusion.
  BAD: "No HSTS header = DPDP violation"
  GOOD: "HSTS header not observed" → compliance engine interprets relevance.
"""
from __future__ import annotations

import asyncio
import logging
import re
import ssl
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from uuid import uuid4

import httpx
from bs4 import BeautifulSoup

from config import settings
from core.models import (
    EvidenceConfidence,
    EvidenceItem,
    EvidenceSourceType,
    EvidenceStatus,
)
from scanner.ssrf import validate_target_url

logger = logging.getLogger(__name__)


# ─── Response model (mirrors api/routes/scans.py ScanCheck) ───────────────

class ScanCheck:
    def __init__(
        self,
        id: str,
        label: str,
        kind: str,
        state: str,
        detail: str,
        recommendation: Optional[str] = None,
        evidence: Optional[str] = None,
    ):
        self.id = id
        self.label = label
        self.kind = kind          # "technical" | "privacy" | "assessment"
        self.state = state        # "pass" | "attention" | "gap"
        self.detail = detail
        self.recommendation = recommendation
        self.evidence = evidence

    def dict(self):
        return {
            "id": self.id,
            "label": self.label,
            "kind": self.kind,
            "state": self.state,
            "detail": self.detail,
            "recommendation": self.recommendation,
            "evidence": self.evidence,
        }


class ScanResponse:
    def __init__(
        self,
        scan_id: str,
        url: str,
        checks: List[ScanCheck],
        evidence: List[EvidenceItem],
        score: int,
        posture: str,
        scanned_at: str,
        duration_ms: int = 0,
        error: Optional[str] = None,
    ):
        self.scan_id = scan_id
        self.url = url
        self.checks = checks
        self.evidence = evidence
        self.score = score
        self.posture = posture
        self.scanned_at = scanned_at
        self.duration_ms = duration_ms
        self.error = error

    def dict(self):
        return {
            "scan_id": self.scan_id,
            "url": self.url,
            "checks": [c.dict() for c in self.checks],
            "evidence": [e.model_dump() for e in self.evidence],
            "score": self.score,
            "posture": self.posture,
            "scanned_at": self.scanned_at,
            "duration_ms": self.duration_ms,
            "error": self.error,
        }


# ─── DPDP-relevant security headers ──────────────────────────────────────────

SECURITY_HEADERS: Dict[str, Dict] = {
    "strict-transport-security": {
        "label": "HSTS (HTTP Strict Transport Security)",
        "evidence_key": "hsts_header",
        "dpdp_relevance": "Section 8(5) — reasonable security safeguards",
    },
    "x-content-type-options": {
        "label": "X-Content-Type-Options",
        "evidence_key": "xcto_header",
        "dpdp_relevance": "Section 8(5) — reasonable security safeguards",
    },
    "content-security-policy": {
        "label": "Content-Security-Policy",
        "evidence_key": "csp_header",
        "dpdp_relevance": "Section 8(5) — reasonable security safeguards",
    },
    "x-frame-options": {
        "label": "X-Frame-Options",
        "evidence_key": "xfo_header",
        "dpdp_relevance": "Section 8(5) — reasonable security safeguards",
    },
    "referrer-policy": {
        "label": "Referrer-Policy",
        "evidence_key": "referrer_policy_header",
        "dpdp_relevance": "Section 8(5) — data minimisation in transit",
    },
    "permissions-policy": {
        "label": "Permissions-Policy",
        "evidence_key": "permissions_policy_header",
        "dpdp_relevance": "Section 8(5) — browser API access control",
    },
}

# Known tracker/analytics domains (partial list for signal detection)
KNOWN_TRACKER_PATTERNS = [
    r"google-analytics\.com",
    r"googletagmanager\.com",
    r"gtag",
    r"facebook\.net",
    r"fb\.com",
    r"hotjar\.com",
    r"mixpanel\.com",
    r"segment\.com",
    r"amplitude\.com",
    r"clarity\.ms",
    r"doubleclick\.net",
    r"googlesyndication\.com",
]

# Known consent management platform signals
CONSENT_CMP_PATTERNS = [
    r"cookiebot",
    r"onetrust",
    r"cookielaw",
    r"iubenda",
    r"quantcast",
    r"trustarc",
    r"usercentrics",
    r"consentmanager",
    r"cookie-consent",
    r"gdpr-consent",
    r"cookie-banner",
    r"consent-banner",
    r"consent-manager",
]

# Privacy-related URL patterns
PRIVACY_URL_PATTERNS = [
    r"/privacy",
    r"/privacy-policy",
    r"/privacypolicy",
    r"/legal/privacy",
    r"/data-policy",
    r"/gdpr",
    r"/dpdp",
]

GRIEVANCE_URL_PATTERNS = [
    r"/grievance",
    r"/contact",
    r"/support",
    r"/help",
    r"/redressal",
    r"/complaints",
]

TERMS_URL_PATTERNS = [
    r"/terms",
    r"/tos",
    r"/terms-of-service",
    r"/legal",
    r"/conditions",
]


# ─── Core scan implementation ─────────────────────────────────────────────────

async def run_scan(raw_url: str) -> ScanResponse:
    """
    Execute a non-intrusive scan of the target URL.

    Returns a ScanResponse with structured checks and evidence items.
    """
    scan_id = str(uuid4())
    scanned_at = datetime.now(timezone.utc).isoformat()

    # 1. Validate URL (SSRF protection)
    try:
        url = validate_target_url(raw_url)
    except ValueError as exc:
        return ScanResponse(
            scan_id=scan_id, url=raw_url, checks=[], evidence=[],
            score=0, posture="Critical", scanned_at=scanned_at, error=str(exc),
        )

    checks: List[ScanCheck] = []
    evidence: List[EvidenceItem] = []

    # 2. Fetch the page
    headers_observed: Dict[str, str] = {}
    html_content: str = ""
    final_url: str = url
    status_code: int = 0
    tls_info: Optional[Dict] = None
    fetch_error: Optional[str] = None

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            max_redirects=settings.scanner_max_redirects,
            timeout=settings.scanner_timeout,
            verify=True,   # enforce TLS verification
        ) as client:
            response = await client.get(url, headers={"User-Agent": "TrustForge/1.0 Compliance Scanner"})
            status_code = response.status_code
            headers_observed = dict(response.headers)
            final_url = str(response.url)
            # Cap response size to prevent memory issues with large pages
            html_content = response.text[:settings.scanner_max_response_bytes]
    except httpx.ConnectError as exc:
        fetch_error = f"TLS/connection error: {exc}"
    except httpx.TimeoutException:
        fetch_error = f"Request timed out after {settings.scanner_timeout}s"
    except httpx.TooManyRedirects:
        fetch_error = f"Too many redirects (limit: {settings.scanner_max_redirects})"
    except Exception as exc:
        fetch_error = f"Fetch error: {exc}"

    if fetch_error:
        checks.append(ScanCheck(
            id="fetch_error", label="Page reachability", kind="technical",
            state="gap", detail=f"Could not fetch the URL. {fetch_error}",
        ))
        return ScanResponse(
            scan_id=scan_id, url=url, checks=checks, evidence=evidence,
            score=0, posture="Critical", scanned_at=scanned_at, error=fetch_error,
        )

    # 3. Parse HTML
    soup: Optional[BeautifulSoup] = None
    try:
        soup = BeautifulSoup(html_content, "html.parser")
    except Exception:
        pass

    # 4. Run individual checks
    _check_https(url, final_url, checks, evidence)
    _check_security_headers(headers_observed, checks, evidence)
    _check_privacy_policy(url, html_content, soup, checks, evidence)
    _check_consent_banner(html_content, checks, evidence)
    _check_terms(html_content, soup, checks, evidence)
    _check_grievance_contact(url, html_content, soup, checks, evidence)
    _check_trackers(html_content, checks, evidence)
    _check_robots_txt(url, checks, evidence)
    _check_sitemap(url, checks, evidence)
    _check_recaptcha(html_content, checks, evidence)

    # 5. Compute preliminary score
    score, posture = _compute_score(checks)

    logger.info(
        f"Scan complete: {url} | checks={len(checks)} | "
        f"evidence={len(evidence)} | score={score} | posture={posture}"
    )

    return ScanResponse(
        scan_id=scan_id,
        url=url,
        checks=checks,
        evidence=evidence,
        score=score,
        posture=posture,
        scanned_at=scanned_at,
    )


# ─── Individual check functions ───────────────────────────────────────────────

def _ev(
    key: str,
    title: str,
    observed: bool,
    status: EvidenceStatus,
    value=None,
    url: Optional[str] = None,
    notes: str = "",
    method: str = "",
    confidence: EvidenceConfidence = EvidenceConfidence.HIGH,
) -> EvidenceItem:
    return EvidenceItem(
        source=EvidenceSourceType.WEBSITE_SCANNER,
        key=key,
        title=title,
        status=status,
        observed=observed,
        value=value,
        url=url,
        notes=notes,
        method=method,
        confidence=confidence,
    )


def _check_https(url: str, final_url: str, checks: List, evidence: List) -> None:
    uses_https = final_url.startswith("https://")
    original_http = url.lower().startswith("http://")
    redirected_to_https = original_http and uses_https

    if uses_https:
        detail = "All traffic served over HTTPS."
        if redirected_to_https:
            detail = "HTTP redirects to HTTPS — transport is encrypted."
        checks.append(ScanCheck("https", "HTTPS enforcement", "technical", "pass", detail))
        evidence.append(_ev(
            "https_enforced", "HTTPS enforcement", True, EvidenceStatus.VERIFIED,
            value=final_url, url=url,
            method="Scanner verified HTTPS scheme on final URL after redirect resolution.",
        ))
    else:
        checks.append(ScanCheck(
            "https", "HTTPS enforcement", "technical", "gap",
            "Site not served over HTTPS. Personal data in transit is not encrypted.",
            recommendation="Enable HTTPS and redirect all HTTP traffic to HTTPS.",
            evidence=f"Final URL: {final_url}",
        ))
        evidence.append(_ev(
            "https_enforced", "HTTPS enforcement", False, EvidenceStatus.NOT_FOUND,
            value=final_url, url=url,
            method="Scanner observed non-HTTPS scheme on final URL.",
        ))


def _check_security_headers(headers: Dict, checks: List, evidence: List) -> None:
    lower_headers = {k.lower(): v for k, v in headers.items()}

    # HSTS (most privacy-relevant security header)
    hsts = lower_headers.get("strict-transport-security")
    if hsts:
        max_age_match = re.search(r"max-age=(\d+)", hsts)
        max_age = int(max_age_match.group(1)) if max_age_match else 0
        if max_age >= 31536000:  # >= 1 year
            checks.append(ScanCheck("hsts", "HSTS header", "technical", "pass",
                f"Strict-Transport-Security present (max-age={max_age})."))
        else:
            checks.append(ScanCheck("hsts", "HSTS header", "technical", "attention",
                f"HSTS present but max-age={max_age} is short (recommended: ≥31536000).",
                recommendation="Increase HSTS max-age to at least 31536000 (1 year)."))
        evidence.append(_ev("hsts_header", "HSTS header", True, EvidenceStatus.VERIFIED,
            value=hsts, method="HTTP response header observed by scanner."))
    else:
        checks.append(ScanCheck("hsts", "HSTS header", "technical", "attention",
            "Strict-Transport-Security header not observed.",
            recommendation="Add HSTS header to enforce HTTPS. Recommended: max-age=31536000; includeSubDomains",
            evidence="Header absent in HTTP response."))
        evidence.append(_ev("hsts_header", "HSTS header", False, EvidenceStatus.NOT_FOUND,
            method="Scanner checked HTTP response headers; HSTS absent."))

    # CSP
    csp = lower_headers.get("content-security-policy")
    if csp:
        checks.append(ScanCheck("csp", "Content-Security-Policy", "technical", "pass",
            "Content-Security-Policy header present."))
        evidence.append(_ev("csp_header", "Content-Security-Policy", True, EvidenceStatus.VERIFIED,
            value=csp[:200] + ("..." if len(csp) > 200 else ""),
            method="HTTP response header observed by scanner."))
    else:
        checks.append(ScanCheck("csp", "Content-Security-Policy", "technical", "attention",
            "Content-Security-Policy header not observed.",
            recommendation="Implement a CSP header to restrict third-party resource loading."))
        evidence.append(_ev("csp_header", "Content-Security-Policy", False, EvidenceStatus.NOT_FOUND,
            method="Scanner checked HTTP response headers; CSP absent."))

    # X-Content-Type-Options
    xcto = lower_headers.get("x-content-type-options")
    if xcto and "nosniff" in xcto.lower():
        checks.append(ScanCheck("xcto", "X-Content-Type-Options", "technical", "pass",
            "X-Content-Type-Options: nosniff is set."))
        evidence.append(_ev("xcto_header", "X-Content-Type-Options", True, EvidenceStatus.VERIFIED,
            value=xcto, method="HTTP response header observed by scanner."))
    else:
        checks.append(ScanCheck("xcto", "X-Content-Type-Options", "technical", "attention",
            "X-Content-Type-Options: nosniff not observed.",
            recommendation="Add X-Content-Type-Options: nosniff to prevent MIME-type sniffing."))
        evidence.append(_ev("xcto_header", "X-Content-Type-Options", False, EvidenceStatus.NOT_FOUND,
            method="Scanner checked HTTP response headers; X-Content-Type-Options absent or not nosniff."))

    # Referrer-Policy
    rp = lower_headers.get("referrer-policy")
    if rp:
        checks.append(ScanCheck("referrer_policy", "Referrer-Policy", "technical", "pass",
            f"Referrer-Policy header present: {rp}"))
        evidence.append(_ev("referrer_policy_header", "Referrer-Policy", True, EvidenceStatus.VERIFIED,
            value=rp, method="HTTP response header observed by scanner."))
    else:
        checks.append(ScanCheck("referrer_policy", "Referrer-Policy", "technical", "attention",
            "Referrer-Policy header not observed.",
            recommendation="Set Referrer-Policy to limit referrer leakage (e.g., strict-origin-when-cross-origin)."))
        evidence.append(_ev("referrer_policy_header", "Referrer-Policy", False, EvidenceStatus.NOT_FOUND,
            method="Scanner checked HTTP response headers; Referrer-Policy absent."))

    # X-Frame-Options
    xfo = lower_headers.get("x-frame-options")
    if xfo:
        checks.append(ScanCheck("xfo", "X-Frame-Options", "technical", "pass",
            f"X-Frame-Options header present: {xfo}"))
        evidence.append(_ev("xfo_header", "X-Frame-Options", True, EvidenceStatus.VERIFIED,
            value=xfo, method="HTTP response header observed by scanner."))
    else:
        checks.append(ScanCheck("xfo", "X-Frame-Options", "technical", "attention",
            "X-Frame-Options header not observed.",
            recommendation="Set X-Frame-Options to DENY or SAMEORIGIN to prevent clickjacking."))
        evidence.append(_ev("xfo_header", "X-Frame-Options", False, EvidenceStatus.NOT_FOUND,
            method="Scanner checked HTTP response headers; X-Frame-Options absent."))


def _check_privacy_policy(url: str, html: str, soup, checks: List, evidence: List) -> None:
    html_lower = html.lower()
    # Check for links matching privacy policy patterns
    privacy_link_found = False
    privacy_url_found = None

    if soup:
        for a in soup.find_all("a", href=True):
            href = a.get("href", "").lower()
            text = a.get_text(strip=True).lower()
            if any(re.search(pat, href) or re.search(pat, text) for pat in [
                r"privacy", r"data policy", r"personal data", r"dpdp"
            ]):
                privacy_link_found = True
                privacy_url_found = a.get("href")
                break

    if not privacy_link_found:
        # Fall back to text search
        privacy_link_found = bool(re.search(r"privacy.policy|privacy notice|personal data", html_lower))

    if privacy_link_found:
        checks.append(ScanCheck("privacy_policy", "Privacy policy link", "privacy", "pass",
            "A privacy policy link was detected on the page."))
        evidence.append(_ev(
            "privacy_policy_link", "Privacy policy link detected", True, EvidenceStatus.DETECTED,
            value=privacy_url_found, url=url,
            notes="A hyperlink matching privacy policy patterns was found.",
            method="Scanner searched page links and text for privacy policy references.",
            confidence=EvidenceConfidence.MEDIUM,
        ))
    else:
        checks.append(ScanCheck("privacy_policy", "Privacy policy link", "privacy", "gap",
            "No privacy policy link detected on the homepage.",
            recommendation="Publish a privacy notice and link it from the homepage and footer.",
            evidence="No link matching privacy policy patterns found in page source."))
        evidence.append(_ev(
            "privacy_policy_link", "Privacy policy link", False, EvidenceStatus.NOT_FOUND,
            url=url,
            notes="No hyperlink matching privacy policy patterns found.",
            method="Scanner searched all anchor tags and page text for privacy policy references.",
        ))


def _check_consent_banner(html: str, checks: List, evidence: List) -> None:
    html_lower = html.lower()
    consent_found = any(
        re.search(pat, html_lower) for pat in CONSENT_CMP_PATTERNS
    )
    # Also check for generic cookie consent text
    generic_consent = bool(re.search(r"accept.{0,20}cookie|cookie.{0,20}consent|we use cookies", html_lower))
    found = consent_found or generic_consent

    if found:
        cmp_detected = next((
            p.split(r"")[0] for p in CONSENT_CMP_PATTERNS
            if re.search(p, html_lower)
        ), "generic consent text")
        checks.append(ScanCheck("consent_banner", "Cookie/consent banner", "privacy", "pass",
            f"A consent mechanism was detected ({cmp_detected})."))
        evidence.append(_ev(
            "consent_banner", "Consent/cookie banner", True, EvidenceStatus.DETECTED,
            value=cmp_detected,
            notes="A consent management signal was found in page source.",
            method="Scanner searched for known CMP patterns and generic consent text.",
            confidence=EvidenceConfidence.MEDIUM,
        ))
    else:
        checks.append(ScanCheck("consent_banner", "Cookie/consent banner", "privacy", "gap",
            "No cookie consent banner or CMP detected.",
            recommendation="Implement a consent mechanism if the site uses cookies or tracking.",
            evidence="No known CMP scripts or consent banner text found in page source."))
        evidence.append(_ev(
            "consent_banner", "Consent/cookie banner", False, EvidenceStatus.NOT_FOUND,
            notes="No consent management signals found.",
            method="Scanner searched for CMP libraries and generic consent banner text.",
        ))


def _check_terms(html: str, soup, checks: List, evidence: List) -> None:
    html_lower = html.lower()
    found = False
    if soup:
        for a in soup.find_all("a", href=True):
            href = a.get("href", "").lower()
            text = a.get_text(strip=True).lower()
            if any(re.search(pat, href) or re.search(pat, text) for pat in [
                r"terms", r"conditions", r"tos", r"legal"
            ]):
                found = True
                break
    if not found:
        found = bool(re.search(r"terms of (use|service)|terms and conditions", html_lower))

    if found:
        checks.append(ScanCheck("terms", "Terms & conditions", "privacy", "pass",
            "Terms of service or conditions link detected."))
    else:
        checks.append(ScanCheck("terms", "Terms & conditions", "privacy", "attention",
            "No terms of service link detected on the homepage.",
            recommendation="Publish and link your terms of service from the homepage."))


def _check_grievance_contact(url: str, html: str, soup, checks: List, evidence: List) -> None:
    html_lower = html.lower()
    found = False
    if soup:
        for a in soup.find_all("a", href=True):
            href = a.get("href", "").lower()
            text = a.get_text(strip=True).lower()
            if any(re.search(pat, href) or re.search(pat, text) for pat in [
                r"grievance", r"contact", r"support", r"help", r"redressal"
            ]):
                found = True
                break
    if not found:
        found = bool(re.search(r"grievance.officer|grievance.contact|data.protection.officer|contact.us", html_lower))

    if found:
        checks.append(ScanCheck("grievance", "Grievance / contact page", "privacy", "pass",
            "A grievance or contact link was detected."))
        evidence.append(_ev(
            "grievance_contact_published", "Grievance contact information", True,
            EvidenceStatus.DETECTED, url=url,
            notes="A link matching grievance/contact patterns was found.",
            method="Scanner searched for grievance officer or contact page links.",
            confidence=EvidenceConfidence.MEDIUM,
        ))
    else:
        checks.append(ScanCheck("grievance", "Grievance / contact page", "privacy", "attention",
            "No grievance officer or contact page link detected.",
            recommendation="Publish grievance officer contact details as required by DPDP Act Section 8(9)."))
        evidence.append(_ev(
            "grievance_contact_published", "Grievance contact information", False,
            EvidenceStatus.NOT_FOUND, url=url,
            notes="No grievance or contact link found.",
            method="Scanner searched all links and text for grievance/contact references.",
        ))


def _check_trackers(html: str, checks: List, evidence: List) -> None:
    trackers_found = []
    for pat in KNOWN_TRACKER_PATTERNS:
        if re.search(pat, html, re.IGNORECASE):
            # Derive a human-readable name from the pattern
            name = re.sub(r"[\\^$.*+?()[\]{}|]", "", pat).strip(".")
            trackers_found.append(name)

    if trackers_found:
        tracker_list = ", ".join(trackers_found[:5])
        checks.append(ScanCheck(
            "trackers", "Third-party tracker signals", "privacy", "attention",
            f"Third-party tracker script patterns detected: {tracker_list}.",
            recommendation=(
                "Verify that these trackers are gated behind consent. "
                "If analytics scripts load before consent is given, they lack lawful basis (DPDP Section 4)."
            ),
            evidence=f"Patterns matched in page source: {tracker_list}",
        ))
        evidence.append(_ev(
            "third_party_trackers", "Third-party tracker presence", True,
            EvidenceStatus.DETECTED,
            value=trackers_found,
            notes=f"Tracker script patterns detected: {tracker_list}.",
            method="Scanner searched page source for known tracker/analytics domain patterns.",
            confidence=EvidenceConfidence.MEDIUM,
        ))
    else:
        checks.append(ScanCheck("trackers", "Third-party tracker signals", "privacy", "pass",
            "No known third-party tracker patterns detected in page source."))
        evidence.append(_ev(
            "third_party_trackers", "Third-party tracker presence", False,
            EvidenceStatus.NOT_FOUND,
            notes="No known tracker patterns found in page source.",
            method="Scanner searched for known analytics/tracker domain patterns.",
            confidence=EvidenceConfidence.MEDIUM,
        ))


async def _fetch_url_exists(base_url: str, path: str) -> bool:
    """Check if a URL path returns a non-error response."""
    from urllib.parse import urlparse, urljoin
    parsed = urlparse(base_url)
    target = f"{parsed.scheme}://{parsed.netloc}{path}"
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=settings.scanner_timeout,
            verify=True,
        ) as client:
            r = await client.head(target, headers={"User-Agent": "TrustForge/1.0 Compliance Scanner"})
            return r.status_code < 400
    except Exception:
        return False


def _check_robots_txt(url: str, checks: List, evidence: List) -> None:
    """Check for robots.txt — runs synchronously (called from executor)."""
    import httpx as _httpx
    from urllib.parse import urlparse
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    try:
        r = _httpx.get(robots_url, timeout=5, follow_redirects=True,
                       headers={"User-Agent": "TrustForge/1.0 Compliance Scanner"})
        if r.status_code == 200 and "user-agent" in r.text.lower():
            checks.append(ScanCheck("robots_txt", "robots.txt", "technical", "pass",
                "robots.txt is present and well-formed."))
            return
    except Exception:
        pass
    checks.append(ScanCheck("robots_txt", "robots.txt", "technical", "attention",
        "robots.txt not found or not well-formed.",
        recommendation="Publish a robots.txt file."))


def _check_sitemap(url: str, checks: List, evidence: List) -> None:
    """Check for sitemap.xml — runs synchronously (called from executor)."""
    from urllib.parse import urlparse
    import httpx as _httpx
    parsed = urlparse(url)
    sitemap_url = f"{parsed.scheme}://{parsed.netloc}/sitemap.xml"
    try:
        r = _httpx.get(sitemap_url, timeout=5, follow_redirects=True,
                       headers={"User-Agent": "TrustForge/1.0 Compliance Scanner"})
        if r.status_code == 200 and "<urlset" in r.text.lower():
            urls = re.findall(r"<loc>", r.text)
            checks.append(ScanCheck("sitemap", "sitemap.xml", "technical", "pass",
                f"sitemap.xml present with ~{len(urls)} URLs."))
            return
    except Exception:
        pass
    checks.append(ScanCheck("sitemap", "sitemap.xml", "technical", "attention",
        "sitemap.xml not found or not valid XML.",
        recommendation="Publish a sitemap.xml."))


def _check_recaptcha(html: str, checks: List, evidence: List) -> None:
    has_recaptcha = bool(re.search(r"recaptcha|captcha|hcaptcha|turnstile", html, re.IGNORECASE))
    if has_recaptcha:
        checks.append(ScanCheck("recaptcha", "Bot defence / CAPTCHA", "technical", "pass",
            "A CAPTCHA or bot-defence mechanism detected."))
    else:
        checks.append(ScanCheck("recaptcha", "Bot defence / CAPTCHA", "technical", "attention",
            "No CAPTCHA or bot-defence mechanism detected on public forms.",
            recommendation="Consider adding CAPTCHA protection to public data submission forms."))


# ─── Score computation ────────────────────────────────────────────────────────

def _compute_score(checks: List[ScanCheck]) -> Tuple[int, str]:
    """
    Compute a preliminary numeric score from scan check outcomes.

    This is a SURFACE score for the public scan result only.
    The full Trust Score is computed deterministically by the compliance engine
    after wizard + scanner evidence is evaluated through the control layer.
    """
    if not checks:
        return 0, "Critical"

    weights = {"pass": 1.0, "attention": 0.4, "gap": 0.0}
    total_weight = 0.0
    earned = 0.0

    for c in checks:
        w = weights.get(c.state, 0.0)
        earned += w
        total_weight += 1.0

    raw = earned / total_weight if total_weight > 0 else 0.0
    score = int(round(raw * 100))

    if score >= 80:
        posture = "Strong Alignment"
    elif score >= 65:
        posture = "Needs Attention"
    elif score >= 50:
        posture = "Potential Gaps"
    else:
        posture = "Critical"

    return score, posture
