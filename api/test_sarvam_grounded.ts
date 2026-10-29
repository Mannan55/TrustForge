import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { GroundingValidator } from './src/validator/groundingValidator.js';
import { CANONICAL_CONTROLS } from './src/scoring/trustScoreEngine.js';

async function testSarvamGrounded() {
  console.log('=== Real Grounded DPDP Inference on Sarvam 105B ===\n');

  const key = process.env.SARVAM_API_KEY;
  const validator = new GroundingValidator();
  const ctrl = CANONICAL_CONTROLS[0]; // TF-PRIV-001
  const legalContext = 'DPDP Act 2023 Section 5(1): On or before requesting for personal data, the Data Fiduciary shall give to the Data Principal an itemised notice in such manner as may be prescribed, containing description of personal data sought and purpose of processing.';
  const evidence = [
    {
      id: 'EVID_NOTICE_01',
      source_type: 'WEBSITE_SCAN' as const,
      source_url: 'https://example-dpdp.in/privacy',
      key: 'privacy_notice_content',
      label: 'Privacy Notice',
      value: 'We collect personal data solely for account management and do not sell data to third parties under any circumstances.',
      status: 'VERIFIED' as const,
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
    },
  ];

  const prompt = `You are an evidence-grounded legal compliance evaluation engine for the Indian DPDP Act, 2023.
TARGET: https://example-dpdp.in

OBSERVED EVIDENCE:
[EVID_NOTICE_01] Privacy Notice: We collect personal data solely for account management and do not sell data to third parties under any circumstances.

CANONICAL DPDP CONTROLS & STATUTORY PASSAGES:
[TF-PRIV-001] Privacy Notice Itemisation | Mandate: DPDP Act 2023, Section 5(1)
Statutory Excerpt: ${legalContext}

EVALUATION RUBRIC:
Determine whether observed evidence satisfies the statutory obligation.
Return ONLY valid JSON matching:
{
  "model_id": "M09",
  "findings": [
    {
      "control_id": "TF-PRIV-001",
      "verdict": "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED" | "INSUFFICIENT_EVIDENCE",
      "confidence": 0.8,
      "legal_citations": [{"source_document": "dpdp-act-2023", "section": "Section 5(1)", "verbatim_quote": "give to the Data Principal an itemised notice"}],
      "evidence_ids": ["EVID_NOTICE_01"],
      "quoted_evidence": "do not sell data to third parties under any circumstances",
      "reasoning_summary": "<evidence assessment>"
    }
  ]
}`;

  const t0 = Date.now();
  const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': key!,
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'sarvam-105b-conversations',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 350,
      response_format: { type: 'json_object' },
    }),
  });

  const durationMs = Date.now() - t0;
  console.log(`HTTP Status: ${res.status} ${res.statusText} (${durationMs}ms)`);
  const data = await res.json() as any;
  console.log(`Usage:`, data.usage);
  const costInr = ((data.usage?.prompt_tokens || 0) * 0.00010) + ((data.usage?.completion_tokens || 0) * 0.00015);
  console.log(`Cost: ₹${costInr.toFixed(4)}`);

  const content = data.choices?.[0]?.message?.content;
  console.log(`\nContent Output:\n${content}`);

  const parsed = JSON.parse(content);
  const finding = parsed.findings?.[0];
  finding.model_id = 'M09';

  const gResult = validator.validateAndEnforceFinding(finding, evidence, {
    controlId: 'TF-PRIV-001',
    statutoryRef: 'Section 5(1)',
    combinedContextText: legalContext,
    chunks: [],
    retrievedAt: new Date().toISOString(),
  } as any);

  console.log(`\n=== STRICT GROUNDING VALIDATION RESULTS ===`);
  console.log(`Is Valid: ${gResult.isValid}`);
  console.log(`Is Grounded: ${finding.is_grounded}`);
  console.log(`Effective Verdict: ${finding.verdict}`);
  console.log(`Raw Verdict: ${finding.raw_verdict ?? finding.verdict}`);
  console.log(`Rejection Reason: ${finding.rejection_reason ?? 'None (Grounded)'}`);
  console.log(`Grounding Score: ${finding.grounding_score}`);
}

testSarvamGrounded().catch(console.error);

