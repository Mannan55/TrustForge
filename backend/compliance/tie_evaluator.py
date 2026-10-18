"""
TrustForge Intelligent Evaluator (TIE).

Evaluates a compliance control using:
  1. Observed evidence (from scanner + wizard)
  2. Retrieved authoritative passages (from RAG)
  3. LLM interpretation (Groq/Llama) — grounded and constrained

TIE does NOT:
  - Claim official compliance certification
  - Invent DPDP sections
  - Make conclusions without evidence
  - Replace deterministic evaluation where rules are clear

Output: TIEResult with structured finding, explanation, recommendation, citations.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict, List, Optional, Tuple

from config import settings, get_groq_key
from core.models import (
    Citation,
    ComplianceControl,
    ControlStatus,
    EvaluationMethod,
    EvidenceItem,
    EvidenceStatus,
    RetrievedChunk,
    Severity,
    TIEResult,
)
from rag.retrieval import retrieve
from rag.query_builder import build_retrieval_query

logger = logging.getLogger(__name__)


# ─── LLM Provider abstraction ─────────────────────────────────────────────────

class LLMProvider:
    """Abstract interface for LLM generation."""

    async def generate(self, prompt: str) -> Optional[str]:
        raise NotImplementedError


class GroqProvider(LLMProvider):
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from groq import Groq
            api_key = get_groq_key()
            if not api_key or api_key == "your_groq_api_key_here":
                raise RuntimeError(
                    "GROQ_API_KEY not configured. Set it in backend/.env. "
                    "Get a free key at https://console.groq.com"
                )
            # max_retries=0: we handle retries ourselves to respect retry-after header
            self._client = Groq(api_key=api_key, max_retries=0)
        return self._client

    async def generate(self, prompt: str) -> Optional[str]:
        """Call Groq API with async retry logic so event loop stays free during 429 waits."""
        import asyncio
        import re
        loop = asyncio.get_event_loop()
        max_attempts = 4
        for attempt in range(max_attempts):
            try:
                return await loop.run_in_executor(None, self._generate_sync, prompt)
            except Exception as exc:
                err_str = str(exc)
                if "429" in err_str and attempt < max_attempts - 1:
                    m_ms = re.search(r"try again in (\d+(?:\.\d+)?)\s*ms", err_str, re.IGNORECASE)
                    m_s = re.search(r"try again in (\d+(?:\.\d+)?)\s*s", err_str, re.IGNORECASE)
                    m_retry = re.search(r"retry.after[\":\s]+(\d+)", err_str, re.IGNORECASE)
                    if m_s:
                        wait = float(m_s.group(1)) + 1.0
                    elif m_ms:
                        wait = float(m_ms.group(1)) / 1000.0 + 0.5
                    elif m_retry:
                        wait = float(m_retry.group(1)) + 1.0
                    else:
                        wait = 10.0
                    wait = min(max(wait, 1.0), 35.0)
                    logger.warning(
                        f"Groq 429 (attempt {attempt+1}/{max_attempts}) — "
                        f"waiting {wait:.2f}s for rate-limit reset — event loop stays free"
                    )
                    await asyncio.sleep(wait)  # NON-BLOCKING — uvicorn serves GETs during wait
                else:
                    raise
        return None

    def _generate_sync(self, prompt: str) -> Optional[str]:
        """Single synchronous Groq call — no retries (retry handled in async generate())."""
        client = self._get_client()
        resp = client.chat.completions.create(
            model=settings.llm_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )
        return resp.choices[0].message.content


class NoOpProvider(LLMProvider):
    """Used when no LLM is configured. Returns a structured not-configured message."""
    async def generate(self, prompt: str) -> Optional[str]:
        return None


def _get_llm_provider() -> LLMProvider:
    if settings.llm_provider.lower() == "groq":
        return GroqProvider()
    return NoOpProvider()


_llm: Optional[LLMProvider] = None


def get_llm() -> LLMProvider:
    global _llm
    if _llm is None:
        _llm = _get_llm_provider()
    return _llm


# ─── Deterministic evaluation (no LLM) ───────────────────────────────────────

def _evaluate_deterministically(
    control: ComplianceControl,
    evidence: List[EvidenceItem],
) -> TIEResult:
    """
    Rule-based evaluation for controls where the check is binary and observable.
    Used for TF-SEC-001 and TF-SEC-002 where scanner evidence is definitive.
    """
    verified = [e for e in evidence if e.observed is True and
                e.status in (EvidenceStatus.VERIFIED, EvidenceStatus.DETECTED)]
    not_found = [e for e in evidence if e.observed is False or
                 e.status == EvidenceStatus.NOT_FOUND]

    required_keys = set(control.evidence_required)
    found_keys = {e.key for e in verified}
    missing_keys = required_keys - found_keys

    if not evidence:
        return TIEResult(
            control_id=control.control_id,
            status=ControlStatus.INSUFFICIENT_EVIDENCE,
            severity=control.severity,
            finding=f"No evidence available to evaluate '{control.title}'.",
            explanation="The scanner did not produce data for this check. Manual verification required.",
            recommendation="Run a website scan and provide the target URL.",
            evidence_ids=[],
            citations=[],
            confidence=0.0,
            evaluation_method=EvaluationMethod.DETERMINISTIC,
        )

    if not missing_keys:
        return TIEResult(
            control_id=control.control_id,
            status=ControlStatus.PASS,
            severity=control.severity,
            finding=f"'{control.title}' — required signals detected.",
            explanation=f"Scanner confirmed: {', '.join(found_keys)}.",
            recommendation="No action required. Continue monitoring.",
            evidence_ids=[e.evidence_id for e in verified],
            citations=[],
            confidence=0.95,
            evaluation_method=EvaluationMethod.DETERMINISTIC,
        )
    else:
        missing_desc = ", ".join(missing_keys)
        return TIEResult(
            control_id=control.control_id,
            status=ControlStatus.POTENTIAL_GAP,
            severity=control.severity,
            finding=f"'{control.title}' — some required signals not observed: {missing_desc}.",
            explanation=f"Scanner did not detect: {missing_desc}. This does not confirm non-compliance "
                       f"but indicates a potential gap that should be reviewed.",
            recommendation=f"Verify that {missing_desc} is properly configured and observable.",
            evidence_ids=[e.evidence_id for e in not_found],
            citations=[],
            confidence=0.85,
            evaluation_method=EvaluationMethod.DETERMINISTIC,
        )


# ─── TIE prompt construction ───────────────────────────────────────────────────

SYSTEM_INSTRUCTIONS = """You are TIE (TrustForge Intelligent Evaluator), a compliance analysis component.

