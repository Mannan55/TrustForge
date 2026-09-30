"""
TrustForge — Real Website Scanner Service

Performs actual HTTP-based public-signal analysis.
This is a COMPLIANCE scanner, NOT a penetration testing tool.

Safety constraints enforced:
  - SSRF protection: blocks private/loopback/link-local IPs
  - Response size limit
  - Timeout per request
  - Redirect limit
  - Read-only analysis of publicly available resources
"""
from __future__ import annotations

import re
import time
import ipaddress
import socket
from typing import Optional
from urllib.parse import urlparse, urljoin

import httpx
from bs4 import BeautifulSoup

from app.config import settings
from app.schemas import (
    ScanResult, HttpsResult, PrivacyPolicyResult,
    CookieConsentResult, TrackerDetection, FormDetection, FormField,
    SecurityHeadersResult,
)

# ─────────────────────────────────────────────────────────────
# TRACKER SIGNATURES — publicly observable script patterns
# ─────────────────────────────────────────────────────────────
TRACKER_SIGNATURES = [
    {"name": "Google Analytics 4", "patterns": ["gtag/js", "ga4", "google-analytics.com/g/collect", "googletagmanager.com"]},
    {"name": "Google Tag Manager", "patterns": ["googletagmanager.com/gtm.js", "gtm.js"]},
    {"name": "Meta/Facebook Pixel", "patterns": ["connect.facebook.net", "fbevents.js", "fbq("]},
    {"name": "Hotjar", "patterns": ["static.hotjar.com", "hotjar.com"]},
    {"name": "Intercom", "patterns": ["widget.intercom.io", "api.intercom.io", "intercomcdn.com"]},
    {"name": "Microsoft Clarity", "patterns": ["clarity.ms", "c.clarity.ms"]},
    {"name": "Segment", "patterns": ["cdn.segment.com", "analytics.js"]},
    {"name": "Mixpanel", "patterns": ["cdn.mxpnl.com", "mixpanel.com/libs"]},
    {"name": "Crisp Chat", "patterns": ["client.crisp.chat"]},
    {"name": "Freshdesk/Freshchat", "patterns": ["wchat.freshchat.com", "widget.freshworks.com"]},
]

# Privacy policy URL heuristics
PRIVACY_URL_PATTERNS = [
    "privacy", "privacy-policy", "privacypolicy",
    "data-protection", "gdpr", "dpdp", "personal-data"
]

# Cookie/consent banner text heuristics
CONSENT_PATTERNS = [
    "cookie", "consent", "we use cookies", "this site uses",
    "accept all", "accept cookies", "cookie policy",
    "gdpr", "privacy settings", "manage preferences",
]

CONSENT_REJECT_PATTERNS = ["reject all", "decline", "reject cookies", "no thanks"]
CONSENT_PREFERENCE_PATTERNS = ["manage", "preferences", "settings", "customize", "customise"]
CONSENT_ACCEPT_PATTERNS = ["accept all", "accept cookies", "i agree", "got it", "ok"]

# Personal data field heuristics
PERSONAL_DATA_FIELD_PATTERNS = {
    "name": ["name", "fullname", "full_name", "firstname", "lastname", "first_name", "last_name"],
    "email": ["email", "e-mail", "emailaddress"],
    "phone": ["phone", "mobile", "tel", "telephone", "phonenumber", "phone_number"],
    "address": ["address", "street", "city", "postcode", "pincode", "zipcode"],
    "dob": ["dob", "dateofbirth", "date_of_birth", "birthday", "birth_date"],
}

GRIEVANCE_PATTERNS = [
    "grievance officer", "grievance contact", "data protection officer",
    "dpo", "nodal officer", "grievance redressal",
    "grievance@", "dpo@", "privacy@", "dataprotection@",
]

LANGUAGE_SUPPORT_PATTERNS = [
    "हिन्दी", "hindi", "bengali", "telugu", "marathi",
    "tamil", "urdu", "kannada", "gujarati", "8th schedule",
    "regional language", "vernacular",
]


