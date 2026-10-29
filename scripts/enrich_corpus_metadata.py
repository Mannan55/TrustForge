"""
TrustForge Legal Corpus Enrichment & Integrity Manifest Generator (Phase 3).

Enriches the 83 statutory chunks in backend/knowledge/authoritative_corpus.json with:
  - source_document ("dpdp-act-2023" | "dpdp-rules-2025" | "dpdp-act-commencement-2025")
  - section_number (e.g. "Section 5", "Section 6", etc. or null)
  - rule_number (e.g. "Rule 3", "Rule 6", etc. or null)
  - obligation_categories (Array of C1-C10 categories supported by the chunk)
  - obligation_category (Primary C1-C10 code or "GENERAL")
  - penalty_reference (Exact statutory penalty ceiling from Schedule to DPDP Act 2023)
  - source_notification (Official Gazette reference number and notification date)
  - applicability ("DATA_FIDUCIARY" | "SIGNIFICANT_DATA_FIDUCIARY" | "DATA_PROCESSOR" | "DATA_PRINCIPAL" | "DATA_PROTECTION_BOARD" | "GENERAL")

Preserves 100% of the original legal texts, source URLs, chunk IDs, and Gazette fidelity.
Generates backend/knowledge/corpus_manifest_v2.json recording SHA-256 hashes for research provenance.
"""
from __future__ import annotations

import json
import hashlib
from pathlib import Path
from typing import Any, Dict, List

CORPUS_PATH = Path("backend/knowledge/authoritative_corpus.json")
MANIFEST_PATH = Path("backend/knowledge/corpus_manifest_v2.json")

# Grounded Gazette Citations
NOTIF_ACT_2023 = "Act No. 22 of 2023, Ministry of Law and Justice, Gazette of India Extraordinary, Part II—Section 1, dated 11 August 2023"
NOTIF_RULES_2025 = "G.S.R. 846(E), Ministry of Electronics and Information Technology, Gazette of India Extraordinary, Part II—Section 3(i), dated 13 November 2025"
NOTIF_COMMENCE_2025 = "G.S.R. 843(E), Ministry of Electronics and Information Technology, Gazette of India Extraordinary, Part II—Section 3(i), dated 13 November 2025"

# Authoritative Statutory Penalties from Section 33(1) Schedule
PENALTY_S8_5 = "Schedule Item 1: Breach in observing obligation of Data Fiduciary to take reasonable security safeguards under subsection (5) of section 8 — May extend to ₹250 crore."
PENALTY_S8_6 = "Schedule Item 2: Breach in observing obligation to give Board or affected Data Principal intimation for personal data breach under subsection (6) of section 8 — May extend to ₹200 crore."
PENALTY_S9 = "Schedule Item 3: Breach in observance of additional obligations in relation to children under section 9 — May extend to ₹200 crore."
PENALTY_S10 = "Schedule Item 4: Breach in observance of additional obligations of Significant Data Fiduciary under section 10 — May extend to ₹150 crore."
PENALTY_S15 = "Schedule Item 5: Breach in observance of duties of Data Principal under section 15 — May extend to ₹10,000."
PENALTY_RESIDUAL = "Schedule Item 7: Breach of any other provision of this Act or the rules made thereunder — May extend to ₹50 crore."
PENALTY_NONE = "Procedural / Administrative provision — No direct monetary penalty specified in the Schedule."

