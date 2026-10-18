import json
from pathlib import Path

corpus_path = Path("backend/knowledge/authoritative_corpus.json")
with open(corpus_path, "r", encoding="utf-8") as f:
    chunks = json.load(f)

print(f"Total chunks in authoritative corpus: {len(chunks)}")

errors = []
warnings = []
chunk_ids = set()

# Expected Act sections
expected_act_sections = [f"Section {i}" for i in range(1, 45)] + ["Preamble", "Schedule"]
found_act_sections = set()

# Expected Rules
expected_rules = [f"Rule {i}" for i in range(1, 24)] + [
    "First Schedule (Part A)", "First Schedule (Part B)",
    "Second Schedule", "Third Schedule",
    "Fourth Schedule (Part A)", "Fourth Schedule (Part B)"
]
found_rules = set()

for idx, c in enumerate(chunks):
    cid = c.get("chunk_id")
    if not cid:
        errors.append(f"Chunk at index {idx} has missing chunk_id")
    elif cid in chunk_ids:
        errors.append(f"Duplicate chunk_id: {cid}")
    chunk_ids.add(cid)

    # Document & Authority
    doc_id = c.get("document_id")
    if doc_id not in ["dpdp-act-2023", "dpdp-rules-2025", "dpdp-act-commencement-2025"]:
        errors.append(f"Unknown document_id in {cid}: {doc_id}")

    # Commencement metadata
    c_stat = c.get("commencement_status")
    eff_date = c.get("effective_date")
    enforce = c.get("enforceability")
    if c_stat not in ["IN_FORCE", "NOTIFIED_PHASED_1YR", "NOTIFIED_PHASED_18MO"]:
        errors.append(f"Invalid commencement_status in {cid}: {c_stat}")
    if eff_date not in ["2023-08-11", "2025-11-13", "2026-11-13", "2027-05-13"]:
        errors.append(f"Invalid effective_date in {cid}: {eff_date}")
    if enforce not in ["CURRENTLY_ENFORCEABLE", "PHASED_READINESS"]:
        errors.append(f"Invalid enforceability in {cid}: {enforce}")

    # Text integrity
    text = c.get("text", "")
    if len(text) < 50:
        errors.append(f"Chunk text suspiciously short (<50 chars) in {cid}: len={len(text)}")
    if "..." in text and cid in ["dpdp-act-2023-section-8", "dpdp-act-2023-section-6"]:
        warnings.append(f"Ellipsis found in {cid}")

    # Track sections/rules
    sec = c.get("section")
    if doc_id == "dpdp-act-2023":
        found_act_sections.add(sec)
    elif doc_id == "dpdp-rules-2025":
        found_rules.add(sec)

print("\n--- ACT SECTION AUDIT ---")
missing_act = [s for s in expected_act_sections if s not in found_act_sections]
print(f"Total Act Sections Found: {len(found_act_sections)} / {len(expected_act_sections)}")
if missing_act:
    print(f"Missing Act Sections: {missing_act}")
else:
    print("ALL 44 Act Sections, Preamble, and Schedule accounted for!")

print("\n--- RULES AUDIT ---")
missing_rules = [r for r in expected_rules if r not in found_rules]
print(f"Total Rules & Schedules Found: {len(found_rules)} / {len(expected_rules)}")
if missing_rules:
    print(f"Missing Rules: {missing_rules}")
else:
    print("ALL 23 Rules and 4 Schedules accounted for!")

print("\n--- VALIDATION SUMMARY ---")
print(f"Total Errors: {len(errors)}")
print(f"Total Warnings: {len(warnings)}")
for err in errors:
    print(f"  ERROR: {err}")
for w in warnings:
    print(f"  WARNING: {w}")