def _is_safe_url(url: str) -> tuple[bool, str]:
    """
    SSRF protection: block private, loopback, and link-local destinations.
    Returns (is_safe, reason).
    """
    try:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        if not host:
            return False, "No hostname in URL"

        # Resolve hostname to IP
        try:
            ip_str = socket.gethostbyname(host)
            ip = ipaddress.ip_address(ip_str)
        except socket.gaierror:
            # Cannot resolve — allow, will fail at request time
            return True, "hostname unresolvable (allowed)"

        if ip.is_loopback:
            return False, f"Blocked: loopback address ({ip})"
        if ip.is_private:
            return False, f"Blocked: private network address ({ip})"
        if ip.is_link_local:
            return False, f"Blocked: link-local address ({ip})"
        if ip.is_reserved:
            return False, f"Blocked: reserved address ({ip})"

        return True, "ok"
    except Exception as e:
        return False, f"URL validation error: {e}"


def _get_client() -> httpx.Client:
    return httpx.Client(
        timeout=settings.scanner_timeout_seconds,
        max_redirects=settings.scanner_max_redirects,
        follow_redirects=True,
        headers={"User-Agent": settings.scanner_user_agent},
        verify=True,
    )


def _fetch_page(client: httpx.Client, url: str) -> Optional[httpx.Response]:
    """Fetch a page with safety checks. Returns None on error."""
    try:
        resp = client.get(url)
        # Limit response body size
        content = resp.content[:settings.scanner_max_response_bytes]
        return resp
    except Exception:
        return None


def _detect_https(url: str, response: httpx.Response) -> HttpsResult:
    """Detect HTTPS status and HSTS header."""
    final_url = str(response.url)
    original_http = url.startswith("http://") and not url.startswith("https://")
    has_https = final_url.startswith("https://")
    redirected = original_http and has_https
    hsts = response.headers.get("Strict-Transport-Security", "")
    hsts_present = bool(hsts)

    evidence = (
        f"Final URL: {final_url}. "
        f"HSTS: {'present' if hsts_present else 'absent'}."
        + (f" HSTS value: {hsts[:80]}" if hsts else "")
    )
    return HttpsResult(
        has_https=has_https,
        redirects_to_https=redirected,
        hsts_present=hsts_present,
        evidence=evidence,
    )


def _find_privacy_policy(base_url: str, soup: BeautifulSoup, client: httpx.Client) -> PrivacyPolicyResult:
    """
    Look for a privacy policy link and fetch its contents for further signals.
    """
    parsed_base = urlparse(base_url)
    base = f"{parsed_base.scheme}://{parsed_base.netloc}"

    # Search all <a> tags for privacy-related href or text
    privacy_url = None
    for a in soup.find_all("a", href=True):
        href = a["href"].lower()
        text = a.get_text(strip=True).lower()
        if any(p in href or p in text for p in PRIVACY_URL_PATTERNS):
            raw_href = a["href"]
            if raw_href.startswith("http"):
                privacy_url = raw_href
            elif raw_href.startswith("/"):
                privacy_url = base + raw_href
            else:
                privacy_url = urljoin(base_url, raw_href)
            break

    if not privacy_url:
        return PrivacyPolicyResult(
            found=False,
            evidence="No privacy policy link detected in page HTML.",
        )

    # Fetch the privacy page
    pp_resp = _fetch_page(client, privacy_url)
    if not pp_resp:
        return PrivacyPolicyResult(
            found=True,
            url=privacy_url,
            evidence=f"Privacy link found at {privacy_url} but page could not be fetched.",
        )

    pp_text = pp_resp.text[:50000].lower()

    has_grievance = any(p in pp_text for p in GRIEVANCE_PATTERNS)
    has_language = any(p.lower() in pp_text for p in LANGUAGE_SUPPORT_PATTERNS)

    # Look for "last updated" wording
    last_updated = None
    for pattern in [
        r"last updated[:\s]+([a-z]+ \d{1,2},?\s*\d{4})",
        r"effective date[:\s]+([a-z]+ \d{1,2},?\s*\d{4})",
        r"updated on[:\s]+([a-z]+ \d{1,2},?\s*\d{4})",
        r"revised[:\s]+([a-z]+ \d{1,2},?\s*\d{4})",
    ]:
        m = re.search(pattern, pp_text, re.IGNORECASE)
        if m:
            last_updated = m.group(1)
            break

    evidence = (
        f"Privacy page: {privacy_url}. "
        f"Grievance contact: {'detected' if has_grievance else 'not detected'}. "
        f"Language support signals: {'detected' if has_language else 'not detected'}."
        + (f" Last updated: {last_updated}" if last_updated else "")
    )
    return PrivacyPolicyResult(
        found=True,
        url=privacy_url,
        has_grievance_contact=has_grievance,
        has_language_support=has_language,
        last_updated_text=last_updated,
        evidence=evidence,
    )


