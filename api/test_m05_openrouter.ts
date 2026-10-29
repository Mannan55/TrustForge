import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { GroundingValidator } from './src/validator/groundingValidator.js';
import { CANONICAL_CONTROLS } from './src/scoring/trustScoreEngine.js';

async function testM05Gemma() {
  console.log('=== TASK 2: M05 (Gemma 4 26B-A4B) OpenRouter Free Inference ===\n');

  const key = process.env.OPENROUTER_API_KEY;
  const modelId = 'google/gemma-4-26b-a4b-it:free';
  const validator = new GroundingValidator();

  const ctrl = CANONICAL_CONTROLS[0]; // TF-PRIV-001 Notice Itemisation
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
[EVID_NOTICE_01] Privacy Notice (VERIFIED): We collect personal data solely for account management and do not sell data to third parties under any circumstances.

CANONICAL DPDP CONTROLS & STATUTORY PASSAGES:
[TF-PRIV-001] Privacy Notice Itemisation | Mandate: DPDP Act 2023, Section 5(1)
Statutory Excerpt: ${legalContext}

EVALUATION RUBRIC:
1. Determine whether observed evidence satisfies the statutory obligation.
2. Supported verdicts: "SUPPORTED", "PARTIALLY_SUPPORTED", "NOT_SUPPORTED", "INSUFFICIENT_EVIDENCE", "NOT_APPLICABLE".
3. Return ONLY a single raw JSON object matching:
{
  "model_id": "M05",
  "findings": [
    {
      "control_id": "TF-PRIV-001",
      "verdict": "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED" | "INSUFFICIENT_EVIDENCE" | "NOT_APPLICABLE",
      "confidence": 0.8,
      "legal_citations": [{"source_document": "dpdp-act-2023", "section": "Section 5(1)", "verbatim_quote": "give to the Data Principal an itemised notice"}],
      "evidence_ids": ["EVID_NOTICE_01"],
      "reasoning_summary": "<evidence assessment>",
      "identified_gaps": [],
      "remediation_steps": []
    }
  ]
}`;

  console.log(`Sending request to OpenRouter for ${modelId}...`);
  const t0 = Date.now();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': 'https://trustforge.research',
      'X-Title': 'TrustForge DPDP Compliance Benchmark',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  const durationMs = Date.now() - t0;
  console.log(`HTTP Status: ${res.status} ${res.statusText}`);
  console.log(`Latency: ${durationMs}ms`);

  if (res.ok) {
    const json = await res.json() as any;
    console.log(`Actual Model ID: ${json.model}`);
    console.log(`Usage:`, json.usage);
    console.log(`Cost: $${json.usage?.cost ?? 0}`);
    const content = json.choices?.[0]?.message?.content;
    console.log(`\nContent:\n${content}`);

    try {
      const parsed = JSON.parse(content);
      const finding = parsed.findings?.[0];
      if (finding) {
        finding.model_id = 'M05';
        const gResult = validator.validateAndEnforceFinding(finding, evidence, {
          controlId: 'TF-PRIV-001',
          statutoryRef: 'Section 5(1)',
          combinedContextText: legalContext,
          chunks: [],
          retrievedAt: new Date().toISOString(),
        } as any);
        console.log(`\nGrounding Result: Valid=${gResult.isValid}, IsGrounded=${finding.is_grounded}`);
        console.log(`Effective Verdict: ${finding.verdict} (Raw: ${finding.raw_verdict ?? finding.verdict})`);
        console.log(`Rejection Reason: ${finding.rejection_reason ?? 'None'}`);
      }
    } catch (e: any) {
      console.log('JSON Parse error:', e.message);
    }
  } else {
    const errText = await res.text();
    console.log(`Error Response: ${errText}`);
  }
}

testM05Gemma().catch(console.error);