def map_act_chunk_metadata(chunk: Dict[str, Any]) -> Dict[str, Any]:
    sec = chunk.get("section", "")
    sec_num = None
    if sec and sec.startswith("Section "):
        sec_num = sec

    # Default values
    doc = "dpdp-act-2023"
    rule_num = None
    categories: List[str] = []
    penalty = PENALTY_RESIDUAL
    applicability = "DATA_FIDUCIARY"
    source_notif = NOTIF_ACT_2023

    if sec == "Preamble":
        categories = []
        penalty = PENALTY_NONE
        applicability = "GENERAL"
    elif sec == "Section 1":
        categories = []
        penalty = PENALTY_NONE
        applicability = "GENERAL"
    elif sec == "Section 2":
        # Definitions (Consent, Data Fiduciary, etc.)
        categories = ["C1", "C2", "C4"]
        penalty = PENALTY_NONE
        applicability = "GENERAL"
    elif sec == "Section 3":
        # Application of Act
        categories = []
        penalty = PENALTY_NONE
        applicability = "GENERAL"
    elif sec == "Section 4":
        # Grounds for processing personal data
        categories = ["C2", "C3"]
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 5":
        # Notice
        categories = ["C1"]
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 6":
        # Consent
        categories = ["C2", "C3"]
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 7":
        # Certain legitimate uses
        categories = ["C3"]
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 8":
        # General obligations of Data Fiduciary
        # Covers sub-processor oversight (s.8(2) -> C10), accuracy, safeguards (s.8(5) -> C4), breach (s.8(6) -> C5), retention (s.8(7) -> C6), DPO (s.8(9) -> C7)
        categories = ["C4", "C5", "C6", "C7", "C10"]
        penalty = f"{PENALTY_S8_5} / {PENALTY_S8_6} / {PENALTY_RESIDUAL}"
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 9":
        # Processing of personal data of children
        categories = ["C9"]
        penalty = PENALTY_S9
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 10":
        # Additional obligations of Significant Data Fiduciary
        categories = ["C4", "C7", "C8"]
        penalty = PENALTY_S10
        applicability = "SIGNIFICANT_DATA_FIDUCIARY"
    elif sec == "Section 11":
        # Right to access information
        categories = ["C8"]
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 12":
        # Right to correction and erasure
        categories = ["C6", "C8"]
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 13":
        # Right of grievance redressal
        categories = ["C7", "C8"]
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 14":
        # Right to nominate
        categories = ["C8"]
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 15":
        # Duties of Data Principal
        categories = []
        penalty = PENALTY_S15
        applicability = "DATA_PRINCIPAL"
    elif sec == "Section 16":
        # Processing outside India (Cross-border transfer)
        categories = ["C10"]
        applicability = "DATA_FIDUCIARY"
    elif sec == "Section 17":
        # Exemptions
        categories = []
        penalty = PENALTY_NONE
        applicability = "GENERAL"
    elif sec in ["Section 18", "Section 19", "Section 20", "Section 21", "Section 22", "Section 23", "Section 24", "Section 25", "Section 26"]:
        # Board Establishment & Composition
        categories = []
        penalty = PENALTY_NONE
        applicability = "DATA_PROTECTION_BOARD"
    elif sec in ["Section 27", "Section 28", "Section 29", "Section 30", "Section 31", "Section 32", "Section 33", "Section 34"]:
        # Board Hearings, Penalties, Appellate Tribunal, ADR
        categories = []
        penalty = PENALTY_NONE
        applicability = "DATA_PROTECTION_BOARD"
    elif sec in ["Section 35", "Section 36", "Section 37"]:
        # Central Government Powers
        categories = []
        penalty = PENALTY_NONE
        applicability = "GENERAL"
    elif sec in ["Section 38", "Section 39", "Section 40", "Section 41", "Section 42", "Section 43"]:
        # Miscellaneous, Rule-making powers
        categories = []
        penalty = PENALTY_NONE
        applicability = "GENERAL"
    elif sec == "Section 44":
        # Repeal and savings & Penalty Schedule
        categories = ["C4", "C5", "C9"]
        penalty = f"{PENALTY_S8_5} | {PENALTY_S8_6} | {PENALTY_S9} | {PENALTY_RESIDUAL}"
        applicability = "GENERAL"

    primary_cat = categories[0] if categories else "GENERAL"

    return {
        "source_document": doc,
        "section_number": sec_num,
        "rule_number": rule_num,
        "obligation_category": primary_cat,
        "obligation_categories": categories,
        "penalty_reference": penalty,
        "source_notification": source_notif,
        "applicability": applicability,
    }