def _detect_cookie_consent(html_text: str, script_text: str) -> CookieConsentResult:
    """
    Heuristic detection of cookie consent UI.
    Does NOT declare compliance merely because a banner exists.
    """
    text_lower = html_text.lower()

    banner_detected = any(p in text_lower for p in CONSENT_PATTERNS)
    has_accept = any(p in text_lower for p in CONSENT_ACCEPT_PATTERNS)
    has_reject = any(p in text_lower for p in CONSENT_REJECT_PATTERNS)
    has_pref = any(p in text_lower for p in CONSENT_PREFERENCE_PATTERNS)

    # Check if trackers appear in page before any consent gate
    # (simple heuristic: tracker scripts in <head> before any consent JS)
    trackers_before_consent: list[str] = []
    consent_position = text_lower.find("consent")
    for sig in TRACKER_SIGNATURES:
        for pattern in sig["patterns"]:
            pos = text_lower.find(pattern.lower())
            if pos != -1:
                if consent_position == -1 or pos < consent_position:
                    trackers_before_consent.append(sig["name"])
                break

    evidence = (
        f"Cookie banner signals: {'detected' if banner_detected else 'not detected'}. "
        f"Accept button: {'found' if has_accept else 'not found'}. "
        f"Reject button: {'found' if has_reject else 'not found'}. "
        f"Preference/settings: {'found' if has_pref else 'not found'}."
    )
    if trackers_before_consent:
        evidence += f" Trackers appearing before consent gate: {', '.join(set(trackers_before_consent))}."

    return CookieConsentResult(
        banner_detected=banner_detected,
        has_accept_button=has_accept,
        has_reject_button=has_reject,
        has_preference_button=has_pref,
        trackers_before_consent=list(set(trackers_before_consent)),
        evidence=evidence,
    )


def _detect_trackers(html_text: str) -> list[TrackerDetection]:
    """Scan HTML for known tracker script signatures."""
    text_lower = html_text.lower()
    results = []
    for sig in TRACKER_SIGNATURES:
        detected = False
        evidence_pattern = ""
        for pattern in sig["patterns"]:
            if pattern.lower() in text_lower:
                detected = True
                evidence_pattern = pattern
                break
        results.append(TrackerDetection(
            name=sig["name"],
            script_pattern=evidence_pattern or sig["patterns"][0],
            detected=detected,
            evidence=(
                f"Pattern '{evidence_pattern}' found in page source." if detected
                else "Not detected in page source."
            ),
        ))
    return results


