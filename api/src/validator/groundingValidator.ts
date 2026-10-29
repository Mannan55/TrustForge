/**
 * Independent Grounding Validator for TrustForge Research Platform (Phase 3).
 * Deterministically verifies:
 *   1. Legal citation check: Cited statutory provision must exist in the retrieved context supplied to that model invocation.
 *   2. Website evidence check: Supporting evidence ID and verbatim quotations must match captured website evidence.
 *   3. Strict enforcement: Ungrounded findings convert effective verdict to NOT_DETERMINABLE and are excluded from score.
 *   4. Research provenance: Original raw model output and rejection reasons are preserved for audit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Citation, EvidenceItem, ModelFinding, ComplianceCategoryCode } from '../types/index.js';
import { HybridLegalContext, HybridRetrievedChunk } from '../rag/hybridRAG.js';
import { CANONICAL_CONTROL_TO_C10 } from '../scoring/pillarMappingAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LegalChunk {
  chunk_id: string;
  document_id: string;
  section: string;
  heading: string;
  text: string;
  source_document?: string;
  section_number?: string | null;
  rule_number?: string | null;
  obligation_category?: string;
  obligation_categories?: string[];
}

export interface GroundingValidationResult {
  isValid: boolean;
  groundingScore: number;
  citationValidations: {
    citation: Citation;
    isStatutoryValid: boolean;
    isRetrievedInContext: boolean;
    isVerbatimFound: boolean;
    reason: string;
  }[];
  evidenceValidations: {
    evidenceId: string;
    isObserved: boolean;
    hasValidProvenance: boolean;
    isQuoteMatched?: boolean;
    reason: string;
  }[];
  hallucinationFlags: string[];
  diagnosticType?: 'MALFORMED_OUTPUT' | 'MISSING_EVIDENCE' | 'CITATION_FAILURE' | 'FABRICATED_QUOTE' | 'UNSUPPORTED_CLAIM' | 'VALID';
}

/**
 * Normalization policy for exact evidence and statutory quotation verification.
 * Canonicalizes Unicode (NFKC), converts typographic quotes and dashes to standard ASCII,
 * decodes HTML entities, collapses redundant whitespace, and lowercases.
 * CRITICAL: Preserves punctuation, negation, numeric values, and meaningful wording.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&(?:apos|#39|#x27);/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return _;
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return _;
      }
    });
}

export function normalizeGroundingText(text: string): string {
  if (!text) return '';
  return decodeHtmlEntities(text)
    .normalize('NFKC')
    .toLowerCase()
    // Canonicalize curly / typographic single quotes to ASCII apostrophe
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Canonicalize curly / typographic double quotes to ASCII quote
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Canonicalize dashes and hyphens to standard ASCII hyphen
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    // Collapse whitespace characters (tabs, newlines, non-breaking spaces) to single space
    .replace(/[\r\n\t\f\v\u00A0\u2000-\u200B\u202F\u205F\u3000]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips surrounding quotation marks that LLMs or annotators wrap around quotes.
 */