Your role is to interpret observed evidence against authoritative DPDP Act 2023 and DPDP Rules 2025 context.

STRICT RULES:
1. Base your response ONLY on the provided evidence and retrieved authoritative passages.
2. Do NOT invent DPDP sections, requirements, or obligations not present in the context.
3. Do NOT claim the organisation is "compliant" or "certified". Use "potential gap", "aligned", or "requires review".
4. If evidence is insufficient, say so clearly — do not speculate.
5. Distinguish observations from interpretations.
6. Your output must be valid JSON matching the schema provided.
7. Citations must reference only the documents provided in the context.
8. The "confidence" field is 0.0–1.0 based on evidence quality, not certainty about legal interpretation.
9. Phased Commencement & Enforceability:
   - The DPDP Act and Rules have phased commencement dates (November 2025, November 2026, May 2027).
   - If a retrieved statutory provision has Commencement Status 'NOTIFIED_PHASED_1YR' or 'NOTIFIED_PHASED_18MO' (Enforceability: 'PHASED_READINESS'), do NOT describe gaps as already enforceable legal violations.
   - Instead, characterize findings as "future compliance readiness" or "preparatory readiness for phased enforcement", clearly distinguishing in-force legal requirements from future obligations."""

def _build_context_passages(
    chunks: List[RetrievedChunk],
    context_budget: Optional[int] = None,
) -> Tuple[str, List[RetrievedChunk], List[Dict[str, Any]]]:
    """
    Build bounded authoritative statutory context passages prioritizing complete provisions.

    Instead of arbitrarily slicing chunk characters (which silently truncates statutory
    subsections), this selects complete chunks in retrieval relevance order within a
    bounded character budget.

    If a chunk cannot be accommodated in full within the remaining budget, it is excluded
    rather than silently truncated midway through legal provisions, and the exclusion is
    explicitly recorded.

    Returns:
        (context_text, included_chunks, excluded_chunks_metadata)
    """
    if context_budget is None:
        context_budget = getattr(settings, "tie_context_budget", 4000)

    if not chunks:
        return "No authoritative passages retrieved.", [], []

    included_chunks: List[RetrievedChunk] = []
    excluded_chunks: List[Dict[str, Any]] = []
    formatted_passages: List[str] = []
    current_length = 0

    for c in chunks:
        c_status = getattr(c, "commencement_status", "UNSPECIFIED") or "UNSPECIFIED"
        enforce = getattr(c, "enforceability", "UNSPECIFIED") or "UNSPECIFIED"
        eff_date = getattr(c, "effective_date", "UNSPECIFIED") or "UNSPECIFIED"
        formatted = (
            f"[Chunk ID: {c.chunk_id} | Document: {c.document_title} | "
            f"Section: {c.section or 'general'} | Commencement: {c_status} | "
            f"Effective: {eff_date} | Enforceability: {enforce}]\n{c.text.strip()}"
        )
        entry_length = len(formatted) + (2 if formatted_passages else 0)  # account for separator

        if current_length + entry_length <= context_budget:
            formatted_passages.append(formatted)
            included_chunks.append(c)
            current_length += entry_length
        else:
            excluded_chunks.append({
                "chunk_id": c.chunk_id,
                "document_title": c.document_title,
                "section": c.section or "general",
                "char_length": len(c.text),
                "reason": (
                    f"Exceeded remaining budget (remaining: {max(0, context_budget - current_length)} chars, "
                    f"required: {entry_length} chars)"
                ),
            })

    # Guard: If even the single highest-ranked chunk exceeds the entire budget,
    # include it with clear explicit boundary notation to avoid zero context.
    if not formatted_passages and chunks:
        c = chunks[0]
        header = f"[Chunk ID: {c.chunk_id} | Document: {c.document_title} | Section: {c.section or 'general'}]\n"
        allowed_len = max(100, context_budget - len(header) - 60)
        formatted = header + c.text[:allowed_len].strip() + "\n[... EXPLICIT CONTEXT BUDGET BOUNDARY REACHED]"
        formatted_passages.append(formatted)
        included_chunks.append(c)
        excluded_chunks.append({
            "chunk_id": c.chunk_id,
            "document_title": c.document_title,
            "section": c.section or "general",
            "char_length": len(c.text),
            "reason": f"Partial inclusion: single chunk exceeds entire budget of {context_budget} chars",
        })

    context_text = "\n\n".join(formatted_passages)

    # Append transparent exclusion disclosure to context if any passages were omitted
    if excluded_chunks:
        exclusion_summary = "; ".join(
            f"{e['chunk_id']} ({e['section']})" for e in excluded_chunks
        )
        context_text += (
            f"\n\n[NOTICE: Additional retrieved passages were excluded due to context budget "
            f"({context_budget} chars): {exclusion_summary}]"
        )

    return context_text, included_chunks, excluded_chunks


def _build_tie_prompt(
    control: ComplianceControl,
    evidence: List[EvidenceItem],
    chunks: List[RetrievedChunk],
    context_budget: Optional[int] = None,
) -> str:
    evidence_summary = "\n".join(
        f"- [{e.source.value}] {e.title}: {'OBSERVED' if e.observed else 'NOT OBSERVED'} "
        f"({e.status.value}) — {e.notes[:120]}"
        for e in evidence
    ) or "No evidence available."

    # Build bounded context passages prioritizing complete statutory provisions
    context_passages, _, _ = _build_context_passages(chunks, context_budget=context_budget)

    return f"""{SYSTEM_INSTRUCTIONS}

