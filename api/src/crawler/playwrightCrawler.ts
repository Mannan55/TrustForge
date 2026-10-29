/**
 * TrustForge Dynamic Playwright Website Crawler.
 * Performs non-intrusive public observation, SSRF-protected navigation,
 * cookie attribute extraction, CMP detection, and structured evidence emission.
 */
import crypto from 'node:crypto';
import { chromium, Browser, Page } from 'playwright';
import { validateTargetUrl } from './ssrfGuard.js';
import { EvidenceItem, ScanCheck } from '../types/index.js';

export interface ScanExecutionResult {
  scanId: string;
  url: string;
  status: 'completed' | 'failed';
  checks: ScanCheck[];
  evidence: EvidenceItem[];
  preliminaryScore: number;
  posture: 'Strong Alignment' | 'Needs Attention' | 'Potential Gaps' | 'Critical';
  scannedAt: string;
  durationMs: number;
  error?: string;
}

const KNOWN_TRACKERS = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'facebook.net',
  'connect.facebook.net',
  'hotjar.com',
  'clarity.ms',
  'segment.io',
  'mixpanel.com',
  'criteo.com',
];

export async function crawlWebsite(targetUrl: string): Promise<ScanExecutionResult> {
  const startTime = Date.now();
  const scanId = `SCAN_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const scannedAt = new Date().toISOString();

  // 1. SSRF and destination validation
  const validation = await validateTargetUrl(targetUrl);
  if (!validation.isValid || !validation.normalizedUrl) {
    return {
      scanId,
      url: targetUrl,
      status: 'failed',
      checks: [],
      evidence: [],
      preliminaryScore: 0,
      posture: 'Critical',
      scannedAt,
      durationMs: Date.now() - startTime,
      error: validation.error || 'Invalid or prohibited destination.',
    };
  }

  const normalizedUrl = validation.normalizedUrl;
  const checks: ScanCheck[] = [];
  const evidence: EvidenceItem[] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (TrustForge DPDP Compliance Research Scanner)',
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: false,
    });

    const page = await context.newPage();

    // Intercept requests to detect third-party trackers and payment gateways
    const detectedTrackers = new Set<string>();
    const detectedGateways = new Set<string>();
    const KNOWN_PAYMENT_GATEWAYS = [
      { name: 'Razorpay', pattern: /checkout\.razorpay\.com|api\.razorpay\.com|razorpay\.js/i },
      { name: 'Stripe', pattern: /js\.stripe\.com|checkout\.stripe\.com/i },
      { name: 'Cashfree', pattern: /cashfree\.com|checkout\.cashfree\.com/i },
      { name: 'PayU', pattern: /payu\.in|secure\.payu\.in/i },
      { name: 'CCAvenue', pattern: /ccavenue\.com/i },
      { name: 'BillDesk', pattern: /billdesk\.com/i },
    ];

    page.on('request', req => {
      const reqUrl = req.url().toLowerCase();
      for (const tracker of KNOWN_TRACKERS) {
        if (reqUrl.includes(tracker)) {
          detectedTrackers.add(tracker);
        }
      }
      for (const gw of KNOWN_PAYMENT_GATEWAYS) {
        if (gw.pattern.test(reqUrl)) {
          detectedGateways.add(gw.name);
        }
      }
    });

    // Navigate to target URL
    const response = await page.goto(normalizedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 18000,
    });

    const finalUrl = page.url();
    const isHttps = finalUrl.startsWith('https://');
    const headers = response ? response.headers() : {};
    const hsts = headers['strict-transport-security'];

    // ── Check 1: HTTPS & Transport Security ─────────────────────────────────
    if (isHttps) {
      checks.push({
        id: 'SEC_HTTPS',
        label: 'HTTPS Transport Encryption',
        kind: 'technical',
        state: 'pass',
        detail: 'Website enforces TLS encryption for communication in transit.',
        recommendation: 'Ensure modern TLS 1.3 ciphers are configured.',
      });
    } else {
      checks.push({
        id: 'SEC_HTTPS',
        label: 'HTTPS Transport Encryption',
        kind: 'technical',
        state: 'gap',
        detail: 'Website served over unencrypted HTTP protocol.',
        recommendation: 'Enforce automatic 301 redirection to HTTPS.',
      });
    }

    // Always emit canonical transport_security evidence (P1-16 / C5 repair)
    evidence.push({
      id: `EVID_${scanId}_TRANSPORT_SEC`,
      source_type: 'WEBSITE_SCAN',
      key: 'transport_security',
      label: 'HTTPS Transport Encryption',
      value: { https: isHttps, hsts: !!hsts, finalUrl },
      status: isHttps ? 'VERIFIED' : 'NOT_FOUND',
      confidence: 1.0,
      extracted_at: scannedAt,
      source_url: finalUrl,
      notes: isHttps ? 'Website enforces TLS encryption in transit.' : 'Website communicates over unencrypted plaintext HTTP.',
    });
    evidence.push({
      id: `EVID_${scanId}_HTTPS`,
      source_type: 'WEBSITE_SCAN',
      key: 'https_enforced',
      label: 'HTTPS Enforcement',
      value: { isHttps, finalUrl },
      status: isHttps ? 'VERIFIED' : 'NOT_FOUND',
      confidence: 1.0,
      extracted_at: scannedAt,
      source_url: finalUrl,
    });

    // ── Check 2: HSTS Header ────────────────────────────────────────────────
    if (hsts) {
      checks.push({
        id: 'SEC_HSTS',
        label: 'HTTP Strict Transport Security (HSTS)',
        kind: 'technical',
        state: 'pass',
        detail: `HSTS header verified: ${hsts.substring(0, 60)}`,
      });
      evidence.push({
        id: `EVID_${scanId}_HSTS`,
        source_type: 'WEBSITE_SCAN',
        key: 'hsts_header',
        label: 'HSTS Header',
        value: hsts,
        status: 'VERIFIED',
        confidence: 1.0,
        extracted_at: scannedAt,
        source_url: finalUrl,
      });
    } else {
      checks.push({
        id: 'SEC_HSTS',
        label: 'HTTP Strict Transport Security (HSTS)',
        kind: 'technical',
        state: 'gap',
        detail: 'No Strict-Transport-Security header observed in HTTP response.',
        recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains',
      });
    }

    // ── Check 3: Content Security Policy & Defensive Headers ─────────────────
    const csp = headers['content-security-policy'];
    const xcto = headers['x-content-type-options'];
    const xfo = headers['x-frame-options'];
    const referrerPolicy = headers['referrer-policy'];

    if (csp) {
      checks.push({
        id: 'SEC_CSP',
        label: 'Content Security Policy (CSP)',
        kind: 'technical',
        state: 'pass',
        detail: 'CSP observed; restricts unauthorized script injection.',
      });
      evidence.push({
        id: `EVID_${scanId}_CSP`,
        source_type: 'WEBSITE_SCAN',
        key: 'csp_header',
        label: 'CSP Header',
        value: csp.substring(0, 200),
        status: 'VERIFIED',
        confidence: 1.0,
        extracted_at: scannedAt,
      });
    } else {
      checks.push({
        id: 'SEC_CSP',
        label: 'Content Security Policy (CSP)',
        kind: 'technical',
        state: 'attention',
        detail: 'No Content-Security-Policy header detected.',
        recommendation: 'Define a strict CSP to prevent Cross-Site Scripting (XSS).',
      });
    }

    // ── Check 4: Dynamic Cookie Inspection ──────────────────────────────────
    const cookies = await context.cookies();
    let insecureCookies = 0;
    for (const c of cookies) {
      if (!c.secure) insecureCookies++;
    }

    evidence.push({
      id: `EVID_${scanId}_COOKIES`,
      source_type: 'WEBSITE_SCAN',
      key: 'cookies_detected',
      label: 'Observed Cookies',
      value: { total: cookies.length, insecureCookies, cookieNames: cookies.map(c => c.name) },
      status: 'DETECTED',
      confidence: 1.0,
      extracted_at: scannedAt,
    });

    if (insecureCookies > 0) {
      checks.push({
        id: 'SEC_COOKIE_FLAGS',
        label: 'Cookie Security Attributes',
        kind: 'technical',
        state: 'gap',
        detail: `${insecureCookies} cookie(s) missing Secure attribute.`,
        recommendation: 'Ensure all cookies set Secure, HttpOnly, and SameSite attributes.',
      });
    } else {
      checks.push({
        id: 'SEC_COOKIE_FLAGS',
        label: 'Cookie Security Attributes',
        kind: 'technical',
        state: 'pass',
        detail: cookies.length > 0 ? `All ${cookies.length} cookie(s) flagged with Secure attribute.` : 'No cookies deposited on initial landing.',
      });
    }

    // ── Check 5: Third-Party Tracker Scripts ────────────────────────────────
    if (detectedTrackers.size > 0) {
      const trackerList = Array.from(detectedTrackers);
      checks.push({
        id: 'PRIV_TRACKERS',
        label: 'Third-Party Analytics & Tracking Scripts',
        kind: 'privacy',
        state: 'attention',
        detail: `Detected ${trackerList.length} third-party tracker domain(s): ${trackerList.join(', ')}`,
        recommendation: 'Verify explicit consent is acquired prior to firing third-party trackers under DPDP Section 6.',
      });
      evidence.push({
        id: `EVID_${scanId}_TRACKERS`,
        source_type: 'WEBSITE_SCAN',
        key: 'tracker_scripts',
        label: 'Third-Party Trackers',
        value: trackerList,
        status: 'DETECTED',
        confidence: 0.95,
        extracted_at: scannedAt,
      });
    } else {
      checks.push({
        id: 'PRIV_TRACKERS',
        label: 'Third-Party Analytics & Tracking Scripts',
        kind: 'privacy',
        state: 'pass',
        detail: 'No common third-party tracking or advertising scripts detected.',
      });
    }

    // ── Check 6: Privacy Policy Discovery & Extraction ─────────────────────
    const policyResult = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const policyRegex = /(privacy|privacy-policy|privacypolicy|gopniyata|data-protection)/i;
      for (const a of links) {
        const href = (a as HTMLAnchorElement).href;
        const text = (a.textContent || '').trim();
        if (policyRegex.test(href) || policyRegex.test(text)) {
          return { found: true, href, text };
        }
      }
      return { found: false, href: '', text: '' };
    });

    if (policyResult.found) {
      checks.push({
        id: 'PRIV_POLICY_LINK',
        label: 'Privacy Notice Discovery',
        kind: 'privacy',
        state: 'pass',
        detail: `Privacy Policy link identified: ${policyResult.href}`,
      });
      evidence.push({
        id: `EVID_${scanId}_POLICY`,
        source_type: 'WEBSITE_SCAN',
        key: 'privacy_policy_url',
        label: 'Privacy Policy URL',
        value: { url: policyResult.href, anchorText: policyResult.text },
        status: 'VERIFIED',
        confidence: 1.0,
        extracted_at: scannedAt,
        source_url: policyResult.href,
      });
    } else {
      checks.push({
        id: 'PRIV_POLICY_LINK',
        label: 'Privacy Notice Discovery',
        kind: 'privacy',
        state: 'gap',
        detail: 'No accessible privacy policy link found on homepage.',
        recommendation: 'Provide prominent, clear link to Privacy Notice in header and footer (DPDP Section 5).',
      });
    }

    // Always emit canonical privacy_notice evidence (P1-16 / C5 repair)
    evidence.push({
      id: `EVID_${scanId}_PRIVACY_NOTICE`,
      source_type: 'WEBSITE_SCAN',
      key: 'privacy_notice',
      label: 'Privacy Notice Discovery',
      value: {
        policyFound: policyResult.found,
        policyUrl: policyResult.href || null,
        anchorText: policyResult.text || null,
      },
      status: policyResult.found ? 'VERIFIED' : 'NOT_FOUND',
      confidence: 1.0,
      extracted_at: scannedAt,
      source_url: policyResult.href || finalUrl,
      notes: policyResult.found ? `Privacy notice link discovered at ${policyResult.href}` : 'No accessible privacy notice link found on homepage.',
    });

    // ── Check 7: Cookie Consent Banner / CMP Detection ──────────────────────
    const cmpDetected = await page.evaluate(() => {
      const selectors = [
        '#onetrust-banner-sdk',
        '.cookie-banner',
        '#cookie-notice',
        '#axeptio_overlay',
        '.cc-banner',
        '.klaro',
        '[aria-label*="cookie" i]',
        '[id*="cookie-banner" i]',
      ];
      for (const s of selectors) {
        if (document.querySelector(s)) return true;
      }
      const bodyText = document.body.innerText || '';
      return /we use cookies|cookie policy|manage cookies|accept all cookies/i.test(bodyText);
    });

    if (cmpDetected) {
      checks.push({
        id: 'PRIV_COOKIE_BANNER',
        label: 'Consent Management Notice / Banner',
        kind: 'privacy',
        state: 'pass',
        detail: 'Cookie consent / notice banner detected in initial page DOM.',
      });
      evidence.push({
        id: `EVID_${scanId}_CMP`,
        source_type: 'WEBSITE_SCAN',
        key: 'cookie_banner_detected',
        label: 'Consent Management Platform',
        value: { bannerPresent: true },
        status: 'VERIFIED',
        confidence: 0.9,
        extracted_at: scannedAt,
      });
    } else {
      checks.push({
        id: 'PRIV_COOKIE_BANNER',
        label: 'Consent Management Notice / Banner',
        kind: 'privacy',
        state: 'attention',
        detail: 'No standard Cookie Consent banner observed.',
        recommendation: 'If non-essential cookies or trackers are utilized, display prior notice and consent mechanism.',
      });
    }

    // ── Check 8: Data Collection Forms ──────────────────────────────────────
    const formInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      const piiFields: string[] = [];
      for (const inp of inputs) {
        const name = (inp.getAttribute('name') || inp.getAttribute('id') || inp.getAttribute('placeholder') || '').toLowerCase();
        if (/email|phone|mobile|aadhaar|pan|name|address|dob/i.test(name)) {
          piiFields.push(name);
        }
      }
      return piiFields;
    });

    if (formInputs.length > 0) {
      checks.push({
        id: 'PRIV_FORM_COLLECTION',
        label: 'Personal Data Collection Fields',
        kind: 'privacy',
        state: 'attention',
        detail: `Observed data collection fields: ${formInputs.slice(0, 5).join(', ')}`,
        recommendation: 'Ensure itemised notice and purpose specification accompanies all personal data input fields.',
      });
      evidence.push({
        id: `EVID_${scanId}_FORMS`,
        source_type: 'WEBSITE_SCAN',
        key: 'form_pii_fields',
        label: 'Form PII Fields',
        value: formInputs,
        status: 'DETECTED',
        confidence: 0.9,
        extracted_at: scannedAt,
      });
    } else {
      checks.push({
        id: 'PRIV_FORM_COLLECTION',
        label: 'Personal Data Collection Fields',
        kind: 'privacy',
        state: 'pass',
        detail: 'No conspicuous personal data entry fields on initial landing page.',
      });
    }

    // ── Check 9: Payment Gateway & Processor Detection ──────────────────────
    if (detectedGateways.size > 0) {
      const gatewayList = Array.from(detectedGateways);
      checks.push({
        id: 'TECH_PAYMENT_GATEWAYS',
        label: 'Payment Processor Integration',
        kind: 'technical',
        state: 'pass',
        detail: `Observed payment processor telemetry: ${gatewayList.join(', ')}`,
      });
      evidence.push({
        id: `EVID_${scanId}_GATEWAYS`,
        source_type: 'WEBSITE_SCAN',
        key: 'payment_gateways',
        label: 'Payment Processors',
        value: { gateways: gatewayList, count: gatewayList.length },
        status: 'DETECTED',
        confidence: 0.95,
        extracted_at: scannedAt,
        notes: `Detected payment processor integration: ${gatewayList.join(', ')}`,
      });
    }

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      scanId,
      url: normalizedUrl,
      status: 'failed',
      checks,
      evidence,
      preliminaryScore: 0,
      posture: 'Critical',
      scannedAt,
      durationMs: Date.now() - startTime,
      error: `Crawl failure: ${errorMsg}`,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  // Calculate preliminary technical posture score (0-100)
  let passWeight = 0;
  let totalWeight = checks.length;
  for (const c of checks) {
    if (c.state === 'pass') passWeight += 1;
    else if (c.state === 'attention') passWeight += 0.5;
  }

  const preliminaryScore = totalWeight > 0 ? Math.round((passWeight / totalWeight) * 100) : 50;
  let posture: 'Strong Alignment' | 'Needs Attention' | 'Potential Gaps' | 'Critical';
  if (preliminaryScore >= 80) posture = 'Strong Alignment';
  else if (preliminaryScore >= 65) posture = 'Needs Attention';
  else if (preliminaryScore >= 50) posture = 'Potential Gaps';
  else posture = 'Critical';

  return {
    scanId,
    url: normalizedUrl,
    status: 'completed',
    checks,
    evidence,
    preliminaryScore,
    posture,
    scannedAt,
    durationMs: Date.now() - startTime,
  };
}
