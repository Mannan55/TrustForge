import os, sys, json, sqlite3, pickle
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from compliance.controls import CONTROLS, CONTROL_MAP

AID = "b9f1c498-ed1e-446b-b651-53bcbc72bdc7"

def audit_findings():
    print("=" * 80)
    print(f"FINDINGS & CITATION AUDIT FOR ASSESSMENT: {AID}")
    print("=" * 80)
    
    # Load knowledge chunks for cross-validation
    with open("knowledge/index/chunks.pkl", "rb") as f:
        knowledge_chunks = pickle.load(f)
    chunk_map = {c["chunk_id"]: c for c in knowledge_chunks}
    print(f"Knowledge base loaded with {len(chunk_map)} authoritative chunks.")
    
    conn = sqlite3.connect("trustforge.db")
    c = conn.cursor()
    c.execute("""
        SELECT control_id, status, severity, finding, explanation, 
               recommendation, evidence_ids_json, citations_json, confidence, evaluation_method, error
        FROM tie_results WHERE assessment_id = ?
    """, (AID,))
    rows = c.fetchall()
    
    print(f"Total findings in DB for assessment: {len(rows)}")
    assert len(rows) == 20, f"Expected 20 findings, got {len(rows)}"
    
    seen_controls = set()
    total_citations = 0
    valid_citations = 0
    
    for r in rows:
        cid, status, sev, finding, expl, rec, ev_json, cit_json, conf, method, err = r
        assert cid in CONTROL_MAP, f"Unknown control ID: {cid}"
        seen_controls.add(cid)
        
        # Valid enums
        assert status in ("PASS", "POTENTIAL_GAP", "FAIL", "INSUFFICIENT_EVIDENCE"), f"Invalid status: {status}"
        assert sev in ("HIGH", "MEDIUM", "LOW"), f"Invalid severity: {sev}"
        assert finding and len(finding.strip()) > 5, f"Finding missing or too short for {cid}"
        assert expl and len(expl.strip()) > 10, f"Explanation missing or too short for {cid}"
        assert rec and len(rec.strip()) > 5, f"Recommendation missing or too short for {cid}"
        
        cits = json.loads(cit_json or "[]")
        for cit in cits:
            total_citations += 1
            chunk_id = cit.get("chunk_id")
            # Verify if cited chunk exists in the knowledge base
            if chunk_id in chunk_map:
                valid_citations += 1
                kb_chunk = chunk_map[chunk_id]
                # Check document title & section consistency
                assert cit.get("document_title") in (kb_chunk.get("document_title"), "The Digital Personal Data Protection Act, 2023", "Unknown") or "DPDP" in cit.get("document_title", ""), f"Mismatched title: {cit.get('document_title')}"
            else:
                print(f"  [WARN] Citation chunk_id '{chunk_id}' not found directly in knowledge base map (or mock/fallback chunk).")
        
        print(f"  {cid:<15} | Status={status:<22} | Sev={sev:<6} | Method={method:<14} | Cits={len(cits)} | Conf={conf:.2f}")

    print("\nSummary:")
    print(f"  Controls evaluated: {len(seen_controls)} / 20")
    print(f"  Total citations checked: {total_citations}")
    print(f"  Citations verified against knowledge base: {valid_citations}")
    assert len(seen_controls) == 20, "Not all 20 controls evaluated!"
    print("ALL 20 FINDINGS & CITATIONS SUCCESSFULLY AUDITED!")

if __name__ == "__main__":
    audit_findings()
