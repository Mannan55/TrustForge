import json
from pathlib import Path

v1_path = Path("docs/research/evaluation/datasets/rag_retrieval_benchmark.json")
with open(v1_path, "r", encoding="utf-8") as f:
    v1_data = json.load(f)

# Mapping from old 14-chunk IDs to new 83-chunk IDs
ID_MAPPING = {
    "dpdp-act-2023-section-2-0": ["dpdp-act-2023-section-2-clauses-a-to-g", "dpdp-act-2023-section-2-clauses-h-to-n", "dpdp-act-2023-section-2-clauses-o-to-s", "dpdp-act-2023-section-2-clauses-t-to-zb"],
    "dpdp-act-2023-section-4-0": ["dpdp-act-2023-section-4"],
    "dpdp-act-2023-section-5-0": ["dpdp-act-2023-section-5", "dpdp-rules-2025-rule-3"],
    "dpdp-act-2023-section-6-0": ["dpdp-act-2023-section-6-subsections-1-to-5", "dpdp-act-2023-section-6-subsections-6-to-10"],
    "dpdp-act-2023-section-7-0": ["dpdp-act-2023-section-7"],
    "dpdp-act-2023-section-8-0": [
        "dpdp-act-2023-section-8-subsections-1-to-2",
        "dpdp-act-2023-section-8-subsections-3-to-4",
        "dpdp-act-2023-section-8-subsections-5-to-6",
        "dpdp-act-2023-section-8-subsections-7-to-8",
        "dpdp-act-2023-section-8-subsections-9-to-11",
    ],
    "dpdp-act-2023-section-9-0": ["dpdp-act-2023-section-9", "dpdp-rules-2025-rule-10"],
    "dpdp-act-2023-section-10-0": ["dpdp-act-2023-section-10", "dpdp-rules-2025-rule-13"],
    "dpdp-act-2023-section-11-0": ["dpdp-act-2023-section-11", "dpdp-rules-2025-rule-14"],
    "dpdp-act-2023-section-12-0": ["dpdp-act-2023-section-12", "dpdp-rules-2025-rule-14"],
    "dpdp-act-2023-section-13-0": ["dpdp-act-2023-section-13", "dpdp-act-2023-section-8-subsections-9-to-11", "dpdp-rules-2025-rule-14"],
    "dpdp-act-2023-section-14-0": ["dpdp-act-2023-section-14", "dpdp-rules-2025-rule-14"],
    "dpdp-act-2023-section-17-0": ["dpdp-act-2023-section-17"],
}

v2_queries = []

for q in v1_data["queries"]:
    qid = q["query_id"]
    new_q = dict(q)
    
    # Refine specific queries to exact new subsection chunks
    if qid in ["rag_001", "rag_002"]:
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-6-subsections-1-to-5", "dpdp-act-2023-section-6-subsections-6-to-10"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-6-subsections-1-to-5": 2, "dpdp-act-2023-section-6-subsections-6-to-10": 1}
    elif qid in ["rag_003", "rag_004"]:
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-5", "dpdp-rules-2025-rule-3"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-5": 2, "dpdp-rules-2025-rule-3": 2}
    elif qid == "rag_010":  # security safeguards
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-8-subsections-5-to-6", "dpdp-rules-2025-rule-6"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-8-subsections-5-to-6": 2, "dpdp-rules-2025-rule-6": 2}
    elif qid == "rag_011":  # breach notification
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-8-subsections-5-to-6", "dpdp-rules-2025-rule-7"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-8-subsections-5-to-6": 2, "dpdp-rules-2025-rule-7": 2}
    elif qid == "rag_012":  # processor contracts
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-8-subsections-1-to-2"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-8-subsections-1-to-2": 2}
    elif qid == "rag_013":  # data retention / erasure
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-8-subsections-7-to-8", "dpdp-rules-2025-rule-8"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-8-subsections-7-to-8": 2, "dpdp-rules-2025-rule-8": 2}
    elif qid == "rag_023":  # definitions fiduciary / processor
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-2-clauses-h-to-n"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-2-clauses-h-to-n": 2}
    elif qid == "rag_024":  # definition digital personal data
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-2-clauses-h-to-n", "dpdp-act-2023-section-2-clauses-t-to-zb"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-2-clauses-h-to-n": 2, "dpdp-act-2023-section-2-clauses-t-to-zb": 2}
    elif qid == "rag_025":  # notice and consent
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-5", "dpdp-act-2023-section-6-subsections-1-to-5"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-5": 2, "dpdp-act-2023-section-6-subsections-1-to-5": 2}
    elif qid == "rag_026":  # consent withdrawn -> retention & processor
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-6-subsections-6-to-10", "dpdp-act-2023-section-8-subsections-7-to-8"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-6-subsections-6-to-10": 2, "dpdp-act-2023-section-8-subsections-7-to-8": 2}
    elif qid == "rag_027":  # security and breach
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-8-subsections-5-to-6", "dpdp-rules-2025-rule-6", "dpdp-rules-2025-rule-7"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-8-subsections-5-to-6": 2, "dpdp-rules-2025-rule-6": 1, "dpdp-rules-2025-rule-7": 1}
    elif qid == "rag_028":  # children & consent
        new_q["expected_chunk_ids"] = ["dpdp-act-2023-section-9", "dpdp-act-2023-section-6-subsections-1-to-5"]
        new_q["relevance_grades"] = {"dpdp-act-2023-section-9": 2, "dpdp-act-2023-section-6-subsections-1-to-5": 1}
    elif qid in ["rag_030", "rag_031"]:  # general fiduciary
        new_q["expected_chunk_ids"] = [
            "dpdp-act-2023-section-8-subsections-1-to-2",
            "dpdp-act-2023-section-8-subsections-3-to-4",
            "dpdp-act-2023-section-8-subsections-5-to-6",
            "dpdp-act-2023-section-4"
        ]
        new_q["relevance_grades"] = {
            "dpdp-act-2023-section-8-subsections-1-to-2": 2,
            "dpdp-act-2023-section-8-subsections-3-to-4": 1,
            "dpdp-act-2023-section-8-subsections-5-to-6": 1,
            "dpdp-act-2023-section-4": 2
        }
    else:
        # Default mapping using ID_MAPPING
        new_expected = []
        new_grades = {}
        for old_cid in q["expected_chunk_ids"]:
            mapped = ID_MAPPING.get(old_cid, [old_cid])
            for m in mapped:
                new_expected.append(m)
                new_grades[m] = q["relevance_grades"].get(old_cid, 2)
        new_q["expected_chunk_ids"] = new_expected
        new_q["relevance_grades"] = new_grades

    v2_queries.append(new_q)

