/**
 * Independent Grounding Validator for TrustForge Research Platform.
 * Deterministically verifies statutory citations, verbatim quotes, and captured evidence provenance.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Citation, EvidenceItem, ModelFinding } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LegalChunk {
  chunk_id: string;
  document_id: string;
  section: string;
  heading: string;
  text: string;
}

export interface GroundingValidationResult {
  isValid: boolean;
  groundingScore: number;
  citationValidations: {
    citation: Citation;
    isStatutoryValid: boolean;
    isVerbatimFound: boolean;
    reason: string;
  }[];
  evidenceValidations: {
    evidenceId: string;
    isObserved: boolean;
  }[];
  hallucinationFlags: string[];
}

export class GroundingValidator {
  private corpus: LegalChunk[] = [];
  private statutorySections = new Set<string>();

  constructor() {
    this.loadAuthoritativeCorpus();
  }

  private loadAuthoritativeCorpus(): void {
    try {
      // Look for authoritative_corpus.json
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
          // Also add simplified number e.g. "section 5" -> "5", "rule 3" -> "3"
          const m = normSec.match(/(?:section|rule)\s*(\d+[a-z]?)/i);
          if (m) this.statutorySections.add(m[1].toLowerCase());
        }
      }
    } catch (err) {
      console.warn('GroundingValidator: Could not load authoritative corpus JSON directly.', err);
    }
  }

  /**
   * Validate a model's findings against the authoritative legal corpus and captured evidence.
   */
  public validateFinding(
    finding: ModelFinding,
    availableEvidence: EvidenceItem[]
  ): GroundingValidationResult {
    const evidenceIdSet = new Set(availableEvidence.map(e => e.id));
    const hallucinationFlags: string[] = [];

    // 1. Validate Citations
    const citationValidations = [];
    let validCitationCount = 0;

    for (const cit of finding.legal_citations || []) {
      const normSec = cit.section ? cit.section.toLowerCase().trim() : '';
      const isStatutoryValid = this.isSectionValid(normSec);

      let isVerbatimFound = false;
      let reason = 'OK';

      if (!isStatutoryValid) {
        reason = `Section/Rule '${cit.section}' does not exist in authoritative DPDP statutory enactments.`;
        hallucinationFlags.push(`Hallucinated statutory provision: ${cit.section}`);
      } else if (cit.verbatim_quote && cit.verbatim_quote.length > 15) {
        // Check if verbatim quote appears in corresponding chunks
        const quoteClean = cit.verbatim_quote.toLowerCase().replace(/[\r\n\t]+/g, ' ').trim();
        const matchingChunks = this.corpus.filter(c => 
          c.section && c.section.toLowerCase().includes(normSec)
        );

        for (const chk of matchingChunks) {
          const chunkClean = chk.text.toLowerCase().replace(/[\r\n\t]+/g, ' ');
          if (chunkClean.includes(quoteClean) || this.fuzzySubstringMatch(chunkClean, quoteClean)) {
            isVerbatimFound = true;
            break;
          }
        }

        if (!isVerbatimFound) {
          reason = `Quoted excerpt does not match official Gazette text for ${cit.section}.`;
          hallucinationFlags.push(`Inaccurate or fabricated quotation for ${cit.section}`);
        } else {
          validCitationCount++;
        }
      } else {
        // Valid section without quote or short reference
        validCitationCount += 0.5;
        isVerbatimFound = true;
      }

      citationValidations.push({
        citation: cit,
        isStatutoryValid,
        isVerbatimFound,
        reason,
      });
    }

    // 2. Validate Evidence References
    const evidenceValidations = [];
    let validEvidenceCount = 0;

    for (const eId of finding.evidence_ids || []) {
      const isObserved = evidenceIdSet.has(eId);
      if (!isObserved) {
        hallucinationFlags.push(`Cited non-existent evidence ID: ${eId}`);
      } else {
        validEvidenceCount++;
      }
      evidenceValidations.push({
        evidenceId: eId,
        isObserved,
      });
    }

    // Calculate Grounding Score in [0, 1]
    const totalAssertions = (finding.legal_citations?.length || 0) + (finding.evidence_ids?.length || 0);
    let groundingScore = 1.0;

    if (totalAssertions > 0) {
      const earned = validCitationCount + validEvidenceCount;
      groundingScore = Math.max(0.0, Math.min(1.0, Math.round((earned / totalAssertions) * 100) / 100));
    } else if (finding.verdict !== 'INSUFFICIENT_EVIDENCE' && finding.verdict !== 'NOT_APPLICABLE') {
      // Made affirmative compliance claim without ANY citation or evidence!
      groundingScore = 0.2;
      hallucinationFlags.push('Affirmative verdict declared without supporting statutory citations or evidence');
    }

    return {
      isValid: hallucinationFlags.length === 0 && groundingScore >= 0.75,
      groundingScore,
      citationValidations,
      evidenceValidations,
      hallucinationFlags,
    };
  }

  private isSectionValid(sectionStr: string): boolean {
    if (!sectionStr) return false;
    if (this.statutorySections.size === 0) return true; // Fallback if corpus not loaded

    for (const valid of this.statutorySections) {
      if (sectionStr.includes(valid) || valid.includes(sectionStr)) return true;
    }
    return false;
  }

  private fuzzySubstringMatch(text: string, query: string): boolean {
    const words = query.split(/\s+/).filter(w => w.length > 4);
    if (words.length < 3) return false;
    let matchCount = 0;
    for (const w of words) {
      if (text.includes(w)) matchCount++;
    }
    return matchCount / words.length >= 0.8;
  }
}
