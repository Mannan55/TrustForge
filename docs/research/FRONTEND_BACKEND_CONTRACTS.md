# TrustForge — Canonical Frontend/Backend Contracts
**Research Track:** An Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Repository Branch:** `research/ten-llm-rag-benchmark`  
**Specification Version:** 2.1.0 (Production Canonical)  

---

## 1. Scope & Normalization Principles

To prevent schema divergence and rendering failures, TrustForge enforces canonical data contracts at all API boundaries (Express Node.js API, Python FastAPI Research Engine, Supabase PostgreSQL, and React Frontend):
1. **Case Normalization:** API DTOs provide snake_case keys as canonical while tolerating camelCase aliases.
2. **Numeric Precision:** Percentages are transmitted as floating-point numbers between `0.0` and `100.0`.
3. **Pillar Identifiers:** Every PillarScore provides `pillar_id` (lowercase, e.g., `'privacy'`), `pillar_name` (formal title, e.g., `'Privacy Architecture'`), and aliases `pillar` and `name` pointing to `pillar_name`.
4. **Findings Enrichment:** Every finding provides statutory reference, human-readable control name, verdict, status (`'PASS'`, `'FAIL'`, `'POTENTIAL_GAP'`), severity (`'HIGH'`, `'MEDIUM'`), and remediation recommendations.

---

## 2. Canonical Data Schemas

### 2.1 Assessment Status (`GET /api/assessments/:id`)
```json
{
  "assessment_id": "ASM_1792333803880_8qtri",
  "org_id": "org_technova",
  "website_url": "https://example.com",
  "status": "complete",
  "progress": 100,
  "current_step": "Assessment complete.",
  "trust_score": 67.24,
  "posture": "Needs Attention",
  "evidence_coverage": 65.0,
  "pillar_scores": [
    {
      "pillar_id": "privacy",
      "pillar_name": "Privacy Architecture",
      "name": "Privacy Architecture",
      "pillar": "Privacy Architecture",
      "score": 71.18,
      "applicable_controls": 5,
      "pass_count": 3,
      "gap_count": 2,
      "weight": 0.20,
      "evidence_coverage": 100.0
    }
  ],
  "findings": [
    {
      "model_id": "M03",
      "control_id": "TF-PRIV-001",
      "title": "Privacy Notice Itemisation",
      "control_name": "Privacy Notice Itemisation",
      "verdict": "PARTIALLY_SUPPORTED",
      "status": "POTENTIAL_GAP",
      "severity": "HIGH",
      "finding": "The provided evidence consists solely of self-reported data without independent website crawl confirmation.",
      "description": "The provided evidence consists solely of self-reported data without independent website crawl confirmation.",
      "recommendation": "Publish itemised notice describing data categories and processing purposes under DPDP Section 5(1).",
      "dpdp_reference": "DPDP Act 2023, Section 5(1)",
      "evidence_ids": ["EVID_ASM_1792333803880_8qtri_LANG"],
      "confidence": 0.8,
      "is_grounded": true,
      "grounding_score": 1.0
    }
  ],
  "evidence": [
    {
      "id": "EVID_ASM_1792333803880_8qtri_LANG",
      "source_type": "ASSESSMENT_WIZARD",
      "key": "notice_languages",
      "label": "Notice Languages",
      "value": ["en", "hi", "kn"],
      "status": "SELF_REPORTED",
      "confidence": 0.8,
      "extracted_at": "2026-10-18T14:30:03.880Z"
    }
  ],
  "total_controls": 20,
  "pass_count": 8,
  "potential_gap_count": 12,
  "fail_count": 0,
  "insufficient_evidence_count": 8,
  "completed_at": "2026-10-18T14:30:58.204Z"
}
```

### 2.2 Trust Score (`GET /api/trust-score/:id`)
```json
{
  "assessment_id": "ASM_1792333803880_8qtri",
  "trust_score": 67.24,
  "posture": "Needs Attention",
  "evidence_coverage": 65.0,
  "pillar_scores": [
    {
      "pillar": "Privacy Architecture",
      "pillar_id": "privacy",
      "pillar_name": "Privacy Architecture",
      "name": "Privacy Architecture",
      "score": 71.18,
      "weight": 0.20,
      "evidence_coverage": 100.0,
      "control_count": 5,
      "applicable_control_count": 5
    }
  ],
  "total_controls": 20,
  "pass_count": 8,
  "potential_gap_count": 12,
  "fail_count": 0,
  "insufficient_evidence_count": 8,
  "scored_at": "2026-10-18T14:30:58.204Z",
  "scoring_version": "2.1-canonical"
}
```

### 2.3 Evidence DTO (`evidenceService.list()`)
```typescript
export interface EvidenceItem {
  id: string;
  title: string;
  status: "VERIFIED" | "DETECTED" | "INFERRED" | "NOT_FOUND" | "NOT_ASSESSED";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  sourceType: "Website Scanner" | "Document Upload" | "Manual Self-Declaration" | "System Assessment";
  sourceUrl?: string;
  lastChecked: string;
  notes: string;
  method: string;
}
```
Normalizes raw values:
- Numeric confidence (`0.8`) is mapped to `'HIGH'`.
- Status `'SELF_REPORTED'` is mapped to `'DETECTED'`.
- Source `'ASSESSMENT_WIZARD'` is mapped to `'Manual Self-Declaration'`.

---

## 3. Boundary Validation

Runtime defensive transformations are implemented in `TrustForge Frontend/src/services/index.ts` and `TrustForge Frontend/src/components/common/Badge.tsx`. Even if an upstream payload omits an optional property or passes an unexpected type, the interface safely displays fallback representations rather than throwing uncaught rendering exceptions.