export function stripEnclosingQuotes(str: string): string {
  let s = str.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * Normalizes and strips enclosing quotes, ellipses (... / …), dashes, and trailing punctuation
 * for reliable verbatim matching against retrieved legal passages or observed website evidence.
 */
export function cleanQuotation(text: string): string {
  if (!text) return '';
  let s = stripEnclosingQuotes(normalizeGroundingText(text));
  // Strip leading and trailing ellipsis, dashes, quotes, and punctuation
  s = s.replace(/^(?:\.{2,}|…|[-–—\s'"])+/g, '')
       .replace(/(?:\.{2,}|…|[-–—\s'".,;:!?])+$/g, '')
       .trim();
  return s;
}

export class GroundingValidator {
  private corpus: LegalChunk[] = [];
  private statutorySections = new Set<string>();

  constructor() {
    this.loadAuthoritativeCorpus();
  }

  private loadAuthoritativeCorpus(): void {
    try {
      const possiblePaths = [
        path.resolve(__dirname, '../../../backend/knowledge/authoritative_corpus.json'),
        path.resolve(process.cwd(), 'backend/knowledge/authoritative_corpus.json'),
        path.resolve(process.cwd(), '../backend/knowledge/authoritative_corpus.json'),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf-8');
          this.corpus = JSON.parse(raw);
          break;
        }
      }

      for (const chunk of this.corpus) {
        if (chunk.section) {
          const normSec = chunk.section.toLowerCase().trim();
          this.statutorySections.add(normSec);
          const m = normSec.match(/(?:section|rule)\s*(\d+[a-z]?)/i);
          if (m) this.statutorySections.add(m[1].toLowerCase());
        }
        if (chunk.chunk_id) {
          this.statutorySections.add(chunk.chunk_id.toLowerCase().trim());
        }
      }
    } catch (err) {
      console.warn('[GroundingValidator] Could not load authoritative corpus JSON directly:', err);
    }
  }

  /**
   * Validate model findings against captured evidence and supplied retrieved legal context.
   */
  public validateFinding(
    finding: ModelFinding,
    availableEvidence: EvidenceItem[],
    retrievedContext?: HybridLegalContext | HybridRetrievedChunk[]
  ): GroundingValidationResult {
    const evidenceMap = new Map<string, EvidenceItem>();
    for (const e of availableEvidence) {
      evidenceMap.set(e.id, e);
    }

    const hallucinationFlags: string[] = [];
    let diagnosticType: GroundingValidationResult['diagnosticType'] = 'VALID';

    // Extract retrieved chunks list and combined context text
    let retrievedChunks: (HybridRetrievedChunk | LegalChunk)[] = [];
    let combinedContextText = '';
    if (retrievedContext) {
      if (Array.isArray(retrievedContext)) {
        retrievedChunks = retrievedContext;
      } else if ('chunks' in retrievedContext && Array.isArray(retrievedContext.chunks)) {
        retrievedChunks = retrievedContext.chunks;
        if (typeof (retrievedContext as any).combinedContextText === 'string') {
          combinedContextText = (retrievedContext as any).combinedContextText;
        }
      } else if (typeof (retrievedContext as any).combinedContextText === 'string') {
        combinedContextText = (retrievedContext as any).combinedContextText;
      }
    }

    const retrievedSectionSet = new Set<string>();
    const retrievedChunkIdSet = new Set<string>();
    for (const chk of retrievedChunks) {
      if (chk.chunk_id) retrievedChunkIdSet.add(chk.chunk_id.toLowerCase().trim());
      if (chk.section) {
        retrievedSectionSet.add(chk.section.toLowerCase().trim());
        const m = chk.section.match(/(?:section|rule)\s*(\d+[a-z]?)/i);
        if (m) retrievedSectionSet.add(m[1].toLowerCase());
      }
    }
    // Also check combinedContextText for statutory section mentions
    if (combinedContextText) {
      const secMatches = combinedContextText.match(/(?:section|rule)\s*(\d+[a-z]?)/gi);
      if (secMatches) {
        for (const sm of secMatches) {
          retrievedSectionSet.add(sm.toLowerCase().trim());
          const num = sm.replace(/^(?:section|rule)\s*/i, '').toLowerCase().trim();
          if (num) retrievedSectionSet.add(num);
        }
      }
    }

    // 1. Legal Citation Validation (Independent from Website Evidence)
    const citationValidations = [];
    let validCitationCount = 0;
    const citations = finding.legal_citations || [];

    for (const cit of citations) {
      const normSec = cit.section ? cit.section.toLowerCase().trim() : '';
      const normChunkId = cit.chunk_id ? cit.chunk_id.toLowerCase().trim() : '';
      const isStatutoryValid = Boolean(this.isSectionValid(normSec) || (normChunkId && this.corpus.some(c => c.chunk_id.toLowerCase() === normChunkId)));

      let isRetrievedInContext = true;
      if (retrievedChunks.length > 0 || combinedContextText) {
        const inSec = normSec && (retrievedSectionSet.has(normSec) || Array.from(retrievedSectionSet).some(s => normSec.includes(s) || s.includes(normSec)));
        const inChunk = normChunkId && retrievedChunkIdSet.has(normChunkId);
        const inCombined = combinedContextText && normSec && normalizeGroundingText(combinedContextText).includes(normSec);
        isRetrievedInContext = Boolean(inSec || inChunk || inCombined);
      }

      let isVerbatimFound = false;
      let reason = 'OK';

      if (!isStatutoryValid) {
        reason = `Section/Rule '${cit.section || cit.chunk_id}' does not exist in authoritative DPDP statutory enactments.`;
        hallucinationFlags.push(`[CITATION_FAILURE] Fabricated statutory provision: ${cit.section || cit.chunk_id}`);
        diagnosticType = 'CITATION_FAILURE';
      } else if (!isRetrievedInContext) {
        reason = `Cited legal provision '${cit.section || cit.chunk_id}' was NOT present in the retrieved legal context supplied to this model.`;
        hallucinationFlags.push(`[CITATION_FAILURE] Unretrieved citation: ${cit.section || cit.chunk_id}`);
        diagnosticType = 'CITATION_FAILURE';
      } else if (cit.verbatim_quote && cit.verbatim_quote.trim().length > 10) {
        const cleanQuote = cleanQuotation(cit.verbatim_quote);
        const searchPoolTexts: string[] = [];

        // Strictly search ONLY within the legal context supplied to this model invocation
        if (combinedContextText) {
          searchPoolTexts.push(normalizeGroundingText(combinedContextText));
        }
        for (const chk of retrievedChunks) {
          if (chk.text) searchPoolTexts.push(normalizeGroundingText(chk.text));
        }

        // Only in isolated unit testing where no retrieved context was supplied at all, fall back to corpus
        if (searchPoolTexts.length === 0 && !combinedContextText && retrievedChunks.length === 0) {
          for (const chk of this.corpus) {
            if (chk.text) searchPoolTexts.push(normalizeGroundingText(chk.text));
          }
        }

        // 1. Direct cleaned substring match
        for (const txt of searchPoolTexts) {
          if (cleanQuote.length >= 10 && txt.includes(cleanQuote)) {
            isVerbatimFound = true;
            break;
          }
        }

        // 2. If quote has internal ellipses (... or …), test substantial phrases
        if (!isVerbatimFound && (cleanQuote.includes('...') || cleanQuote.includes('…'))) {
          const segments = cleanQuote.split(/\.{2,}|…/).map(seg => cleanQuotation(seg)).filter(seg => seg.length >= 15);
          if (segments.length > 0 && segments.every(seg => searchPoolTexts.some(txt => txt.includes(seg)))) {
            isVerbatimFound = true;
          }
        }

        if (!isVerbatimFound) {
          reason = `Quoted legal excerpt does not match statutory text in retrieved corpus for ${cit.section}.`;
          hallucinationFlags.push(`[FABRICATED_QUOTE] Inaccurate or fabricated legal quotation for ${cit.section}`);
          diagnosticType = 'FABRICATED_QUOTE';
        } else {
          validCitationCount++;
        }
      } else {
        // Valid statutory section present in retrieved context without requiring verbatim quotation
        validCitationCount++;
        isVerbatimFound = true;
      }

      citationValidations.push({
        citation: cit,
        isStatutoryValid,
        isRetrievedInContext,
        isVerbatimFound,
        reason,
      });
    }

    // 2. Website Evidence & Provenance Validation
    const evidenceValidations = [];
    let validEvidenceCount = 0;
    const citedEvidenceIds = finding.evidence_ids || [];

    for (const eId of citedEvidenceIds) {
      const item = evidenceMap.get(eId);
      const isObserved = Boolean(item);
      let hasValidProvenance = false;
      let isQuoteMatched = true;
      let reason = 'OK';

      if (!isObserved) {
        reason = `Cited evidence ID '${eId}' was not captured in the website scan.`;
        hallucinationFlags.push(`[MISSING_EVIDENCE] Cited non-existent evidence ID: ${eId}`);
        diagnosticType = 'MISSING_EVIDENCE';
      } else {
        // Provenance verification: must have source URL, timestamp, source type, and non-empty content
        // Self-reported questionnaire evidence from ASSESSMENT_WIZARD originates from authenticated user input
        const isWizard = item?.source_type === 'ASSESSMENT_WIZARD';
        const sourceUrl = item?.source_url || (item as any)?.url || (isWizard ? 'wizard://self-reported-assessment' : undefined);
        const hasSourceUrl = Boolean(sourceUrl && typeof sourceUrl === 'string' && sourceUrl.trim().length > 0);
        const hasTimestamp = Boolean(item?.extracted_at && typeof item.extracted_at === 'string' && item.extracted_at.trim().length > 0);
        const hasSourceType = Boolean(item?.source_type && typeof item.source_type === 'string' && item.source_type.trim().length > 0);

        const rawVal = item?.value !== undefined && item?.value !== null
          ? (typeof item.value === 'string' ? item.value : JSON.stringify(item.value))
          : '';
        const hasCapturedContent = rawVal.trim().length > 0;

        if (!hasSourceUrl) {
          reason = `Evidence '${eId}' lacks verified source URL provenance.`;
          hallucinationFlags.push(`[MISSING_EVIDENCE] Evidence lacks source URL for ${eId}`);
          diagnosticType = 'MISSING_EVIDENCE';
        } else if (!hasCapturedContent) {
          reason = `Evidence '${eId}' contains no captured content.`;
          hallucinationFlags.push(`[MISSING_EVIDENCE] Evidence contains no captured content for ${eId}`);
          diagnosticType = 'MISSING_EVIDENCE';
        } else if (!hasTimestamp || !hasSourceType) {
          reason = `Evidence '${eId}' lacks verified capture timestamp or source type.`;
          hallucinationFlags.push(`[MISSING_EVIDENCE] Untraceable evidence provenance for ${eId}`);
          diagnosticType = 'MISSING_EVIDENCE';
        } else {
          hasValidProvenance = true;
        }

        if (isObserved && hasValidProvenance) {
          validEvidenceCount++;
        }
      }

      evidenceValidations.push({
        evidenceId: eId,
        isObserved,
        hasValidProvenance,
        isQuoteMatched,
        reason,
      });
    }

    // 3. Exact Quoted Website Evidence Verification (Independent from Legal Citations)
    if (finding.quoted_evidence && finding.quoted_evidence.trim().length > 0) {
      const rawQuote = finding.quoted_evidence.trim();
      const normQuote = cleanQuotation(rawQuote);

      if (normQuote.length < 5) {
        hallucinationFlags.push('[FABRICATED_QUOTE] Quoted evidence is empty or trivially short');
        diagnosticType = 'FABRICATED_QUOTE';
      } else if (citedEvidenceIds.length === 0) {
        hallucinationFlags.push('[FABRICATED_QUOTE] Quoted evidence provided without any associated evidence ID');
        diagnosticType = 'FABRICATED_QUOTE';
      } else {
        // Must match captured content of at least one cited evidence item exactly (substring match)
        let exactMatchFound = false;

        for (const eId of citedEvidenceIds) {
          const item = evidenceMap.get(eId);
          if (!item) continue;
          const valStr = typeof item.value === 'string' ? item.value : JSON.stringify(item.value || '');
          const enrichedVal = `${item.label || ''} ${item.key || ''} ${valStr}`;
          const normContent = normalizeGroundingText(valStr);
          const normEnriched = normalizeGroundingText(enrichedVal);

          if (normContent.includes(normQuote) || normEnriched.includes(normQuote)) {
            exactMatchFound = true;
            break;
          }

          // If quote contains internal ellipses (... or …), check if all substantial phrases match
          if (!exactMatchFound && (normQuote.includes('...') || normQuote.includes('…'))) {
            const segments = normQuote.split(/\.{2,}|…/).map(seg => cleanQuotation(seg)).filter(seg => seg.length >= 10);
            if (segments.length > 0 && segments.every(seg => normContent.includes(seg) || normEnriched.includes(seg))) {
              exactMatchFound = true;
              break;
            }
          }
        }

        if (!exactMatchFound) {
          hallucinationFlags.push(`[FABRICATED_QUOTE] Quoted evidence does not match captured website evidence: "${rawQuote.slice(0, 60)}..."`);
          diagnosticType = 'FABRICATED_QUOTE';
          // Mark evidence validation as failed on quote match
          for (const ev of evidenceValidations) {
            ev.isQuoteMatched = false;
            ev.reason = `Quoted evidence does not match captured content.`;
          }
        }
      }
    }

    // 4. Affirmative Verdict Evidence Gating
    const isAffirmative = finding.verdict === 'SUPPORTED' || finding.verdict === 'PARTIALLY_SUPPORTED';
    if (isAffirmative && citedEvidenceIds.length === 0) {
      hallucinationFlags.push('[UNSUPPORTED_CLAIM] Affirmative compliance verdict declared without any supporting website evidence');
      diagnosticType = 'UNSUPPORTED_CLAIM';
    }

    // 5. Calculate Grounding Score in [0, 1]
    const totalAssertions = citations.length + citedEvidenceIds.length;
    let groundingScore = 1.0;

    if (totalAssertions > 0) {
      const earned = validCitationCount + validEvidenceCount;
      groundingScore = Math.max(0.0, Math.min(1.0, Math.round((earned / totalAssertions) * 100) / 100));
    } else if (isAffirmative) {
      groundingScore = 0.0;
    }

    const isValid = hallucinationFlags.length === 0 && groundingScore >= 0.70;

    return {
      isValid,
      groundingScore,
      citationValidations,
      evidenceValidations,
      hallucinationFlags,
      diagnosticType: isValid ? 'VALID' : diagnosticType,
    };
  }

  /**
   * Strictly validates finding and mutates finding in place according to research grounding policy:
   *  - Preserves finding.raw_verdict = original model output
   *  - If validation fails, sets finding.verdict = 'NOT_DETERMINABLE' and records rejection_reason
   *  - Excludes rejected findings from Trust Score denominator
   */
  public validateAndEnforceFinding(
    finding: ModelFinding,
    availableEvidence: EvidenceItem[],
    retrievedContext?: HybridLegalContext | HybridRetrievedChunk[],
    contextInfo: { modelId?: string; assessmentId?: string } = {}
  ): GroundingValidationResult {
    // Preserve original model output for research reproducibility
    if (!finding.raw_verdict) {
      finding.raw_verdict = finding.verdict;
    }
    if (contextInfo.modelId && !finding.model_id) {
      finding.model_id = contextInfo.modelId;
    }
    if (contextInfo.assessmentId && !finding.assessment_id) {
      finding.assessment_id = contextInfo.assessmentId;
    }

    // Assign obligation category from taxonomy mapping if missing
    if (!finding.obligation_category && finding.control_id) {
      finding.obligation_category = CANONICAL_CONTROL_TO_C10[finding.control_id] as ComplianceCategoryCode;
    }

    // Store retrieved chunk IDs for provenance
    if (retrievedContext) {
      const chunks = Array.isArray(retrievedContext)
        ? retrievedContext
        : (retrievedContext.chunks || []);
      finding.retrieved_chunk_ids = chunks.map(c => c.chunk_id);
    }

    const result = this.validateFinding(finding, availableEvidence, retrievedContext);

    finding.is_grounded = result.isValid;
    finding.grounding_score = result.groundingScore;

    if (!result.isValid) {
      finding.rejection_reason = result.hallucinationFlags.join('; ');
      finding.verdict = 'NOT_DETERMINABLE';
      console.warn(`[Grounding Enforcement] Converted ungrounded verdict to NOT_DETERMINABLE for control ${finding.control_id} (model: ${finding.model_id}): ${finding.rejection_reason}`);
    } else {
      finding.rejection_reason = null;
    }

    return result;
  }

  private isSectionValid(sectionStr: string): boolean {
    if (!sectionStr) return false;
    if (this.statutorySections.size === 0) return true;

    const norm = sectionStr.toLowerCase().trim();
    for (const valid of this.statutorySections) {
      if (norm.includes(valid) || valid.includes(norm)) return true;
    }
    return false;
  }
}

export const groundingValidator = new GroundingValidator();