# Add 10 new queries specifically required by Phase 3 (Section 3, Section 8, Section 16, Rules, Commencement)
new_phase3_queries = [
    {
        "query_id": "rag_036",
        "query": "Does the DPDP Act apply to processing of personal data outside India if offering goods or services to Data Principals in India?",
        "topic": "Applicability & Territorial Scope",
        "query_category": "single_section",
        "is_answerable": True,
        "expected_chunk_ids": ["dpdp-act-2023-section-3"],
        "relevance_grades": {"dpdp-act-2023-section-3": 2},
        "relevance_justification": "Section 3(b) specifies extraterritorial application to processing outside India in connection with offering goods or services in India.",
    },
    {
        "query_id": "rag_037",
        "query": "Does the DPDP Act apply to personal data processed by an individual for personal or domestic purposes?",
        "topic": "Applicability & Exemptions",
        "query_category": "single_section",
        "is_answerable": True,
        "expected_chunk_ids": ["dpdp-act-2023-section-3"],
        "relevance_grades": {"dpdp-act-2023-section-3": 2},
        "relevance_justification": "Section 3(c)(i) explicitly exempts personal data processed by an individual for personal or domestic purposes.",
    },
    {
        "query_id": "rag_038",
        "query": "What restrictions govern the transfer and processing of personal data outside India under Section 16?",
        "topic": "Cross-Border Transfers",
        "query_category": "single_section",
        "is_answerable": True,
        "expected_chunk_ids": ["dpdp-act-2023-section-16", "dpdp-rules-2025-rule-15"],
        "relevance_grades": {"dpdp-act-2023-section-16": 2, "dpdp-rules-2025-rule-15": 2},
        "relevance_justification": "Section 16 and Rule 15 govern cross-border data transfers, allowing Central Government to restrict transfers to notified countries.",
    },
    {
        "query_id": "rag_039",
        "query": "What specific reasonable security safeguards including encryption and access control are mandated under Rule 6 of DPDP Rules 2025?",
        "topic": "Security Safeguards & Rules",
        "query_category": "single_section",
        "is_answerable": True,
        "expected_chunk_ids": ["dpdp-rules-2025-rule-6", "dpdp-act-2023-section-8-subsections-5-to-6"],
        "relevance_grades": {"dpdp-rules-2025-rule-6": 2, "dpdp-act-2023-section-8-subsections-5-to-6": 1},
        "relevance_justification": "Rule 6 prescribes concrete technical and organisational safeguards including encryption, access control, and audit logs.",
    },
    {
        "query_id": "rag_040",
        "query": "What is the procedure and required information for intimating a personal data breach to the Board under Rule 7 of DPDP Rules 2025?",
        "topic": "Breach Intimation Procedure",
        "query_category": "single_section",
        "is_answerable": True,
        "expected_chunk_ids": ["dpdp-rules-2025-rule-7", "dpdp-act-2023-section-8-subsections-5-to-6"],
        "relevance_grades": {"dpdp-rules-2025-rule-7": 2, "dpdp-act-2023-section-8-subsections-5-to-6": 1},
        "relevance_justification": "Rule 7 specifies the intimation of personal data breach to the Board and affected Data Principals.",
    },
    {
        "query_id": "rag_041",
        "query": "What are the deemed purpose cessation and storage limitation periods specified under Rule 8 and the Third Schedule for e-commerce entities?",
        "topic": "Storage Limitation & Third Schedule",
        "query_category": "multi_section",
        "is_answerable": True,
        "expected_chunk_ids": ["dpdp-rules-2025-rule-8", "dpdp-rules-2025-third-schedule", "dpdp-act-2023-section-8-subsections-7-to-8"],
        "relevance_grades": {"dpdp-rules-2025-third-schedule": 2, "dpdp-rules-2025-rule-8": 2, "dpdp-act-2023-section-8-subsections-7-to-8": 1},
        "relevance_justification": "Rule 8 and Third Schedule establish a 3-year inactivity threshold for e-commerce entities to trigger mandatory deemed purpose cessation.",
    },
    {
        "query_id": "rag_042",
        "query": "What are the registration conditions and net worth requirements for Consent Managers under the DPDP Rules 2025 First Schedule?",
        "topic": "Consent Managers",
        "query_category": "single_section",
        "is_answerable": True,
        "expected_chunk_ids": ["dpdp-rules-2025-first-schedule-part-a", "dpdp-rules-2025-rule-4"],
        "relevance_grades": {"dpdp-rules-2025-first-schedule-part-a": 2, "dpdp-rules-2025-rule-4": 2},
        "relevance_justification": "First Schedule Part A and Rule 4 prescribe conditions for registration of Consent Managers including two crore rupees net worth.",
    },
    {
        "query_id": "rag_043",
        "query": "What are the publication requirements for Data Protection Officer business contact information under Section 8(9) and Rule 9?",
        "topic": "DPO Contact Publication",
        "query_category": "single_section",
        "is_answerable": True,
        "expected_chunk_ids": ["dpdp-act-2023-section-8-subsections-9-to-11", "dpdp-rules-2025-rule-9"],
        "relevance_grades": {"dpdp-act-2023-section-8-subsections-9-to-11": 2, "dpdp-rules-2025-rule-9": 2},
        "relevance_justification": "Section 8(9) and Rule 9 mandate publishing business contact information of the DPO or representative.",
    },
    {
        "query_id": "rag_044",
        "query": "Which provisions of the DPDP Act come into force immediately versus after 18 months under the commencement notification G.S.R. 843(E)?",
        "topic": "Commencement Schedule",
        "query_category": "single_section",
        "is_answerable": True,
        "expected_chunk_ids": ["dpdp-act-commencement-gsr-843e"],
        "relevance_grades": {"dpdp-act-commencement-gsr-843e": 2},
        "relevance_justification": "G.S.R. 843(E) details immediate commencement for Board provisions and 18-month phased commencement for obligations.",
    },
    {
        "query_id": "rag_045",
        "query": "What data accuracy, completeness, and consistency obligations are imposed on Data Fiduciaries under Section 8(3)?",
        "topic": "Data Accuracy Obligations",
        "query_category": "single_section",
        "is_answerable": True,
        "expected_chunk_ids": ["dpdp-act-2023-section-8-subsections-3-to-4"],
        "relevance_grades": {"dpdp-act-2023-section-8-subsections-3-to-4": 2},
        "relevance_justification": "Section 8(3) mandates completeness, accuracy, and consistency when data is used to make decisions or disclosed to another fiduciary.",
    },
]

v2_queries.extend(new_phase3_queries)

v2_benchmark = {
    "benchmark_name": "TrustForge DPDP Authoritative Legal Corpus Retrieval Benchmark (Phase 3)",
    "version": "2.0-authoritative",
    "created_at": "2026-10-09",
    "corpus_reference": {
        "total_indexed_chunks": 83,
        "source_statute": "Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023), DPDP Rules 2025 (G.S.R. 846(E)), and Commencement Notification (G.S.R. 843(E))",
        "index_path": "backend/knowledge/index/trustforge.faiss",
        "chunks_path": "backend/knowledge/index/chunks.pkl"
    },
    "total_queries": len(v2_queries),
    "queries": v2_queries
}

out_path = Path("docs/research/evaluation/datasets/rag_retrieval_benchmark_v2_authoritative.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(v2_benchmark, f, indent=2, ensure_ascii=False)

print(f"Successfully generated v2 benchmark with {len(v2_queries)} queries at {out_path}")
