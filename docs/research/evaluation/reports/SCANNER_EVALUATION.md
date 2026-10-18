# TrustForge Website Scanner Technical Evaluation Report (P2.1)

**Evaluation Date:** 2026-10-09  
**Total Fixtures Tested:** 20  
**Total Individual Check Assertions:** 59  
**Raw Results CSV:** `docs/research/evaluation/results/scanner_results.csv`  

---

## 1. Methodology

The technical website scanner executes deterministic parsing of HTTP response headers and HTML payloads.
To benchmark classification performance without external network flakiness, 20 controlled fixtures representing
realistic enterprise, SME, and non-compliant websites were evaluated. Each check's observation state was tested
against objectively established ground truth.

### Separation of Concerns:
- **Scanner Performance:** Tests whether technical signals (e.g., HSTS header, cookie banner, analytics script) are accurately observed.
- **Compliance Interpretation:** The scanner emits raw observations; legal interpretations are strictly performed downstream by TIE.

---

## 2. Check-by-Check Performance Summary

| Technical Check | Total | TP | FP | TN | FN | Accuracy | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `consent_banner` | 5 | 3 | 0 | 2 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| `csp` | 6 | 4 | 0 | 2 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| `grievance_contact` | 5 | 3 | 1 | 1 | 0 | 0.800 | 0.750 | 1.000 | 0.857 |
| `hsts` | 8 | 5 | 0 | 3 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| `https` | 6 | 5 | 0 | 1 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| `privacy_policy` | 8 | 6 | 0 | 2 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| `recaptcha` | 1 | 1 | 0 | 0 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| `terms` | 2 | 1 | 0 | 1 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| `trackers` | 6 | 3 | 0 | 3 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| `xcto` | 7 | 5 | 0 | 2 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| `xfo` | 5 | 3 | 0 | 2 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |

---

## 3. Overall Aggregate Performance

- **Overall Accuracy:** 0.9831 (98.31%)
- **Macro Precision:** 0.9750
- **Macro Recall:** 1.0000
- **Overall F1-Score:** 0.9873
- **Total True Positives (TP):** 39
- **Total True Negatives (TN):** 19
- **Total False Positives (FP):** 1
- **Total False Negatives (FN):** 0

---

## 4. Key Findings & Discussion

1. **Header Parsing Precision:** All standard security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) achieved 100% precision and recall.
2. **Case Insensitivity:** Mixed-case HTTP response headers (e.g., `Strict-Transport-Security`) were properly normalized.
3. **Tracker Regex Coverage:** Common tracking scripts (Google Analytics, Meta Pixel, Amplitude, Mixpanel, Hotjar) were successfully flagged without false positives on clean static pages.
4. **Zero Intrusive Scanning:** All tests executed locally on serialized fixtures with zero live socket calls.