def _detect_forms(soup: BeautifulSoup) -> FormDetection:
    """Detect forms and personal data collection fields."""
    forms = soup.find_all("form")
    personal_fields = []

    for form in forms:
        inputs = form.find_all(["input", "select", "textarea"])
        for inp in inputs:
            name_attr = (inp.get("name") or "").lower()
            id_attr = (inp.get("id") or "").lower()
            placeholder = (inp.get("placeholder") or "").lower()
            inp_type = (inp.get("type") or "text").lower()

            # Skip hidden/submit/button fields
            if inp_type in ("hidden", "submit", "button", "reset", "image"):
                continue

            label_text = ""
            if inp.get("id"):
                lbl = soup.find("label", attrs={"for": inp.get("id")})
                if lbl:
                    label_text = lbl.get_text(strip=True).lower()

            all_text = f"{name_attr} {id_attr} {placeholder} {label_text}"

            for data_type, keywords in PERSONAL_DATA_FIELD_PATTERNS.items():
                if any(kw in all_text for kw in keywords):
                    personal_fields.append(FormField(
                        field_type=data_type,
                        name=name_attr or id_attr or "unknown",
                        label=label_text or None,
                    ))
                    break

    evidence = (
        f"{len(forms)} form(s) detected. "
        f"Personal data fields found: {len(personal_fields)} "
        f"({', '.join(set(f.field_type for f in personal_fields)) or 'none'})."
    )
    return FormDetection(
        form_count=len(forms),
        personal_data_fields=personal_fields,
        evidence=evidence,
    )


def _detect_security_headers(response: httpx.Response) -> SecurityHeadersResult:
    """Extract security headers from the HTTP response."""
    h = response.headers
    return SecurityHeadersResult(
        content_security_policy=h.get("Content-Security-Policy"),
        strict_transport_security=h.get("Strict-Transport-Security"),
        x_content_type_options=h.get("X-Content-Type-Options"),
        referrer_policy=h.get("Referrer-Policy"),
        permissions_policy=h.get("Permissions-Policy"),
        x_frame_options=h.get("X-Frame-Options"),
    )


def _build_observations(
    https: HttpsResult,
    pp: PrivacyPolicyResult,
    consent: CookieConsentResult,
    trackers: list[TrackerDetection],
    security_headers: SecurityHeadersResult,
) -> tuple[list[str], list[str]]:
    """
    Synthesise human-readable observations and evidence list.
    Note: security headers are NOT described as DPDP violations unless directly relevant.
    """
    observations = []
    evidence = []

    # HTTPS
    if https.has_https:
        observations.append("Website served over HTTPS.")
        evidence.append(f"HTTPS confirmed: {https.evidence}")
    else:
        observations.append("Website NOT served over HTTPS — a significant security concern.")
        evidence.append(f"HTTP only detected: {https.evidence}")

    if https.hsts_present:
        observations.append("HTTP Strict Transport Security (HSTS) header present — supports secure connections.")
    else:
        observations.append("HSTS header absent — browsers may allow HTTP downgrade attempts.")

    # Privacy Policy
    if pp.found:
        observations.append(f"Privacy policy page detected at: {pp.url}.")
        evidence.append(f"Privacy policy: {pp.evidence}")
        if pp.has_grievance_contact:
            observations.append("Grievance/data protection contact information detected in privacy policy.")
        else:
            observations.append(
                "Grievance/data protection contact not clearly detected in privacy policy — "
                "DPDP Act Section 8(9) requires designated Grievance Officer contact."
            )
        if pp.has_language_support:
            observations.append("Privacy policy appears to reference Indian language support.")
    else:
        observations.append(
            "No privacy policy link detected — DPDP Act requires a clear privacy notice for Data Fiduciaries."
        )
        evidence.append("Privacy policy: not found in page HTML.")

    # Cookie consent
    if consent.banner_detected:
        observations.append("Cookie/consent banner signals detected.")
        if consent.has_reject_button:
            observations.append("Reject/decline option detected in consent interface.")
        else:
            observations.append(
                "Reject option NOT clearly detected — DPDP Act Section 6 requires ability to withdraw consent as easily as it was given."
            )
        evidence.append(f"Cookie consent: {consent.evidence}")
    else:
        observations.append("No cookie/consent banner signals detected.")

    if consent.trackers_before_consent:
        observations.append(
            f"Warning: tracker scripts ({', '.join(consent.trackers_before_consent)}) appear "
            f"to load before consent gate — may indicate pre-consent data collection."
        )

    # Trackers
    detected_trackers = [t.name for t in trackers if t.detected]
    if detected_trackers:
        observations.append(f"Third-party tracker scripts detected: {', '.join(detected_trackers)}.")
        for t in trackers:
            if t.detected:
                evidence.append(f"Tracker {t.name}: {t.evidence}")

    # Security headers (presented as technical signals, NOT as DPDP violations)
    missing_headers = []
    if not security_headers.content_security_policy:
        missing_headers.append("Content-Security-Policy")
    if not security_headers.x_content_type_options:
        missing_headers.append("X-Content-Type-Options")
    if not security_headers.referrer_policy:
        missing_headers.append("Referrer-Policy")

    if missing_headers:
        observations.append(
            f"Security headers absent (technical signal, not a direct DPDP provision): "
            f"{', '.join(missing_headers)}. These are web security best-practice headers."
        )

    return observations, evidence