---
CONTROL BEING EVALUATED:
ID: {control.control_id}
Pillar: {control.pillar.value}
Title: {control.title}
Description: {control.description}
Primary Legal Reference: {control.legal_mapping} — {control.legal_mapping_detail}
Severity: {control.severity.value}
---

OBSERVED EVIDENCE:
{evidence_summary}

---
RETRIEVED AUTHORITATIVE CONTEXT (DPDP Act 2023 and related official sources):
{context_passages}

---
REQUIRED OUTPUT FORMAT (valid JSON only, no markdown fences):
{{
  "status": "PASS|POTENTIAL_GAP|FAIL|INSUFFICIENT_EVIDENCE",
  "finding": "One concise sentence describing what was found.",
  "explanation": "2-4 sentences grounded in the retrieved context. Cite specific sections.",
  "recommendation": "One actionable recommendation for the organisation.",
  "confidence": 0.0,
  "citations": [
    {{
      "document_title": "...",
      "authority": "...",
      "section": "...",
      "chunk_id": "...",
      "excerpt": "Short relevant passage (max 200 chars)"
    }}
  ]
}}

Evaluate only what the evidence supports. If evidence is insufficient, set status to INSUFFICIENT_EVIDENCE.
"""


# ─── Main TIE evaluation function ─────────────────────────────────────────────

async def evaluate_control(
    control: ComplianceControl,
    evidence: List[EvidenceItem],
    force_rag: bool = False,
) -> TIEResult:
    """
    Evaluate a compliance control using evidence and (optionally) RAG context.

    For deterministic controls: applies rules directly.
    For RAG-grounded controls: retrieves authoritative context and generates
    an AI interpretation constrained by evidence + retrieved passages.

    Args:
        control: The compliance control to evaluate
        evidence: Normalized evidence items relevant to this control
        force_rag: Force RAG evaluation even for deterministic controls

    Returns:
        TIEResult with structured finding, citations, and confidence.
    """
    start = time.time()

    # Deterministic evaluation path
    if control.evaluation_method == EvaluationMethod.DETERMINISTIC and not force_rag:
        result = _evaluate_deterministically(control, evidence)
        logger.info(
            f"TIE deterministic: {control.control_id} → {result.status.value} "
            f"({time.time()-start:.2f}s)"
        )
        return result

    # RAG-grounded path
    # 1. Build a focused retrieval query
    query = build_retrieval_query(control, evidence)

    # 2. Retrieve authoritative passages
    chunks: List[RetrievedChunk] = []
    try:
        chunks = await retrieve(query, top_k=settings.retrieval_top_k)
    except RuntimeError as exc:
        # Index not built yet
        logger.warning(f"RAG unavailable for {control.control_id}: {exc}")
        # P0.4: RAG-grounded controls MUST NOT fall back to deterministic PASS
        # on missing legal context. Return honest INSUFFICIENT_EVIDENCE.
        return TIEResult(
            control_id=control.control_id,
            status=ControlStatus.INSUFFICIENT_EVIDENCE,
            severity=control.severity,
            finding=f"'{control.title}' could not be evaluated: RAG knowledge base unavailable.",
            explanation="The retrieval index is not available. Legal context required for this control is missing. "
                       "Manual legal review required.",
            recommendation="Ensure the RAG index is built (run python -m rag.ingest from the backend directory).",
            evidence_ids=[e.evidence_id for e in evidence],
            citations=[],
            confidence=0.0,
            evaluation_method=EvaluationMethod.RAG_GROUNDED,
            error=f"RAG index unavailable: {exc}. Cannot evaluate RAG-grounded control without legal context.",
        )

    # 3. If no LLM configured, return retrieval-only result as INSUFFICIENT_EVIDENCE
    # P0.4: Without LLM interpretation, qualitative controls cannot be marked PASS.
    # Deterministic controls are handled above; for RAG-grounded, be honest.
    llm = get_llm()
    if isinstance(llm, NoOpProvider):
        return TIEResult(
            control_id=control.control_id,
            status=ControlStatus.INSUFFICIENT_EVIDENCE,
            severity=control.severity,
            finding=f"'{control.title}' requires LLM evaluation — LLM not configured.",
            explanation="This control requires qualitative legal interpretation grounded in retrieved passages. "
                       "No LLM is configured (TRUSTFORGE_LLM_PROVIDER=none). Deterministic heuristics alone "
                       "are insufficient for this control.",
            recommendation="Configure TRUSTFORGE_LLM_PROVIDER=groq and set GROQ_API_KEY to enable full evaluation.",
            evidence_ids=[e.evidence_id for e in evidence],
            citations=[
                Citation(
                    document_title=c.document_title,
                    authority=c.authority,
                    section=c.section,
                    chunk_id=c.chunk_id,
                    source_url=c.source_url,
                    excerpt=c.text[:200],
                )
                for c in chunks[:3]
            ],
            confidence=0.0,
            evaluation_method=EvaluationMethod.RAG_GROUNDED,
            error="LLM not configured. RAG context retrieved but qualitative interpretation unavailable.",
        )

    # 4. Build TIE prompt and call LLM
    context_passages, included_chunks, excluded_chunks = _build_context_passages(
        chunks, context_budget=settings.tie_context_budget
    )
    if excluded_chunks:
        logger.info(
            f"TIE context budget excluded {len(excluded_chunks)} chunk(s) for {control.control_id}: "
            f"{[e['chunk_id'] for e in excluded_chunks]}"
        )
    prompt = _build_tie_prompt(control, evidence, chunks, context_budget=settings.tie_context_budget)
    raw_response: Optional[str] = None
    try:
        raw_response = await llm.generate(prompt)
    except Exception as exc:
        # LLM not available — P0.4: use _fallback_result which correctly
        # returns INSUFFICIENT_EVIDENCE for RAG-grounded controls
        logger.error(f"LLM call failed for {control.control_id}: {exc}")
        return _fallback_result(control, evidence, str(exc), chunks)

    # 5. Parse and validate JSON output
    result = _parse_tie_response(raw_response, control, evidence, chunks)
    elapsed = time.time() - start
    logger.info(
        f"TIE RAG: {control.control_id} → {result.status.value} "
        f"(confidence={result.confidence:.2f}, {elapsed:.2f}s)"
    )
    return result


def _parse_tie_response(
    raw: Optional[str],
    control: ComplianceControl,
    evidence: List[EvidenceItem],
    chunks: List[RetrievedChunk],
) -> TIEResult:
    """Parse and validate the LLM JSON response into a TIEResult."""
    if not raw:
        return _fallback_result(control, evidence, "LLM returned empty response.", chunks)

    # Strip markdown code fences if present
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip().rstrip("`").strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.warning(f"LLM returned non-JSON for {control.control_id}: {exc}\nRaw: {raw[:300]}")
        return _fallback_result(control, evidence, f"LLM output parse error: {exc}", chunks)


    # Map status
    status_str = str(data.get("status", "INSUFFICIENT_EVIDENCE")).upper()
    try:
        status = ControlStatus(status_str)
    except ValueError:
        status = ControlStatus.INSUFFICIENT_EVIDENCE

    # Build citations (strictly from actually retrieved chunks)
    # P0.3: Citations are ONLY accepted when chunk_id or section resolves
    # to an actually retrieved chunk. Unresolved citations are rejected
    # and logged — never silently substituted with an unrelated chunk.
    chunk_map = {c.chunk_id: c for c in chunks}
    # Section map: maps normalized section key -> list of chunks with that section
    # We use a list to detect ambiguity (multiple chunks per section key).
    from collections import defaultdict
    section_map: dict = defaultdict(list)
    for c in chunks:
        if c.section:
            key = c.section.lower().replace(" ", "").replace("-", "")
            section_map[key].append(c)

    citations: List[Citation] = []
    rejected_citations: List[str] = []

    for cit_data in data.get("citations", [])[:5]:
        chunk_id = str(cit_data.get("chunk_id", "")).strip()
        chunk = chunk_map.get(chunk_id)

        # Exact chunk_id match failed — try unambiguous section-based resolution
        if not chunk and cit_data.get("section"):
            sec_key = str(cit_data.get("section")).lower().replace(" ", "").replace("-", "")
            matched = section_map.get(sec_key, [])
            if len(matched) == 1:
                chunk = matched[0]  # unambiguous match only
            # If ambiguous (len > 1) or missing (len == 0), fall through to rejection


        if chunk:
            # Build excerpt from chunk text (not from unverified model-generated text)
            # Accept model-provided excerpt only as secondary hint; always bounded by chunk
            model_excerpt = str(cit_data.get("excerpt", "")).strip()
            # Verify model excerpt is actually a substring of the chunk text
            if model_excerpt and model_excerpt in chunk.text:
                excerpt = model_excerpt[:300]
            else:
                excerpt = chunk.text[:200]
            citations.append(Citation(
                document_title=chunk.document_title,
                authority=chunk.authority,
                section=chunk.section,
                chunk_id=chunk.chunk_id,
                source_url=chunk.source_url,
                excerpt=excerpt,
            ))
        else:
            # Citation could not be resolved to a retrieved chunk — reject it
            reason = f"chunk_id='{chunk_id}' section='{cit_data.get('section', '')}' not in retrieved set"
            rejected_citations.append(reason)
            logger.warning(
                f"[TIE P0.3] Rejected unresolvable citation for {control.control_id}: {reason}"
            )

    # If citations were rejected, note it in the error field but preserve valid citations
    citation_note = ""
    if rejected_citations:
        citation_note = (
            f" | {len(rejected_citations)} unresolvable citation(s) rejected: "
            + "; ".join(rejected_citations[:3])
        )

    error_field = data.get("error", None)
    if citation_note:
        error_field = (str(error_field) + citation_note) if error_field else citation_note.strip(" |")

    return TIEResult(
        control_id=control.control_id,
        status=status,
        severity=control.severity,
        finding=str(data.get("finding", ""))[:500],
        explanation=str(data.get("explanation", ""))[:2000],
        recommendation=str(data.get("recommendation", ""))[:500],
        evidence_ids=[e.evidence_id for e in evidence],
        citations=citations,
        confidence=max(0.0, min(1.0, float(data.get("confidence", 0.5)))),
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        error=error_field,
    )


def _fallback_result(
    control: ComplianceControl,
    evidence: List[EvidenceItem],
    error: str,
    chunks: Optional[List[RetrievedChunk]] = None,
) -> TIEResult:
    """Emergency fallback when LLM fails or returns unparseable output.

    P0.4: For RAG-grounded controls, the LLM failure means we cannot make a
    qualitative legal determination. We must NOT elevate a scanner signal alone
    to PASS. Return INSUFFICIENT_EVIDENCE and preserve whatever context is available.

    Deterministic controls (TF-SEC-001, TF-SEC-002) use the deterministic path
    since their checks are binary and do not require LLM interpretation.
    """
    if control.evaluation_method == EvaluationMethod.DETERMINISTIC:
        det = _evaluate_deterministically(control, evidence)
        det.error = error
        return det

    # RAG-grounded controls — cannot conclude without LLM interpretation
    return TIEResult(
        control_id=control.control_id,
        status=ControlStatus.INSUFFICIENT_EVIDENCE,
        severity=control.severity,
        finding=f"'{control.title}' evaluation failed: LLM interpretation unavailable.",
        explanation="The AI evaluation step failed or returned an unparseable response. "
                   "Without LLM interpretation of retrieved legal context, a qualitative "
                   "compliance determination cannot be made for this control.",
        recommendation="Review this control manually. Retry the assessment when the LLM service is available.",
        evidence_ids=[e.evidence_id for e in evidence],
        citations=[
            Citation(
                document_title=c.document_title,
                authority=c.authority,
                section=c.section,
                chunk_id=c.chunk_id,
                source_url=c.source_url,
                excerpt=c.text[:200],
            )
            for c in (chunks or [])[:3]
        ],
        confidence=0.0,
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        error=f"LLM evaluation failed: {error}",
    )
