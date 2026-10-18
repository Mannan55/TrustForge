/**
 * Assessment Pipeline Routes for TrustForge API.
 * Orchestrates wizard answers, optional Playwright website scan,
 * RAG context retrieval, multi-model evaluation, and persistent result polling.
 */
import { Router, Request, Response } from 'express';
import { crawlWebsite } from '../crawler/playwrightCrawler.js';
import { LLMGateway, RESEARCH_MODELS } from '../gateway/llmGateway.js';
import { GroundingValidator } from '../validator/groundingValidator.js';
import { CANONICAL_CONTROLS, computeModelTrustScore, computeTopThreeMajorityVoting } from '../scoring/trustScoreEngine.js';
import { db } from '../database/supabaseClient.js';
import { EvidenceItem, ModelFinding } from '../types/index.js';

const router = Router();
const gateway = new LLMGateway();
const validator = new GroundingValidator();

// In-memory job tracker for async evaluation polling
const assessmentJobs = new Map<string, any>();

router.post('/assessments', async (req: Request, res: Response): Promise<void> => {
  const {
    org_id = 'default_org',
    website_url,
    collections = [],
    categories = [],
    purposes = [],
    languages = [],
    rights = [],
    processors = [],
    retention = '',
    erasure_automated = false,
    breach_plan = false,
    grievance_officer_named = false,
    grievance_contact_published = false,
  } = req.body;

  const assessmentId = `ASM_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Store initial pending state
  assessmentJobs.set(assessmentId, {
    assessment_id: assessmentId,
    org_id,
    website_url,
    status: 'in_progress',
    progress: 10,
    current_step: 'Normalizing evidence and initiating scan...',
    created_at: new Date().toISOString(),
  });

  res.status(202).json({
    assessment_id: assessmentId,
    status: 'in_progress',
    message: 'Assessment initiated successfully. Poll /api/assessments/:id for progress.',
  });

  // Execute assessment pipeline asynchronously in background
  (async () => {
    try {
      const evidence: EvidenceItem[] = [];
      const timestamp = new Date().toISOString();

      // 1. Convert wizard inputs into Evidence Items
      if (languages.length > 0) {
        evidence.push({
          id: `EVID_${assessmentId}_LANG`,
          source_type: 'ASSESSMENT_WIZARD',
          key: 'notice_languages',
          label: 'Notice Languages',
          value: languages,
          status: 'SELF_REPORTED',
          confidence: 0.8,
          extracted_at: timestamp,
        });
      }
      if (purposes.length > 0) {
        evidence.push({
          id: `EVID_${assessmentId}_PURP`,
          source_type: 'ASSESSMENT_WIZARD',
          key: 'specified_purposes',
          label: 'Specified Purposes',
          value: purposes,
          status: 'SELF_REPORTED',
          confidence: 0.8,
          extracted_at: timestamp,
        });
      }
      if (breach_plan) {
        evidence.push({
          id: `EVID_${assessmentId}_BREACH`,
          source_type: 'ASSESSMENT_WIZARD',
          key: 'breach_notification_procedure',
          label: 'Breach Notification Procedure',
          value: { documentedProcedure: true },
          status: 'SELF_REPORTED',
          confidence: 0.9,
          extracted_at: timestamp,
        });
      }
      if (grievance_officer_named && grievance_contact_published) {
        evidence.push({
          id: `EVID_${assessmentId}_DPO`,
          source_type: 'ASSESSMENT_WIZARD',
          key: 'dpo_grievance_published',
          label: 'Grievance Officer Published',
          value: { named: true, contactPublished: true },
          status: 'SELF_REPORTED',
          confidence: 0.9,
          extracted_at: timestamp,
        });
      }

      // 2. Run Playwright Crawler if website URL provided
      if (website_url) {
        assessmentJobs.set(assessmentId, {
          ...assessmentJobs.get(assessmentId),
          progress: 30,
          current_step: 'Running Playwright website crawler...',
        });

        const crawlRes = await crawlWebsite(website_url);
        if (crawlRes.status === 'completed' && crawlRes.evidence.length > 0) {
          evidence.push(...crawlRes.evidence);
          await db.saveScan(crawlRes);
        }
      }

      // 3. Multi-Model Evaluation
      assessmentJobs.set(assessmentId, {
        ...assessmentJobs.get(assessmentId),
        progress: 60,
        current_step: 'Evaluating controls across LLM gateway and running grounding checks...',
      });

      // Run default primary model (M06: Llama 3.3 70B or M03: Qwen) and save findings
      const activeModel = RESEARCH_MODELS.find(m => m.id === 'M06') || RESEARCH_MODELS[0];
      const findings: ModelFinding[] = [];

      for (const ctrl of CANONICAL_CONTROLS) {
        const relevantEvidence = evidence.filter((e: any) => {
          const k = (e.key || '').toLowerCase();
          if (ctrl.pillar === 'security' && (k.includes('https') || k.includes('hsts') || k.includes('csp') || k.includes('header') || k.includes('cookie') || k.includes('breach'))) return true;
          if (ctrl.pillar === 'privacy' && (k.includes('policy') || k.includes('cmp') || k.includes('form') || k.includes('tracker') || k.includes('lang') || k.includes('purp'))) return true;
          if (ctrl.pillar === 'transparency' && k.includes('dpo')) return true;
          return true;
        });

        const finding = await gateway.evaluateSingleModel(activeModel, {
          controlId: ctrl.id,
          controlName: ctrl.name,
          pillar: ctrl.pillar,
          statutoryRef: ctrl.statutory_ref,
          retrievedLegalContext: `Statutory Mandate: ${ctrl.statutory_ref}. Data fiduciaries are subject to strict compliance under DPDP statutory provisions.`,
          observedEvidence: relevantEvidence,
        });

        const gRes = validator.validateFinding(finding, evidence);
        finding.is_grounded = gRes.isValid;
        finding.grounding_score = gRes.groundingScore;
        findings.push(finding);
      }

      // Compute Trust Score
      const trustScoreResult = computeModelTrustScore(activeModel.id, findings);
      await db.saveFindings(assessmentId, activeModel.id, findings);
      await db.saveTrustScore(assessmentId, trustScoreResult);

      const passCount = findings.filter(f => f.verdict === 'SUPPORTED').length;
      const gapCount = findings.filter(f => f.verdict === 'NOT_SUPPORTED' || f.verdict === 'PARTIALLY_SUPPORTED').length;

      assessmentJobs.set(assessmentId, {
        assessment_id: assessmentId,
        org_id,
        website_url,
        status: 'complete',
        progress: 100,
        current_step: 'Assessment complete.',
        trust_score: trustScoreResult.trust_score,
        posture: trustScoreResult.posture,
        evidence_coverage: trustScoreResult.evidence_coverage,
        pillar_scores: Object.values(trustScoreResult.pillar_scores),
        findings,
        evidence,
        total_controls: CANONICAL_CONTROLS.length,
        pass_count: passCount,
        potential_gap_count: gapCount,
        completed_at: new Date().toISOString(),
      });
      console.log(`[Assessment Complete] Assessment ${assessmentId} finished with score ${trustScoreResult.trust_score} (${trustScoreResult.posture}).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Assessment ${assessmentId} failed:`, msg);
      assessmentJobs.set(assessmentId, {
        ...assessmentJobs.get(assessmentId),
        status: 'failed',
        error: msg,
      });
    }
  })();
});

router.get('/assessments/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = assessmentJobs.get(id);

  if (!job) {
    res.status(404).json({ error: `Assessment ${id} not found.` });
    return;
  }

  res.json(job);
});

export default router;