def scan_website(url: str) -> ScanResult:
    """
    Main entry point: perform a real public-signal scan of a website.
    Returns a structured ScanResult.
    """
    start_ms = int(time.time() * 1000)

    # SSRF check
    is_safe, reason = _is_safe_url(url)
    if not is_safe:
        return ScanResult(
            url=url,
            scan_date=_today(),
            scan_duration_ms=0,
            https=HttpsResult(has_https=False, redirects_to_https=False, hsts_present=False, evidence="Scan blocked."),
            privacy_policy=PrivacyPolicyResult(found=False, evidence="Scan blocked."),
            cookie_consent=CookieConsentResult(banner_detected=False, has_accept_button=False, has_reject_button=False, has_preference_button=False, evidence="Scan blocked."),
            trackers=[],
            forms=FormDetection(form_count=0, evidence="Scan blocked."),
            security_headers=SecurityHeadersResult(),
            observations=[f"Scan blocked for safety: {reason}"],
            evidence=[],
            error=f"SSRF/safety block: {reason}",
        )

    with _get_client() as client:
        response = _fetch_page(client, url)

        if response is None:
            return ScanResult(
                url=url,
                scan_date=_today(),
                scan_duration_ms=int(time.time() * 1000) - start_ms,
                https=HttpsResult(has_https=url.startswith("https"), redirects_to_https=False, hsts_present=False, evidence="Page unreachable."),
                privacy_policy=PrivacyPolicyResult(found=False, evidence="Page unreachable."),
                cookie_consent=CookieConsentResult(banner_detected=False, has_accept_button=False, has_reject_button=False, has_preference_button=False, evidence="Page unreachable."),
                trackers=[],
                forms=FormDetection(form_count=0, evidence="Page unreachable."),
                security_headers=SecurityHeadersResult(),
                observations=["Website could not be reached within the timeout."],
                evidence=[],
                error="Connection failed or timeout.",
            )

        html = response.text[:settings.scanner_max_response_bytes]
        soup = BeautifulSoup(html, "lxml")

        # Run all checks
        https_result = _detect_https(url, response)
        pp_result = _find_privacy_policy(str(response.url), soup, client)
        consent_result = _detect_cookie_consent(html, "")
        tracker_results = _detect_trackers(html)
        form_result = _detect_forms(soup)
        security_headers = _detect_security_headers(response)

        observations, evidence = _build_observations(
            https_result, pp_result, consent_result, tracker_results, security_headers
        )

        elapsed = int(time.time() * 1000) - start_ms

        return ScanResult(
            url=url,
            scan_date=_today(),
            scan_duration_ms=elapsed,
            https=https_result,
            privacy_policy=pp_result,
            cookie_consent=consent_result,
            trackers=tracker_results,
            forms=form_result,
            security_headers=security_headers,
            observations=observations,
            evidence=evidence,
        )


def _today() -> str:
    from datetime import date
    return date.today().isoformat()