def map_rule_chunk_metadata(chunk: Dict[str, Any]) -> Dict[str, Any]:
    sec = chunk.get("section", "")
    rule_num = None
    if sec and sec.startswith("Rule "):
        rule_num = sec

    doc = "dpdp-rules-2025"
    sec_num = None
    categories: List[str] = []
    penalty = PENALTY_RESIDUAL
    applicability = "DATA_FIDUCIARY"
    source_notif = NOTIF_RULES_2025

    if sec == "Rule 1":
        categories = []
        penalty = PENALTY_NONE
        applicability = "GENERAL"
    elif sec == "Rule 2":
        categories = ["C1", "C2", "C4"]
        penalty = PENALTY_NONE
        applicability = "GENERAL"
    elif sec == "Rule 3":
        # Notice given by Data Fiduciary
        categories = ["C1"]
        sec_num = "Section 5"
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 4":
        # Consent Manager registration & obligations
        categories = ["C2"]
        sec_num = "Section 6"
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 5":
        # Processing for subsidies & services
        categories = ["C3"]
        sec_num = "Section 7"
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 6":
        # Reasonable security safeguards (Encryption, access control, audit)
        categories = ["C4"]
        sec_num = "Section 8(5)"
        penalty = PENALTY_S8_5
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 7":
        # Intimation of personal data breach
        categories = ["C5"]
        sec_num = "Section 8(6)"
        penalty = PENALTY_S8_6
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 8":
        # Retention and purpose cessation
        categories = ["C6"]
        sec_num = "Section 8(7)"
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 9":
        # Contact person / DPO publication
        categories = ["C7"]
        sec_num = "Section 8(9)"
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 10":
        # Verifiable consent for child
        categories = ["C9"]
        sec_num = "Section 9"
        penalty = PENALTY_S9
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 11":
        # Verifiable consent for disability / guardian
        categories = ["C9"]
        sec_num = "Section 9"
        penalty = PENALTY_S9
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 12":
        # Exemptions for child data
        categories = ["C9"]
        sec_num = "Section 9"
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 13":
        # Additional obligations of SDF
        categories = ["C4", "C7", "C8"]
        sec_num = "Section 10"
        penalty = PENALTY_S10
        applicability = "SIGNIFICANT_DATA_FIDUCIARY"
    elif sec == "Rule 14":
        # Rights of Data Principals
        categories = ["C8"]
        sec_num = "Sections 11–14"
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 15":
        # Cross-border data transfers
        categories = ["C10"]
        sec_num = "Section 16"
        applicability = "DATA_FIDUCIARY"
    elif sec == "Rule 16":
        # Research exemptions
        categories = []
        applicability = "GENERAL"
    elif sec in [f"Rule {i}" for i in range(17, 24)]:
        # Board governance, functioning as digital office, appeals
        categories = []
        penalty = PENALTY_NONE
        applicability = "DATA_PROTECTION_BOARD"
    elif "First Schedule" in sec:
        categories = ["C2"]
        sec_num = "Section 6"
        applicability = "DATA_FIDUCIARY"
    elif "Second Schedule" in sec:
        categories = []
        applicability = "GENERAL"
    elif "Third Schedule" in sec:
        categories = ["C6"]
        sec_num = "Section 8(7)"
        applicability = "DATA_FIDUCIARY"
    elif "Fourth Schedule" in sec:
        categories = ["C9"]
        sec_num = "Section 9"
        penalty = PENALTY_S9
        applicability = "DATA_FIDUCIARY"

    primary_cat = categories[0] if categories else "GENERAL"

    return {
        "source_document": doc,
        "section_number": sec_num,
        "rule_number": rule_num,
        "obligation_category": primary_cat,
        "obligation_categories": categories,
        "penalty_reference": penalty,
        "source_notification": source_notif,
        "applicability": applicability,
    }


def map_commencement_chunk_metadata(chunk: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "source_document": "dpdp-act-commencement-2025",
        "section_number": None,
        "rule_number": None,
        "obligation_category": "GENERAL",
        "obligation_categories": [],
        "penalty_reference": PENALTY_NONE,
        "source_notification": NOTIF_COMMENCE_2025,
        "applicability": "GENERAL",
    }


