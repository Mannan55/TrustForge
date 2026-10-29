/**
 * Phase 7: Complete Research Pipeline Integration, Live RAG Visualization & End-to-End Validation Test Suite.
 * Validates the 10-stage RAG execution tracer, interactive legal retrieval explorer (C1-C10 top 5 passages with RRF),
 * evidence-to-verdict traceability chains, 10-model gateway telemetry with integrity blocker notes,
 * lazy artifact generation for historical assessments, and tenant isolation on all sub-endpoints.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RAGExecutionTracer,
  RAGStageEvent,
  RAGExecutionTrace,
  LegalRetrievalExplorerRecord,
  EvidenceToVerdictTraceItem,
  ModelExecutionTraceItem,
} from '../rag/ragExecutionTracer.js';
import { hybridRAG, HybridLegalContext } from '../rag/hybridRAG.js';
import { GroundingValidator } from '../validator/groundingValidator.js';
import { durableStore } from '../database/durableStore.js';
import { AssessmentRecord } from '../database/repository.js';
import { ensureAssessmentRAGArtifacts } from '../routes/assessments.js';
import { CANONICAL_CONTROLS } from '../scoring/trustScoreEngine.js';
import { CANONICAL_CONTROL_TO_C10 } from '../scoring/pillarMappingAdapter.js';
import { EvidenceItem, ModelFinding } from '../types/index.js';

// ============================================================================
// 1. RAG 10-Stage Execution Tracer Tests
// ============================================================================

test('Phase 7.1: RAG execution tracer initializes trace with 10 sequential stages', () => {
  const assessmentId = `ASM_TEST_${Date.now()}`;
  const targetUrl = 'https://example-enterprise.in';
  const trace = RAGExecutionTracer.createInitialTrace(assessmentId, targetUrl);

  assert.equal(trace.assessment_id, assessmentId);
  assert.equal(trace.target_url, targetUrl);
  assert.equal(trace.status, 'IN_PROGRESS');
  assert.equal(trace.stages.length, 10);

  // Verify all 10 canonical stages are present in order
  const expectedStageKeys = [
    'WEBSITE_EVIDENCE',
    'KNOWLEDGE_ACCESS',
    'BM25_RETRIEVAL',
    'VECTOR_RETRIEVAL',
    'RRF_FUSION',
    'PASSAGE_SELECTION',
    'FROZEN_CONTEXT',
    'LLM_ASSESSMENT',
    'GROUNDING_VERIFICATION',
    'TRUST_SCORE_GEN',
  ];

  trace.stages.forEach((stage: RAGStageEvent, idx: number) => {
    assert.equal(stage.stage_id, idx + 1);
    assert.equal(stage.stage_key, expectedStageKeys[idx]);
    assert.equal(stage.status, 'PENDING');
    assert.equal(stage.duration_ms, 0);
  });
});

test('Phase 7.2: Stage lifecycle transitions and measures real non-negative execution duration', async () => {
  const assessmentId = `ASM_TIMER_${Date.now()}`;
  let trace = RAGExecutionTracer.createInitialTrace(assessmentId, 'https://test.in');

  const now = Date.now();
  // Start Stage 1
  trace = RAGExecutionTracer.updateStage(trace, 1, 'RUNNING', {
    started_at: new Date(now).toISOString(),
    details: { method: 'playwright', pages_crawled: 1 },
  });
  assert.equal(trace.stages[0].status, 'RUNNING');

  // Small sleep to ensure measured duration > 0
  await new Promise((resolve) => setTimeout(resolve, 20));

  // Complete Stage 1
  const tEnd = Date.now();
  trace = RAGExecutionTracer.updateStage(trace, 1, 'COMPLETED', {
    started_at: new Date(now).toISOString(),
    completed_at: new Date(tEnd).toISOString(),
    duration_ms: tEnd - now,
    details: { evidence_collected: 8, cookies_found: 3 },
  });

  assert.equal(trace.stages[0].status, 'COMPLETED');
  assert.ok((trace.stages[0].duration_ms ?? 0) >= 15, 'Stage duration should be at least 15ms');
  assert.equal(trace.stages[0].details.evidence_collected, 8);
});

test('Phase 7.3: Trace finalization computes total elapsed duration and records frozen snapshot hash', () => {
  const assessmentId = `ASM_FINALIZE_${Date.now()}`;
  let trace = RAGExecutionTracer.createInitialTrace(assessmentId, 'https://final.in');
  const dummyHash = 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890';

  const completedTrace = RAGExecutionTracer.finalizeTrace(trace, 'COMPLETED', dummyHash);
  assert.equal(completedTrace.status, 'COMPLETED');
  assert.equal(completedTrace.frozen_snapshot_hash, dummyHash);
  assert.ok(completedTrace.completed_at != null);
  assert.ok(completedTrace.total_duration_ms >= 0);
});

// ============================================================================
// 2. Interactive Legal Retrieval Explorer Tests (C1-C10 Top 5 Passages)
// ============================================================================

test('Phase 7.4: Retrieval explorer formats records for all 20 canonical controls across C1-C10', async () => {
  const snapshot = await hybridRAG.buildFrozenSnapshot(CANONICAL_CONTROLS, {
    topK: 5,
    categoryMap: CANONICAL_CONTROL_TO_C10,
  });

  const explorerRecords = RAGExecutionTracer.buildRetrievalExplorerRecords(snapshot.contexts);
  assert.equal(explorerRecords.length, CANONICAL_CONTROLS.length);

  // Check C1 Notice record (TF-PRIV-001)
  const noticeRec = explorerRecords.find((r: LegalRetrievalExplorerRecord) => r.control_id === 'TF-PRIV-001');
  assert.ok(noticeRec);
  assert.equal(noticeRec.c10_obligation_id, 'C1');
  assert.ok(noticeRec.c10_obligation_name.length > 0);
  assert.equal(noticeRec.fusion_constant, 60);
  assert.ok(noticeRec.retrieved_passages.length <= 5);
  assert.ok(noticeRec.retrieved_passages.length > 0);
});

test('Phase 7.5: Top-5 retrieved passages exhibit strictly descending RRF scores and academic rationales', async () => {
  const ctrl = CANONICAL_CONTROLS.find((c) => c.id === 'TF-PRIV-003')!; // Consent
  const ctx = await hybridRAG.retrieveContextForControl(ctrl.id, ctrl.statutory_ref, ctrl.name, { topK: 5 });
  const records = RAGExecutionTracer.buildRetrievalExplorerRecords({ [ctrl.id]: ctx });

  const consentRecord = records[0];
  const passages = consentRecord.retrieved_passages;
  assert.ok(passages.length > 0);

  // Verify descending RRF scores
  for (let i = 1; i < passages.length; i++) {
    assert.ok(
      passages[i - 1].rrf_score >= passages[i].rrf_score,
      `Passage rank ${i} score (${passages[i - 1].rrf_score}) must be >= rank ${i + 1} score (${passages[i].rrf_score})`
    );
  }

  // Verify each passage has complete academic metadata
  passages.forEach((p: any, idx: number) => {
    assert.equal(p.rank, idx + 1);
    assert.ok(p.chunk_id.length > 0);
    assert.ok(p.section.length > 0);
    assert.ok(p.source_document.length > 0);
    assert.ok(p.text.length > 20);
    assert.ok(p.retrieval_rationale.length > 10, 'Academic selection rationale must be populated');
  });
});

// ============================================================================
// 3. Evidence-to-Verdict Traceability Matrix Tests
// ============================================================================

test('Phase 7.6: Builds complete evidence-to-verdict audit chain with grounding enforcement', async () => {
  const snapshot = await hybridRAG.buildFrozenSnapshot(CANONICAL_CONTROLS, {
    topK: 5,
    categoryMap: CANONICAL_CONTROL_TO_C10,
  });

  const findings: ModelFinding[] = [
    {
      control_id: 'TF-PRIV-001',
      model_id: 'M01',
      verdict: 'SUPPORTED',
      legal_citations: [{ source_document: 'DPDP Act, 2023', section: 'Section 5(1)', verbatim_quote: 'Every data fiduciary shall give notice' }],
      reasoning_summary: 'Notice provided in clear and plain language.',
      identified_gaps: [],
      remediation_steps: ['Maintain periodic notice review.'],
      confidence: 0.95,
      is_grounded: true,
      evidence_ids: ['EV_001'],
    },
    {
      control_id: 'TF-SEC-001',
      model_id: 'M01',
      verdict: 'SUPPORTED', // Model claimed supported but citation was ungrounded
      legal_citations: [{ source_document: 'DPDP Act, 2023', section: 'Section 99(9)', verbatim_quote: 'Imaginary standard...' }],
      reasoning_summary: 'Fabricated statutory claim.',
      identified_gaps: ['Section 99 does not exist in DPDP Act 2023'],
      remediation_steps: ['Implement standard encryption controls.'],
      confidence: 0.85,
      is_grounded: false, // Ungrounded!
      rejection_reason: 'Statutory section not in corpus',
      evidence_ids: [],
    },
  ];

  const evidenceItems: EvidenceItem[] = [
    {
      id: 'EV_001',
      source_type: 'WEBSITE_SCAN',
      label: 'Privacy Policy Link',
      status: 'VERIFIED',
      extracted_at: new Date().toISOString(),
      confidence: 0.9,
      key: 'privacy_policy_url',
      value: 'https://technova.in/privacy',
    },
  ];

  const trace = RAGExecutionTracer.buildEvidenceToVerdictTrace(
    findings,
    evidenceItems,
    snapshot.contexts
  );

  assert.equal(trace.length, CANONICAL_CONTROLS.length);

  // Check TF-PRIV-001 (Grounded PASS)
  const c01Item = trace.find((t: EvidenceToVerdictTraceItem) => t.control_id === 'TF-PRIV-001');
  assert.ok(c01Item);
  assert.equal(c01Item.c10_obligation_id, 'C1');
  assert.equal(c01Item.is_grounded, true);
  assert.equal(c01Item.effective_verdict, 'SUPPORTED');
  assert.ok(c01Item.weighted_score_contribution > 0);

  // Check TF-SEC-001 (Ungrounded -> Penalized as NOT_DETERMINABLE / 0 score)
  const c07Item = trace.find((t: EvidenceToVerdictTraceItem) => t.control_id === 'TF-SEC-001');
  assert.ok(c07Item);
  assert.equal(c07Item.c10_obligation_id, 'C4');
  assert.equal(c07Item.is_grounded, false);
  assert.equal(c07Item.effective_verdict, 'NOT_DETERMINABLE', 'Ungrounded finding must be penalized');
  assert.equal(c07Item.weighted_score_contribution, 0, 'Penalized ungrounded finding must contribute 0 score');
});

// ============================================================================
// 4. 10-Model Gateway Visualization & Blocker Preservation Tests
// ============================================================================

test('Phase 7.7: Model executions trace captures all 10 slots with verified status and blocker reasons', () => {
  const modelTrace = RAGExecutionTracer.buildModelExecutionTrace({}, {}, {});
  assert.equal(modelTrace.length, 10);

  // Exactly 6 slots are verified live single-run models
  const verifiedSlots = modelTrace.filter((m: ModelExecutionTraceItem) => m.is_verified_live);
  assert.equal(verifiedSlots.length, 6, 'Exactly 6 slots (M01-M04, M08, M09) must be verified single-run live');
  const verifiedIds = verifiedSlots.map((m: ModelExecutionTraceItem) => m.model_id);
  assert.deepEqual(verifiedIds.sort(), ['M01', 'M02', 'M03', 'M04', 'M08', 'M09'].sort());

  // Exactly 4 slots are blocked/ineligible
  const blockedSlots = modelTrace.filter((m: ModelExecutionTraceItem) => !m.is_verified_live);
  assert.equal(blockedSlots.length, 4, 'Exactly 4 slots (M05, M06, M07, M10) must be blocked/ineligible');

  // Verify explicit blocker reasons
  const m05 = modelTrace.find((m: ModelExecutionTraceItem) => m.model_id === 'M05');
  assert.equal(m05?.status, 'RATE_LIMITED');
  assert.ok(m05?.blocker_reason?.includes('rate-limited'));

  const m06 = modelTrace.find((m: ModelExecutionTraceItem) => m.model_id === 'M06');
  assert.equal(m06?.status, 'INSUFFICIENT_CREDITS');
  assert.ok(m06?.blocker_reason?.includes('HTTP 403'));

  const m07 = modelTrace.find((m: ModelExecutionTraceItem) => m.model_id === 'M07');
  assert.equal(m07?.status, 'INSUFFICIENT_CREDITS');
  assert.ok(m07?.blocker_reason?.includes('HTTP 403'));

  const m10 = modelTrace.find((m: ModelExecutionTraceItem) => m.model_id === 'M10');
  assert.equal(m10?.status, 'LOCAL_OFFLINE');
  assert.ok(m10?.blocker_reason?.includes('Local Ollama'));
});

// ============================================================================
// 5. Historical Record Recovery & Browser Refresh Resilience
// ============================================================================

test('Phase 7.8: ensureAssessmentRAGArtifacts synthesizes and persists artifacts for historical jobs', async () => {
  const historicalId = `ASM_HIST_${Date.now()}`;
  const bareJob: AssessmentRecord = {
    assessment_id: historicalId,
    org_id: 'org_technova',
    website_url: 'https://technova.in',
    status: 'completed',
    progress: 100,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };

  durableStore.setAssessment(historicalId, bareJob);

  // Call lazy enricher
  const enriched = await ensureAssessmentRAGArtifacts(bareJob);

  assert.ok(enriched.rag_execution_trace != null);
  assert.equal(enriched.rag_execution_trace.stages.length, 10);
  assert.ok(enriched.retrieval_explorer != null);
  assert.ok(enriched.retrieval_explorer.length > 0);
  assert.ok(enriched.evidence_to_verdict_trace != null);
  assert.ok(enriched.model_executions != null);
  assert.equal(enriched.model_executions.length, 10);

  // Verify persistence in DurableStore
  const reloaded = durableStore.getAssessment(historicalId);
  assert.ok(reloaded?.rag_execution_trace != null);
  assert.ok(reloaded?.retrieval_explorer != null);
});

// ============================================================================
// 6. Regression Check Across All Phases (Phases 2-6)
// ============================================================================

test('Phase 7.9: Full system regression verifies Phase 2 through Phase 6 components continue to operate', async () => {
  // Phase 2: Hybrid RAG
  const ctrl = CANONICAL_CONTROLS[0];
  const ctx = await hybridRAG.retrieveContextForControl(ctrl.id, ctrl.statutory_ref, ctrl.name, { topK: 3 });
  assert.ok(ctx.chunks.length > 0);

  // Phase 3.1: Grounding Validator
  const validator = new GroundingValidator();
  const evidence: EvidenceItem[] = [
    {
      id: 'EVID_NOTICE_01',
      source_type: 'WEBSITE_SCAN',
      source_url: 'https://example.org/privacy',
      key: 'privacy_notice_content',
      label: 'Privacy Notice',
      value: 'We collect personal data solely for account management and do not sell data to third parties under any circumstances.',
      status: 'VERIFIED',
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
    },
  ];

  const finding: ModelFinding = {
    model_id: 'M01',
    control_id: 'TF-PRIV-001',
    verdict: 'SUPPORTED',
    confidence: 0.95,
    legal_citations: [{ source_document: 'dpdp-act-2023', section: 'Section 5', verbatim_quote: '' }],
    evidence_ids: ['EVID_NOTICE_01'],
    quoted_evidence: 'do not sell data to third parties under any circumstances',
    reasoning_summary: 'Verified clear commitment against data sales.',
    identified_gaps: [],
    remediation_steps: [],
  };

  const validCheck = validator.validateAndEnforceFinding(finding, evidence);
  assert.equal(validCheck.isValid, true);

  // Phase 5: TOPSIS Criteria
  const { CANONICAL_TOPSIS_CRITERIA } = await import('../research/topsisEngine.js');
  assert.equal(CANONICAL_TOPSIS_CRITERIA.length, 10);

  // Phase 6: Canonical Dataset
  const { canonicalEvaluationDataset } = await import('../evaluation/expertDataset.js');
  assert.equal(canonicalEvaluationDataset.cases.length, 20);
});
