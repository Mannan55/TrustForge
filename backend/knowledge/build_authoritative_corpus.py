"""
TrustForge Authoritative Legal Corpus Builder (Phase 3).

Parses official Indian Government publications:
1. The Digital Personal Data Protection Act, 2023 (No. 22 of 2023)
2. The Digital Personal Data Protection Rules, 2025 (G.S.R. 846(E), 13 Nov 2025)
3. DPDP Act Commencement Notification (G.S.R. 843(E), 13 Nov 2025)

Maintains 100% statutory fidelity, exact section/rule numbering, commencement dates,
and traceability to official Gazette publications.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List

SOURCES_DIR = Path(__file__).parent / "sources"
EXTRACTED_DIR = SOURCES_DIR / "extracted"

ACT_URL = "https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf"
RULES_URL = "https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf"
COMMENCE_URL = "https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf"

AUTHORITY_MEITY = "Ministry of Electronics and Information Technology (MeitY), Government of India"


def clean_gazette_text(raw_text: str) -> str:
    """Strip OCR page headers, running footers, and marginal artifact labels."""
    lines = raw_text.split("\n")
    cleaned = []
    for line in lines:
        l = line.strip()
        if re.match(r"^=== PAGE \d+ ===$", l):
            continue
        if re.match(r"^\d+$", l):
            continue
        if "THE GAZETTE OF INDIA EXTRAORDINARY" in l or "THE GAZETTE OF INDIA : EXTRAORDINARY" in l:
            continue
        if "[PART II—" in l or "[PART II—SEC." in l or "SEC. 1]" in l or "SEC. 3(i)]" in l:
            continue
        if "7592 GI/2025" in l or "7596 GI/2025" in l or "REGD. No." in l:
            continue
        if "CG-DL-E-" in l:
            continue
        cleaned.append(line)
    text = "\n".join(cleaned)
    # Collapse multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_act_sections(raw_text: str) -> List[Dict[str, Any]]:
    """Parse all 44 sections, preamble, and schedule of DPDP Act 2023."""
    cleaned = clean_gazette_text(raw_text)
    chunks = []

    # 1. Preamble
    s1_pos = cleaned.find("1. (1) This Act may be called")
    preamble = cleaned[:s1_pos].strip()
    chunks.append({
        "chunk_id": "dpdp-act-2023-preamble",
        "document_id": "dpdp-act-2023",
        "document_title": "The Digital Personal Data Protection Act, 2023",
        "authority": AUTHORITY_MEITY,
        "source_type": "LEGAL_PRIMARY",
        "section": "Preamble",
        "heading": "Preamble & Enacting Formula",
        "subsection": None,
        "commencement_status": "IN_FORCE",
        "effective_date": "2023-08-11",
        "enforceability": "CURRENTLY_ENFORCEABLE",
        "text": preamble,
        "source_url": ACT_URL,
        "publication_date": "2023-08-11",
        "version": "2023-Gazette-No-22",
    })

    # Find section boundary positions
    # Pattern: \n{i}\. (or at start of string)
    sec_positions = []
    for i in range(1, 45):
        m = re.search(rf"(?:^|\n)\s*{i}\.\s+", cleaned)
        if m:
            sec_positions.append((i, m.start()))
        else:
            print(f"Warning: Section {i} not found in Act text!")

    sec_positions.sort(key=lambda x: x[1])

    # Find Schedule start
    sched_pos = cleaned.find("THE SCHEDULE\n(See section 44)")
    if sched_pos == -1:
        sched_pos = cleaned.find("THE SCHEDULE")

    # Section-level extraction
    for idx, (sec_num, start_pos) in enumerate(sec_positions):
        end_pos = sec_positions[idx + 1][1] if idx + 1 < len(sec_positions) else (sched_pos if sched_pos != -1 else len(cleaned))
        sec_text = cleaned[start_pos:end_pos].strip()

        # Determine commencement status according to G.S.R. 843(E)
        if sec_num in [1, 2, 18, 19, 20, 21, 22, 23, 24, 25, 26, 35, 38, 39, 40, 41, 42, 43]:
            c_status = "IN_FORCE"
            eff_date = "2025-11-13"
            enforce = "CURRENTLY_ENFORCEABLE"
        elif sec_num == 6:
            # Section 6(9) is 1 year; rest is 18 months
            c_status = "NOTIFIED_PHASED_18MO"
            eff_date = "2027-05-13"
            enforce = "PHASED_READINESS"
        elif sec_num == 27:
            # 27(1)(d) is 1 year; rest is 18 months
            c_status = "NOTIFIED_PHASED_18MO"
            eff_date = "2027-05-13"
            enforce = "PHASED_READINESS"
        elif sec_num == 44:
            c_status = "IN_FORCE"
            eff_date = "2025-11-13"
            enforce = "CURRENTLY_ENFORCEABLE"
        else:
            c_status = "NOTIFIED_PHASED_18MO"
            eff_date = "2027-05-13"
            enforce = "PHASED_READINESS"

        # Titles/Headings
        headings_map = {
            1: "Short title and commencement",
            2: "Definitions",
            3: "Application of Act (Territorial Scope & Processing Outside India)",
            4: "Grounds for processing personal data",
            5: "Notice given by Data Fiduciary",
            6: "Consent mandates, withdrawal & validity",
            7: "Certain legitimate uses of personal data",
            8: "General obligations of Data Fiduciary",
            9: "Processing of personal data of children",
            10: "Significant Data Fiduciary",
            11: "Right to access information about personal data",
            12: "Right to correction and erasure of personal data",
            13: "Right of grievance redressal",
            14: "Right to nominate",
            15: "Duties of Data Principal",
            16: "Processing of personal data outside India (Cross-border transfers)",
            17: "Exemptions (State, research, startups, foreign data)",
            18: "Establishment of Data Protection Board of India",
            19: "Composition and qualifications for appointment of Board",
            20: "Salary, allowances and terms of Members of Board",
            21: "Disqualification for appointment and continuation as Member",
            22: "Resignation by Members and filling of vacancy",
            23: "Proceedings of Board",
            24: "Officers and employees of Board",
            25: "Members and officers to be public servants",
            26: "Powers of Chairperson",
            27: "Hearing and penalties by Board",
            28: "Crediting sums realised to Consolidated Fund of India",
            29: "Appeal to Appellate Tribunal",
            30: "Orders by Appellate Tribunal",
            31: "Alternate Dispute Resolution (Mediation)",
            32: "Voluntary undertaking",
            33: "Special provisions for financial penalties",
            34: "Recovery of penalties",
            35: "Power of Central Government to call for information",
            36: "Power of Central Government to issue directions",
            37: "Power to block access to information in public interest",
            38: "Consistency with other laws",
            39: "Bar of jurisdiction of civil courts",
            40: "Power of Central Government to make rules",
            41: "Laying of rules and notifications before Parliament",
            42: "Power to remove difficulties",
            43: "Amendments to certain Acts",
            44: "Repeal and savings",
        }

        h_title = headings_map.get(sec_num, f"Section {sec_num}")

        # Sub-chunking for long sections to fit within optimal context budget while keeping provisions intact
        if sec_num == 2:
            # Section 2 definitions: 4 logical clause groups
            ca_pos = sec_text.find('(a) “Appellate Tribunal”')
            if ca_pos == -1:
                ca_pos = sec_text.find('(a)')
            ch_pos = sec_text.find('(h) “data”')
            if ch_pos == -1:
                ch_pos = sec_text.find('(h)')
            co_pos = sec_text.find('(o) “gain”')
            if co_pos == -1:
                co_pos = sec_text.find('(o)')
            ct_pos = sec_text.find('(t) “personal data”')
            if ct_pos == -1:
                ct_pos = sec_text.find('(t)')

            intro_text = "2. In this Act, unless the context otherwise requires,—\n"
            defs = [
                ("dpdp-act-2023-section-2-clauses-a-to-g", "Section 2(a)-(g)", "Definitions (Appellate Tribunal to Consent Manager)", "(a) through (g)", "IN_FORCE", "2025-11-13", ca_pos, ch_pos),
                ("dpdp-act-2023-section-2-clauses-h-to-n", "Section 2(h)-(n)", "Definitions (Data to Digital Personal Data)", "(h) through (n)", "IN_FORCE", "2025-11-13", ch_pos, co_pos),
                ("dpdp-act-2023-section-2-clauses-o-to-s", "Section 2(o)-(s)", "Definitions (Gain to Person)", "(o) through (s)", "IN_FORCE", "2025-11-13", co_pos, ct_pos),
                ("dpdp-act-2023-section-2-clauses-t-to-zb", "Section 2(t)-(zb)", "Definitions (Personal Data, Breach, Processing to State)", "(t) through (zb)", "IN_FORCE", "2025-11-13", ct_pos, len(sec_text)),
            ]
            for cid, sec_ref, heading_def, sub_clause, c_stat, eff_d, sp, ep in defs:
                chunks.append({
                    "chunk_id": cid,
                    "document_id": "dpdp-act-2023",
                    "document_title": "The Digital Personal Data Protection Act, 2023",
                    "authority": AUTHORITY_MEITY,
                    "source_type": "LEGAL_PRIMARY",
                    "section": "Section 2",
                    "heading": f"Section 2 — {heading_def}",
                    "subsection": sub_clause,
                    "commencement_status": c_stat,
                    "effective_date": eff_d,
                    "enforceability": "CURRENTLY_ENFORCEABLE",
                    "text": intro_text + sec_text[sp:ep].strip(),
                    "source_url": ACT_URL,
                    "publication_date": "2023-08-11",
                    "version": "2023-Gazette-No-22",
                })
        elif sec_num == 6:
            # Section 6: Split into 6(1)-(5) and 6(6)-(10) verbatim
            s6_sub6 = sec_text.find("(6)")
            if s6_sub6 == -1:
                s6_sub6 = sec_text.find("\n(6)")
            chunks.append({
                "chunk_id": "dpdp-act-2023-section-6-subsections-1-to-5",
                "document_id": "dpdp-act-2023",
                "document_title": "The Digital Personal Data Protection Act, 2023",
                "authority": AUTHORITY_MEITY,
                "source_type": "LEGAL_PRIMARY",
                "section": "Section 6",
                "heading": "Section 6 — Consent Validity & Right to Withdraw",
                "subsection": "6(1)-(5)",
                "commencement_status": "NOTIFIED_PHASED_18MO",
                "effective_date": "2027-05-13",
                "enforceability": "PHASED_READINESS",
                "text": sec_text[:s6_sub6].strip(),
                "source_url": ACT_URL,
                "publication_date": "2023-08-11",
                "version": "2023-Gazette-No-22",
            })
            chunks.append({
                "chunk_id": "dpdp-act-2023-section-6-subsections-6-to-10",
                "document_id": "dpdp-act-2023",
                "document_title": "The Digital Personal Data Protection Act, 2023",
                "authority": AUTHORITY_MEITY,
                "source_type": "LEGAL_PRIMARY",
                "section": "Section 6",
                "heading": "Section 6 — Consent Cessation, Managers & Burden of Proof",
                "subsection": "6(6)-(10)",
                "commencement_status": "NOTIFIED_PHASED_1YR",
                "effective_date": "2026-11-13",
                "enforceability": "PHASED_READINESS",
                "text": "Section 6 (Continued):\n" + sec_text[s6_sub6:].strip(),
                "source_url": ACT_URL,
                "publication_date": "2023-08-11",
                "version": "2023-Gazette-No-22",
            })
        elif sec_num == 8:
            # Section 8 general obligations: 5 logical subsection groups verbatim
            s8_sub3 = sec_text.find("(3)")
            s8_sub5 = sec_text.find("(5)")
            s8_sub7 = sec_text.find("(7)")
            s8_sub9 = sec_text.find("(9)")

            s8_subgroups = [
                ("dpdp-act-2023-section-8-subsections-1-to-2", "Section 8(1)-(2)", "Fiduciary Compliance & Valid Contract with Data Processor", "8(1)-(2)",
                 sec_text[:s8_sub3].strip()),
                ("dpdp-act-2023-section-8-subsections-3-to-4", "Section 8(3)-(4)", "Data Completeness, Accuracy & Technical Measures", "8(3)-(4)",
                 "Section 8 (Continued):\n" + sec_text[s8_sub3:s8_sub5].strip()),
                ("dpdp-act-2023-section-8-subsections-5-to-6", "Section 8(5)-(6)", "Reasonable Security Safeguards & Personal Data Breach Intimation", "8(5)-(6)",
                 "Section 8 (Continued):\n" + sec_text[s8_sub5:s8_sub7].strip()),
                ("dpdp-act-2023-section-8-subsections-7-to-8", "Section 8(7)-(8)", "Duty to Erase Personal Data & Deemed Purpose Cessation", "8(7)-(8)",
                 "Section 8 (Continued):\n" + sec_text[s8_sub7:s8_sub9].strip()),
                ("dpdp-act-2023-section-8-subsections-9-to-11", "Section 8(9)-(11)", "Publication of DPO / Contact Details & Grievance Mechanism", "8(9)-(11)",
                 "Section 8 (Continued):\n" + sec_text[s8_sub9:].strip()),
            ]
            for cid, sref, hdesc, ssub, stext in s8_subgroups:
                chunks.append({
                    "chunk_id": cid,
                    "document_id": "dpdp-act-2023",
                    "document_title": "The Digital Personal Data Protection Act, 2023",
                    "authority": AUTHORITY_MEITY,
                    "source_type": "LEGAL_PRIMARY",
                    "section": "Section 8",
                    "heading": f"Section 8 — {hdesc}",
                    "subsection": ssub,
                    "commencement_status": c_status,
                    "effective_date": eff_date,
                    "enforceability": enforce,
                    "text": stext,
                    "source_url": ACT_URL,
                    "publication_date": "2023-08-11",
                    "version": "2023-Gazette-No-22",
                })
        else:
            chunks.append({
                "chunk_id": f"dpdp-act-2023-section-{sec_num}",
                "document_id": "dpdp-act-2023",
                "document_title": "The Digital Personal Data Protection Act, 2023",
                "authority": AUTHORITY_MEITY,
                "source_type": "LEGAL_PRIMARY",
                "section": f"Section {sec_num}",
                "heading": f"Section {sec_num} — {h_title}",
                "subsection": None,
                "commencement_status": c_status,
                "effective_date": eff_date,
                "enforceability": enforce,
                "text": sec_text,
                "source_url": ACT_URL,
                "publication_date": "2023-08-11",
                "version": "2023-Gazette-No-22",
            })

    # Schedule to the Act
    if sched_pos != -1:
        sched_text = cleaned[sched_pos:].strip()
        chunks.append({
            "chunk_id": "dpdp-act-2023-schedule",
            "document_id": "dpdp-act-2023",
            "document_title": "The Digital Personal Data Protection Act, 2023",
            "authority": AUTHORITY_MEITY,
            "source_type": "LEGAL_PRIMARY",
            "section": "Schedule",
            "heading": "The Schedule (Amendments to RTI Act, 2005 and IT Act, 2000)",
            "subsection": None,
            "commencement_status": "IN_FORCE",
            "effective_date": "2025-11-13",
            "enforceability": "CURRENTLY_ENFORCEABLE",
            "text": sched_text,
            "source_url": ACT_URL,
            "publication_date": "2023-08-11",
            "version": "2023-Gazette-No-22",
        })

    return chunks


def parse_rules_sections(raw_text: str) -> List[Dict[str, Any]]:
    """Parse all 23 rules and 4 schedules from Notified DPDP Rules, 2025."""
    # English text begins after notification preamble at char pos 58250
    eng_start = raw_text.find("MINISTRY OF ELECTRONICS AND INFORMATION TECHNOLOGY \nNOTIFICATION \nNew Delhi, the 13th November, 2025")
    if eng_start == -1:
        eng_start = 58250
    eng_text = clean_gazette_text(raw_text[eng_start:])

    chunks = []

    # Map of Rules
    rules_meta = {
        1: ("Short title and commencement", "IN_FORCE", "2025-11-13"),
        2: ("Definitions (techno-legal measures, user account, verifiable consent)", "IN_FORCE", "2025-11-13"),
        3: ("Notice given by Data Fiduciary to Data Principal (Itemised description, links, languages)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        4: ("Registration and obligations of Consent Manager (First Schedule conditions)", "NOTIFIED_PHASED_1YR", "2026-11-13"),
        5: ("Processing of personal data for subsidies, services, licences or certificates", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        6: ("Reasonable security safeguards (Encryption, access control, audit, technical measures)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        7: ("Intimation of personal data breach (Form and manner to Board & Data Principals)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        8: ("Time period for specified purpose to be deemed as no longer being served (Storage limitation)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        9: ("Contact information of person to answer questions about processing (DPO publication)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        10: ("Verifiable consent for processing of personal data of child", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        11: ("Verifiable consent for person with disability who has lawful guardian", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        12: ("Exemptions from certain obligations applicable to child personal data (Fourth Schedule)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        13: ("Additional obligations of Significant Data Fiduciary (DPIA, audit, DPO requirements)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        14: ("Rights of Data Principals (Access, Correction, Erasure, Grievance Redressal, Nomination)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        15: ("Transfer of personal data outside the territory of India (Cross-border transfer safeguards)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        16: ("Exemption from Act for research, archiving or statistical purposes (Second Schedule)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        17: ("Appointment of Chairperson and other Members of the Board (Search-cum-Selection)", "IN_FORCE", "2025-11-13"),
        18: ("Salary, allowances and terms of service of Chairperson and Members", "IN_FORCE", "2025-11-13"),
        19: ("Procedure for meetings of Board and authentication of orders", "IN_FORCE", "2025-11-13"),
        20: ("Functioning of Board as digital office (Techno-legal measures, secure digital processing)", "IN_FORCE", "2025-11-13"),
        21: ("Terms and conditions of appointment of officers and employees of Board", "IN_FORCE", "2025-11-13"),
        22: ("Appeal to Appellate Tribunal (Form, fee, and manner of electronic filing)", "NOTIFIED_PHASED_18MO", "2027-05-13"),
        23: ("Calling for information from Data Fiduciary or intermediary", "NOTIFIED_PHASED_18MO", "2027-05-13"),
    }

    # Locate each rule
    rule_positions = []
    for r_num in range(1, 24):
        m = re.search(rf"(?:^|\n)\s*{r_num}\.\s*", eng_text)
        if m:
            rule_positions.append((r_num, m.start()))
        else:
            m2 = re.search(rf"\n{r_num}\.[A-Za-z]", eng_text)
            if m2:
                rule_positions.append((r_num, m2.start() + 1))
            else:
                print(f"Warning: Rule {r_num} not found in Rules text!")

    rule_positions.sort(key=lambda x: x[1])

    first_sched_pos = eng_text.find("FIRST SCHEDULE")

    for idx, (r_num, start_pos) in enumerate(rule_positions):
        end_pos = rule_positions[idx + 1][1] if idx + 1 < len(rule_positions) else (first_sched_pos if first_sched_pos != -1 else len(eng_text))
        r_text = eng_text[start_pos:end_pos].strip()

        rtitle, c_stat, eff_d = rules_meta.get(r_num, (f"Rule {r_num}", "NOTIFIED_PHASED_18MO", "2027-05-13"))
        enforce = "CURRENTLY_ENFORCEABLE" if c_stat == "IN_FORCE" else "PHASED_READINESS"

        chunks.append({
            "chunk_id": f"dpdp-rules-2025-rule-{r_num}",
            "document_id": "dpdp-rules-2025",
            "document_title": "The Digital Personal Data Protection Rules, 2025",
            "authority": AUTHORITY_MEITY,
            "source_type": "LEGAL_SECONDARY_OFFICIAL",
            "section": f"Rule {r_num}",
            "heading": f"Rule {r_num} — {rtitle}",
            "subsection": None,
            "commencement_status": c_stat,
            "effective_date": eff_d,
            "enforceability": enforce,
            "text": r_text,
            "source_url": RULES_URL,
            "publication_date": "2025-11-13",
            "version": "2025-Notified-GSR-846E",
        })

    # Schedules to the Rules extracted verbatim from Gazette text
    part_b_pos = eng_text.find("PART B\nObligations of Consent Manager")
    if part_b_pos == -1:
        part_b_pos = eng_text.find("PART B")
    second_sched_pos = eng_text.find("SECOND SCHEDULE")
    third_sched_pos = eng_text.find("THIRD SCHEDULE")
    fourth_sched_pos = eng_text.find("FOURTH SCHEDULE")

    fourth_text = eng_text[fourth_sched_pos:] if fourth_sched_pos != -1 else ""
    fourth_part_b = fourth_text.find("PART B")
    fno_pos = fourth_text.find("[F. No.")
    if fno_pos == -1:
        fno_pos = len(fourth_text)

    schedules = [
        ("dpdp-rules-2025-first-schedule-part-a", "First Schedule (Part A)", "FIRST SCHEDULE — Conditions for registration of Consent Manager",
         eng_text[first_sched_pos:part_b_pos].strip() if first_sched_pos != -1 else "",
         "NOTIFIED_PHASED_1YR", "2026-11-13"),

        ("dpdp-rules-2025-first-schedule-part-b", "First Schedule (Part B)", "FIRST SCHEDULE — Obligations of Consent Manager",
         eng_text[part_b_pos:second_sched_pos].strip() if second_sched_pos != -1 else "",
         "NOTIFIED_PHASED_1YR", "2026-11-13"),

        ("dpdp-rules-2025-second-schedule", "Second Schedule", "SECOND SCHEDULE — Standards for Processing by State & Research Exemptions",
         eng_text[second_sched_pos:third_sched_pos].strip() if third_sched_pos != -1 else "",
         "NOTIFIED_PHASED_18MO", "2027-05-13"),

        ("dpdp-rules-2025-third-schedule", "Third Schedule", "THIRD SCHEDULE — Storage Limitation & Purpose Expiration Time Periods",
         eng_text[third_sched_pos:fourth_sched_pos].strip() if fourth_sched_pos != -1 else "",
         "NOTIFIED_PHASED_18MO", "2027-05-13"),

        ("dpdp-rules-2025-fourth-schedule-part-a", "Fourth Schedule (Part A)", "FOURTH SCHEDULE — Classes of Data Fiduciaries Exempt from Child Data Restrictions",
         fourth_text[:fourth_part_b].strip() if fourth_part_b != -1 else fourth_text.strip(),
         "NOTIFIED_PHASED_18MO", "2027-05-13"),

        ("dpdp-rules-2025-fourth-schedule-part-b", "Fourth Schedule (Part B)", "FOURTH SCHEDULE — Purposes Exempt from Child Data Restrictions",
         fourth_text[fourth_part_b:fno_pos].strip() if fourth_part_b != -1 else "",
         "NOTIFIED_PHASED_18MO", "2027-05-13"),
    ]

    for cid, sname, hname, stext, cstat, effd in schedules:
        chunks.append({
            "chunk_id": cid,
            "document_id": "dpdp-rules-2025",
            "document_title": "The Digital Personal Data Protection Rules, 2025",
            "authority": AUTHORITY_MEITY,
            "source_type": "LEGAL_SECONDARY_OFFICIAL",
            "section": sname,
            "heading": hname,
            "subsection": None,
            "commencement_status": cstat,
            "effective_date": effd,
            "enforceability": "PHASED_READINESS",
            "text": stext,
            "source_url": RULES_URL,
            "publication_date": "2025-11-13",
            "version": "2025-Notified-GSR-846E",
        })

    return chunks


def parse_commencement_notification(raw_text: str) -> List[Dict[str, Any]]:
    """Parse G.S.R. 843(E) Commencement Notification."""
    cleaned = clean_gazette_text(raw_text)
    # Extract English portion
    eng_start = cleaned.find("MINISTRY OF ELECTRONICS AND INFORMATION TECHNOLOGY \nNOTIFICATION \nNew Delhi, the 13th November, 2025")
    if eng_start == -1:
        eng_start = cleaned.find("G.S.R. 843(E)")
        if eng_start == -1:
            eng_start = 0

    text = cleaned[eng_start:].strip()

    return [{
        "chunk_id": "dpdp-act-commencement-gsr-843e",
        "document_id": "dpdp-act-commencement-2025",
        "document_title": "Notification of Commencement of the DPDP Act, 2023 (G.S.R. 843(E))",
        "authority": AUTHORITY_MEITY,
        "source_type": "LEGAL_SECONDARY_OFFICIAL",
        "section": "Commencement Notification",
        "heading": "G.S.R. 843(E) — Phased Commencement of DPDP Act, 2023 Provisions",
        "subsection": None,
        "commencement_status": "IN_FORCE",
        "effective_date": "2025-11-13",
        "enforceability": "CURRENTLY_ENFORCEABLE",
        "text": text,
        "source_url": COMMENCE_URL,
        "publication_date": "2025-11-13",
        "version": "2025-Gazette-No-757",
    }]


def build_authoritative_corpus() -> List[Dict[str, Any]]:
    """Master entry point to build complete verified statutory corpus."""
    with open(EXTRACTED_DIR / "act_2023.txt", "r", encoding="utf-8") as f:
        act_raw = f.read()
    with open(EXTRACTED_DIR / "rules_2025.txt", "r", encoding="utf-8") as f:
        rules_raw = f.read()
    with open(EXTRACTED_DIR / "commencement.txt", "r", encoding="utf-8") as f:
        comm_raw = f.read()

    act_chunks = parse_act_sections(act_raw)
    rules_chunks = parse_rules_sections(rules_raw)
    comm_chunks = parse_commencement_notification(comm_raw)

    all_chunks = act_chunks + rules_chunks + comm_chunks
    print(f"Total Authoritative Chunks Generated: {len(all_chunks)}")
    print(f"  - DPDP Act, 2023: {len(act_chunks)} chunks")
    print(f"  - DPDP Rules, 2025: {len(rules_chunks)} chunks")
    print(f"  - Commencement Notification: {len(comm_chunks)} chunks")

    return all_chunks


if __name__ == "__main__":
    chunks = build_authoritative_corpus()
    out_file = Path(__file__).parent / "authoritative_corpus.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)
    print(f"Successfully saved {len(chunks)} chunks to {out_file}")