def main():
    raw_bytes = CORPUS_PATH.read_bytes()
    prev_hash = hashlib.sha256(raw_bytes).hexdigest()
    chunks = json.loads(raw_bytes.decode("utf-8"))

    print(f"[CorpusEnricher] Loaded {len(chunks)} chunks.")
    print(f"[CorpusEnricher] Previous SHA-256: {prev_hash}")

    enriched_chunks = []
    category_counts = {f"C{i}": 0 for i in range(1, 11)}
    category_counts["GENERAL"] = 0

    for c in chunks:
        doc_id = c.get("document_id", "")
        if doc_id == "dpdp-act-2023":
            meta = map_act_chunk_metadata(c)
        elif doc_id == "dpdp-rules-2025":
            meta = map_rule_chunk_metadata(c)
        elif doc_id == "dpdp-act-commencement-2025":
            meta = map_commencement_chunk_metadata(c)
        else:
            meta = {
                "source_document": doc_id,
                "section_number": c.get("section"),
                "rule_number": None,
                "obligation_category": "GENERAL",
                "obligation_categories": [],
                "penalty_reference": PENALTY_NONE,
                "source_notification": NOTIF_ACT_2023,
                "applicability": "GENERAL",
            }

        # Merge with existing chunk
        merged = {**c, **meta}
        enriched_chunks.append(merged)

        # Track counts
        for cat in meta["obligation_categories"]:
            if cat in category_counts:
                category_counts[cat] += 1
        if not meta["obligation_categories"]:
            category_counts["GENERAL"] += 1

    # Write enriched corpus
    enriched_json = json.dumps(enriched_chunks, indent=2, ensure_ascii=False)
    CORPUS_PATH.write_text(enriched_json, encoding="utf-8")
    new_bytes = CORPUS_PATH.read_bytes()
    new_hash = hashlib.sha256(new_bytes).hexdigest()

    print(f"[CorpusEnricher] Enriched corpus saved. New SHA-256: {new_hash}")
    print("[CorpusEnricher] Category distributions:")
    for cat, count in category_counts.items():
        print(f"  {cat}: {count} chunks")

    # Generate Manifest v2
    manifest = {
        "manifest_version": "2.0.0-phase3",
        "generated_at": "2026-10-28T14:45:00Z",
        "taxonomy_framework": "DPDP-C1-C10-PROTIVITI-2025",
        "total_chunks": len(enriched_chunks),
        "previous_corpus_sha256": prev_hash,
        "current_corpus_sha256": new_hash,
        "statutory_sources": [
            {
                "document_id": "dpdp-act-2023",
                "title": "The Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)",
                "authority": "Ministry of Law and Justice / MeitY",
                "gazette_date": "2023-08-11",
                "enforceability": "CURRENTLY_ENFORCEABLE",
                "chunks_count": 53
            },
            {
                "document_id": "dpdp-rules-2025",
                "title": "The Digital Personal Data Protection Rules, 2025 (G.S.R. 846(E))",
                "authority": "Ministry of Electronics and Information Technology",
                "gazette_date": "2025-11-13",
                "enforceability": "NOTIFIED_PROCEDURAL_RULES",
                "chunks_count": 29
            },
            {
                "document_id": "dpdp-act-commencement-2025",
                "title": "Commencement Notification for DPDP Act, 2023 (G.S.R. 843(E))",
                "authority": "Ministry of Electronics and Information Technology",
                "gazette_date": "2025-11-13",
                "enforceability": "COMMENCEMENT_ORDER",
                "chunks_count": 1
            }
        ],
        "category_chunk_distribution": category_counts,
        "mandatory_fields_present": [
            "source_document",
            "section_number",
            "rule_number",
            "obligation_category",
            "obligation_categories",
            "penalty_reference",
            "source_notification",
            "applicability"
        ]
    }

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[CorpusEnricher] Manifest saved to {MANIFEST_PATH}")

if __name__ == "__main__":
    main()
