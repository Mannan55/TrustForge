/**
 * Defensible Scientific LLM Evaluation Benchmark.
 * Evaluates live candidate models against the authoritative DPDP reference dataset
 * and computes exact confusion matrices, per-class metrics, Macro F1, and grounding rates.
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { LLMGateway, RESEARCH_MODELS, BatchControlPayload } from './src/gateway/llmGateway.js';
import { GroundingValidator } from './src/validator/groundingValidator.js';
import { hybridRAG } from './src/rag/hybridRAG.js';

interface GroundTruthCase {
  case_id: string;
  control_id: string;
  control_name: string;
  statutory_ref: string;
  evidence_input: {
    key: string;
    label: string;
    value: any;
    status: string;
  };
  expected_verdict: 'SUPPORTED' | 'NOT_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE';
  explanation: string;
  reference_source: string;
  reviewer_status: string;
}

interface GroundTruthDataset {
  dataset_name: string;
  version: string;
  review_status: string;
  review_status_clarification: string;
  label_schema: string[];
  total_cases: number;
  cases: GroundTruthCase[];
}

interface ClassMetrics {
  tp: number;
  fp: number;
  fn: number;
  support: number;
  precision: number;
  recall: number;
  f1: number;
}

interface ModelEvaluationReport {
  model_id: string;
  name: string;
  provider: string;
  actual_provider_id?: string;
  status: string;
  total_cases: number;
  correct_predictions: number;
  accuracy: number;
  macro_f1: number;
  class_metrics: Record<string, ClassMetrics>;
  confusion_matrix: Record<string, Record<string, number>>;
  grounding_rate_pct: number;
  abstention_rate_pct: number;
  mean_latency_ms: number;
  total_tokens: number;
}

async function runEvaluation() {
  console.log('========================================================================');
  console.log('TrustForge Defensible Scientific LLM Benchmark (Phase E / P1)');
  console.log('Dataset: dpdp_obligation_ground_truth_v1.json (Research-Team-Authored)');
  console.log('========================================================================\n');

  const datasetPath = path.resolve('C:/TF new V1/TrustForge/docs/research/evaluation/datasets/dpdp_obligation_ground_truth_v1.json');
  const dataset: GroundTruthDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  const gateway = new LLMGateway();
  const validator = new GroundingValidator();

  console.log(`Loaded ${dataset.cases.length} reference test cases across 7 canonical compliance domains.`);
  console.log(`Review Status: ${dataset.review_status}`);
  console.log(`Clarification: ${dataset.review_status_clarification}\n`);

  // Build batch payload from reference cases
  const controlsPayload = await Promise.all(
    dataset.cases.map(async (c, idx) => {
      const legalCtx = await hybridRAG.retrieveContextForControl(c.control_id, c.statutory_ref, c.control_name, { topK: 2 });
      return {
        id: c.case_id,
        name: `${c.control_name} (${c.case_id})`,
        pillar: 'compliance',
        statutoryRef: c.statutory_ref,
        retrievedLegalContext: legalCtx.combinedContextText || `Statutory Mandate: ${c.statutory_ref}`,
        relevantEvidence: [
          {
            id: `EVID_${c.case_id}`,
            source_type: 'ASSESSMENT_WIZARD' as const,
            key: c.evidence_input.key,
            label: c.evidence_input.label,
            value: c.evidence_input.value,
            status: c.evidence_input.status as any,
            confidence: 0.9,
            extracted_at: new Date().toISOString(),
          },
        ],
      };
    })
  );

  const batchPayload: BatchControlPayload = {
    websiteUrl: 'https://technova.in/compliance-benchmark',
    evidence: controlsPayload.flatMap(c => c.relevantEvidence),
    controls: controlsPayload,
  };

  console.log('Dispatching parallel evaluation across all candidate models...');
  const batchResult = await gateway.evaluateAllModelsBatch(batchPayload);

  const classes = dataset.label_schema;
  const reports: Record<string, ModelEvaluationReport> = {};

  for (const model of RESEARCH_MODELS) {
    const res = batchResult[model.id];

    if (!res || !res.is_real_inference || res.findings.length === 0) {
      console.log(`Model [${model.id}] ${model.name}: ${res?.status || 'UNAVAILABLE'} (Excluded from prediction metrics)`);
      continue;
    }

    // Initialize confusion matrix
    const confMatrix: Record<string, Record<string, number>> = {};
    for (const actual of classes) {
      confMatrix[actual] = {};
      for (const pred of classes) {
        confMatrix[actual][pred] = 0;
      }
    }

    let correct = 0;
    let groundedCount = 0;
    let abstentionCount = 0;

    for (const c of dataset.cases) {
      const f = res.findings.find(item => item.control_id === c.case_id);
      const actual = c.expected_verdict;
      const pred = f?.verdict && classes.includes(f.verdict) ? f.verdict : 'INSUFFICIENT_EVIDENCE';

      confMatrix[actual][pred] = (confMatrix[actual][pred] || 0) + 1;
      if (actual === pred) correct++;
      if (pred === 'INSUFFICIENT_EVIDENCE') abstentionCount++;

      if (f) {
        const gRes = validator.validateFinding(f, c.evidence_input ? [c.evidence_input as any] : []);
        if (gRes.isValid) groundedCount++;
      }
    }

    // Compute per-class precision, recall, F1
    const classMetrics: Record<string, ClassMetrics> = {};
    let sumF1 = 0;
    let activeClassCount = 0;

    for (const cls of classes) {
      const tp = confMatrix[cls]?.[cls] || 0;
      let fp = 0;
      let fn = 0;
      let support = 0;

      for (const other of classes) {
        if (other !== cls) {
          fp += confMatrix[other]?.[cls] || 0;
          fn += confMatrix[cls]?.[other] || 0;
        }
        support += confMatrix[cls]?.[other] || 0;
      }

      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      classMetrics[cls] = {
        tp,
        fp,
        fn,
        support,
        precision: Math.round(precision * 1000) / 1000,
        recall: Math.round(recall * 1000) / 1000,
        f1: Math.round(f1 * 1000) / 1000,
      };

      if (support > 0) {
        sumF1 += f1;
        activeClassCount++;
      }
    }

    const macroF1 = activeClassCount > 0 ? Math.round((sumF1 / activeClassCount) * 1000) / 1000 : 0;
    const accuracy = Math.round((correct / dataset.cases.length) * 1000) / 1000;
    const groundingRate = Math.round((groundedCount / dataset.cases.length) * 100);
    const abstentionRate = Math.round((abstentionCount / dataset.cases.length) * 100);

    reports[model.id] = {
      model_id: model.id,
      name: model.name,
      provider: model.provider,
      actual_provider_id: res.actual_model_id,
      status: 'EVALUATED_AGAINST_RESEARCH_REFERENCE_LABELS',
      total_cases: dataset.cases.length,
      correct_predictions: correct,
      accuracy,
      macro_f1: macroF1,
      class_metrics: classMetrics,
      confusion_matrix: confMatrix,
      grounding_rate_pct: groundingRate,
      abstention_rate_pct: abstentionRate,
      mean_latency_ms: Math.round(res.duration_ms / dataset.cases.length),
      total_tokens: res.total_tokens || 0,
    };
  }

  console.log(`\n========================================================================`);
  console.log(`GENUINE RESEARCH EVALUATION METRICS TABLE`);
  console.log(`Review Status: Preliminary Research-Team Reference Judgements`);
  console.log(`========================================================================`);
  console.log(`Model ID | Model Name              | Accuracy | Macro F1 | Grounding | Abstention | Tokens | Status`);
  console.log(`---------+-------------------------+----------+----------+-----------+------------+--------+----------------------------`);

  for (const model of RESEARCH_MODELS) {
    const r = reports[model.id];
    if (r) {
      console.log(
        `${r.model_id.padEnd(8)} | ${r.name.slice(0, 23).padEnd(23)} | ${(r.accuracy * 100).toFixed(1).padStart(7)}% | ${r.macro_f1.toFixed(3).padStart(8)} | ${(r.grounding_rate_pct + '%').padStart(9)} | ${(r.abstention_rate_pct + '%').padStart(10)} | ${String(r.total_tokens).padStart(6)} | VERIFIED REAL INFERENCE`
      );
    } else {
      console.log(
        `${model.id.padEnd(8)} | ${model.name.slice(0, 23).padEnd(23)} |      N/A |      N/A |       N/A |        N/A |    N/A | NOT EVALUATED (AUTH_REQ)`
      );
    }
  }

  console.log(`========================================================================\n`);

  // Print confusion matrices for live evaluated models
  for (const [mId, r] of Object.entries(reports)) {
    console.log(`--- Confusion Matrix for [${mId}] ${r.name} ---`);
    console.log(`Actual \\ Predicted       | SUPPORTED | NOT_SUPPORTED | INSUFFICIENT | NOT_APPLICABLE`);
    for (const actual of classes) {
      const row = classes.map(p => String(r.confusion_matrix[actual]?.[p] || 0).padStart(11)).join(' | ');
      console.log(`${actual.padEnd(24)} | ${row}`);
    }
    console.log('');
  }

  // Persist reproducible artifact
  const outPath = path.resolve('C:/TF new V1/TrustForge/docs/research/FINAL_RESEARCH_BENCHMARK_RESULTS.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        dataset_name: dataset.dataset_name,
        dataset_version: dataset.version,
        review_status: dataset.review_status,
        review_status_clarification: dataset.review_status_clarification,
        orchestration: batchResult.orchestration,
        reports,
      },
      null,
      2
    )
  );

  console.log(`Defensible benchmark results persisted to: ${outPath}`);
}

runEvaluation().catch(console.error);
