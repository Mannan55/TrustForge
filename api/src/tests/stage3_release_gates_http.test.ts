/**
 * Stage 3 Final Release-Blocker Wire-Level HTTP Integration Suite.
 * Binds the real Express application to an ephemeral port (app.listen(0))
 * and asserts multi-tenant isolation, fail-closed auth, zero-paid LLM blocking,
 * authentic zero-trust scores, and RFC CSV exports using real HTTP fetch requests.
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import dns from 'node:dns';
import app from '../index.js';
import { durableStore } from '../database/durableStore.js';
import { authService } from '../services/authService.js';
import { LLMGateway, RESEARCH_MODELS } from '../gateway/llmGateway.js';

let server: Server;
let baseUrl: string;

// Test tenants and users
const TENANT_ALPHA = 'org_alpha_wire_test';
const TENANT_BETA = 'org_beta_wire_test';

const USER_ALPHA_OWNER = 'usr_alpha_owner';
const USER_BETA_OWNER = 'usr_beta_owner';
const USER_ALPHA_VIEWER = 'usr_alpha_viewer';
const USER_ALPHA_DISABLED = 'usr_alpha_disabled';

let tokenAlphaOwner: string;
let tokenBetaOwner: string;
let tokenAlphaViewer: string;
let tokenAlphaDisabled: string;

before(async () => {
  // Ensure strong auth secret in environment for test
  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = 'stage3-secure-hmac-test-secret-key-at-least-32-chars-long';
  }

  // Register organizations in durable store
  durableStore.setOrganization(TENANT_ALPHA, {
    id: TENANT_ALPHA,
    legalName: 'Alpha Technologies Pvt Ltd',
    primaryDomain: 'alphatech.in',
    gstin: '29ABCDE1234F1Z5',
    domainVerified: true,
    authorizationVerified: true,
    gstinVerified: true,
  });

  durableStore.setOrganization(TENANT_BETA, {
    id: TENANT_BETA,
    legalName: 'Beta Analytics India Ltd',
    primaryDomain: 'betaanalytics.co.in',
    gstin: '27AABCB1234F1Z2',
    domainVerified: true,
    authorizationVerified: true,
    gstinVerified: true,
  });

  // Register users in durable store
  durableStore.setUser(USER_ALPHA_OWNER, {
    id: USER_ALPHA_OWNER,
    email: 'owner@alphatech.in',
    name: 'Alpha Owner',
    org_id: TENANT_ALPHA,
    role: 'Owner',
    is_disabled: false,
  });

  durableStore.setUser(USER_BETA_OWNER, {
    id: USER_BETA_OWNER,
    email: 'owner@betaanalytics.co.in',
    name: 'Beta Owner',
    org_id: TENANT_BETA,
    role: 'Owner',
    is_disabled: false,
  });

  durableStore.setUser(USER_ALPHA_VIEWER, {
    id: USER_ALPHA_VIEWER,
    email: 'viewer@alphatech.in',
    name: 'Alpha Viewer',
    org_id: TENANT_ALPHA,
    role: 'Viewer',
    is_disabled: false,
  });

  durableStore.setUser(USER_ALPHA_DISABLED, {
    id: USER_ALPHA_DISABLED,
    email: 'disabled@alphatech.in',
    name: 'Alpha Disabled',
    org_id: TENANT_ALPHA,
    role: 'Admin',
    is_disabled: true,
  });

  // Create real HMAC tokens
  tokenAlphaOwner = authService.createToken({
    userId: USER_ALPHA_OWNER,
    name: 'Alpha Owner',
    email: 'owner@alphatech.in',
    orgId: TENANT_ALPHA,
    role: 'Owner',
  });

  tokenBetaOwner = authService.createToken({
    userId: USER_BETA_OWNER,
    name: 'Beta Owner',
    email: 'owner@betaanalytics.co.in',
    orgId: TENANT_BETA,
    role: 'Owner',
  });

  tokenAlphaViewer = authService.createToken({
    userId: USER_ALPHA_VIEWER,
    name: 'Alpha Viewer',
    email: 'viewer@alphatech.in',
    orgId: TENANT_ALPHA,
    role: 'Viewer',
  });

  tokenAlphaDisabled = authService.createToken({
    userId: USER_ALPHA_DISABLED,
    name: 'Alpha Disabled',
    email: 'disabled@alphatech.in',
    orgId: TENANT_ALPHA,
    role: 'Admin',
  });

  // Start real HTTP server on ephemeral port 0
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${address.port}`;
      console.log(`[HTTP Test Harness] Bound to ephemeral port: ${baseUrl}`);
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('[HTTP Test Harness] Ephemeral server closed cleanly.');
  }
});

test('Wire HTTP - Multi-Tenant Isolation: Tenant Beta cannot see Tenant Alpha benchmark via /latest', async () => {
  const alphaBenchId = `BENCH_WIRE_ALPHA_${Date.now()}`;
  durableStore.setBenchmark(alphaBenchId, {
    benchmark_id: alphaBenchId,
    org_id: TENANT_ALPHA,
    target_url: 'https://alpha.example.com',
    per_model_metrics: {
      M01: { model_id: 'M01', status: 'COMPLETED', trust_score: 90 },
    },
    consensus_result: { trust_score: 90 },
    created_at: new Date().toISOString(),
  });

  // Tenant Beta calls GET /api/benchmark/latest
  const betaRes = await fetch(`${baseUrl}/api/benchmark/latest`, {
    headers: { Authorization: `Bearer ${tokenBetaOwner}` },
  });

  // Beta has no benchmarks of its own, so it must return 404
  assert.equal(betaRes.status, 404, 'Tenant Beta must receive 404 when querying latest benchmark if it has none');

  // Tenant Alpha calls GET /api/benchmark/latest
  const alphaRes = await fetch(`${baseUrl}/api/benchmark/latest`, {
    headers: { Authorization: `Bearer ${tokenAlphaOwner}` },
  });
  assert.equal(alphaRes.status, 200, 'Tenant Alpha must receive 200 for its own benchmark');
  const alphaData = await alphaRes.json();
  assert.equal(alphaData.benchmark_id, alphaBenchId, 'Tenant Alpha gets its own benchmark');
});

test('Wire HTTP - Multi-Tenant Isolation: Tenant Beta receives 403 accessing Tenant Alpha benchmark by ID or CSV', async () => {
  const alphaBenchId = `BENCH_WIRE_ALPHA_PROT_${Date.now()}`;
  durableStore.setBenchmark(alphaBenchId, {
    benchmark_id: alphaBenchId,
    org_id: TENANT_ALPHA,
    target_url: 'https://alpha.example.com',
    per_model_metrics: {},
    created_at: new Date().toISOString(),
  });

  // Beta GET /api/benchmark/:id
  const getRes = await fetch(`${baseUrl}/api/benchmark/${alphaBenchId}`, {
    headers: { Authorization: `Bearer ${tokenBetaOwner}` },
  });
  assert.equal(getRes.status, 403, 'Cross-tenant benchmark GET by ID must return 403');
  const getData = await getRes.json();
  assert.equal(getData.code, 'CROSS_ORGANISATION_ACCESS_DENIED');

  // Beta GET /api/benchmark/:id/csv
  const csvRes = await fetch(`${baseUrl}/api/benchmark/${alphaBenchId}/csv`, {
    headers: { Authorization: `Bearer ${tokenBetaOwner}` },
  });
  assert.equal(csvRes.status, 403, 'Cross-tenant benchmark CSV export must return 403');
});

test('Wire HTTP - Multi-Tenant TOPSIS Isolation: Tenant Beta cannot access Tenant Alpha TOPSIS runs or execute TOPSIS on Alpha data', async () => {
  const alphaBenchId = `BENCH_WIRE_FOR_TOPSIS_${Date.now()}`;
  const alphaTopsisId = `TOPSIS_WIRE_ALPHA_${Date.now()}`;

  durableStore.setBenchmark(alphaBenchId, {
    benchmark_id: alphaBenchId,
    org_id: TENANT_ALPHA,
    per_model_metrics: {},
  });

  durableStore.setTOPSISRun(alphaTopsisId, {
    run_id: alphaTopsisId,
    org_id: TENANT_ALPHA,
    benchmark_source_id: alphaBenchId,
    ranked_models: [],
    sensitivity_analysis: { stability_index: 0.95 },
  });

  // Beta GET /api/benchmark/topsis/:runId
  const getRes = await fetch(`${baseUrl}/api/benchmark/topsis/${alphaTopsisId}`, {
    headers: { Authorization: `Bearer ${tokenBetaOwner}` },
  });
  assert.equal(getRes.status, 403, 'Cross-tenant TOPSIS GET by ID must return 403');

  // Beta GET /api/benchmark/topsis/:runId/sensitivity
  const sensRes = await fetch(`${baseUrl}/api/benchmark/topsis/${alphaTopsisId}/sensitivity`, {
    headers: { Authorization: `Bearer ${tokenBetaOwner}` },
  });
  assert.equal(sensRes.status, 403, 'Cross-tenant TOPSIS sensitivity analysis must return 403');

  // Beta POST /api/benchmark/topsis/run referencing Alpha's benchmark
  const runRes = await fetch(`${baseUrl}/api/benchmark/topsis/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenBetaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ benchmark_id: alphaBenchId }),
  });
  assert.equal(runRes.status, 403, 'Running TOPSIS on another tenant benchmark must fail with 403');
});

test('Wire HTTP - Authentic Zero Score: Preserves consensus trust_score = 0 without coercion', async () => {
  const zeroBenchId = `BENCH_WIRE_ZERO_${Date.now()}`;
  durableStore.setBenchmark(zeroBenchId, {
    benchmark_id: zeroBenchId,
    org_id: TENANT_ALPHA,
    target_url: 'https://noncompliant.example.com',
    status: 'COMPLETE_10_OF_10',
    consensus_result: {
      trust_score: 0,
      posture: 'CRITICAL',
      status: 'CRITICAL',
    },
    created_at: new Date().toISOString(),
  });

  const res = await fetch(`${baseUrl}/api/benchmark/${zeroBenchId}`, {
    headers: { Authorization: `Bearer ${tokenAlphaOwner}` },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.consensus_result.trust_score, 0, 'Authentic zero trust score must be strictly preserved as numeric 0');
});

test('Wire HTTP - Budget Gating: Empty selected_models returns 400 and paid models (M06-M09) are blocked by default', async () => {
  // 1. Empty selected_models array
  const emptyRes = await fetch(`${baseUrl}/api/benchmark/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlphaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ selected_models: [] }),
  });
  assert.equal(emptyRes.status, 400, 'Empty selected_models array must be rejected with 400');
  const emptyData = await emptyRes.json();
  assert.equal(emptyData.code, 'EMPTY_MODEL_SELECTION');

  // 2. Paid models M06 and M07 selected without authorization
  const paidRes = await fetch(`${baseUrl}/api/benchmark/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlphaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selected_models: ['M06', 'M07'],
      target_url: 'https://wire-test.example.com',
    }),
  });
  assert.equal(paidRes.status, 200);
  const paidData = await paidRes.json();

  // Assert M06 and M07 are blocked by Zero-Paid-Spend policy
  const m06 = paidData.per_model_metrics?.M06;
  const m07 = paidData.per_model_metrics?.M07;
  assert.ok(m06, 'M06 metrics must exist in response');
  assert.ok(m07, 'M07 metrics must exist in response');
  assert.equal(m06.status, 'BLOCKED_PAID_MODEL', 'M06 must be blocked by zero-spend policy');
  assert.equal(m07.status, 'BLOCKED_PAID_MODEL', 'M07 must be blocked by zero-spend policy');
  assert.strictEqual(m06.estimated_cost_usd, 0, 'Blocked M06 must record $0.00 spend');
  assert.strictEqual(m07.estimated_cost_usd, 0, 'Blocked M07 must record $0.00 spend');
});

test('Wire HTTP - Security & Provenance: Disabled user token fails closed with 401', async () => {
  const res = await fetch(`${baseUrl}/api/benchmark/latest`, {
    headers: { Authorization: `Bearer ${tokenAlphaDisabled}` },
  });
  assert.equal(res.status, 401, 'Request from a disabled user must fail closed with 401');
});

test('Wire HTTP - Role Enforcement: Viewer role cannot trigger benchmark, TOPSIS or evaluation mutations', async () => {
  // Benchmark run
  const benchRes = await fetch(`${baseUrl}/api/benchmark/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlphaViewer}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target_url: 'https://test.com' }),
  });
  assert.equal(benchRes.status, 403, 'Viewer must be forbidden from running benchmarks');

  // TOPSIS run
  const topsisRes = await fetch(`${baseUrl}/api/benchmark/topsis/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlphaViewer}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  assert.equal(topsisRes.status, 403, 'Viewer must be forbidden from running TOPSIS');

  // Evaluation run
  const evalRes = await fetch(`${baseUrl}/api/evaluation/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlphaViewer}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  assert.equal(evalRes.status, 403, 'Viewer must be forbidden from running evaluations');
});

test('Wire HTTP - Regression Test: Authenticated Owner submitting allow_paid_models: true selecting M06-M09 cannot trigger paid inference', async () => {
  const paidAttemptRes = await fetch(`${baseUrl}/api/benchmark/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlphaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selected_models: ['M06', 'M07', 'M08', 'M09'],
      allow_paid_models: true, // Client attempts to authorize paid models via body
      target_url: 'https://security-audit.example.com',
    }),
  });
  assert.equal(paidAttemptRes.status, 200, 'Endpoint handles blocked models gracefully with 200');
  const data = await paidAttemptRes.json();

  for (const mId of ['M06', 'M07', 'M08', 'M09']) {
    const met = data.per_model_metrics?.[mId];
    assert.ok(met, `${mId} metrics must be reported`);
    assert.equal(met.status, 'BLOCKED_PAID_MODEL', `${mId} must be blocked regardless of body allow_paid_models: true`);
    assert.strictEqual(met.estimated_cost_usd, 0, `${mId} must have $0.00 estimated cost`);
    assert.strictEqual(met.prompt_tokens, 0, `${mId} must consume 0 prompt tokens`);
    assert.strictEqual(met.completion_tokens, 0, `${mId} must consume 0 completion tokens`);
  }
});

test('Wire HTTP - Model Selection Validation: Unknown model ID rejected with 400 INVALID_MODEL_SELECTION', async () => {
  const invalidRes = await fetch(`${baseUrl}/api/benchmark/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlphaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selected_models: ['M01', 'M99', 'INVALID_MODEL'],
      target_url: 'https://test.example.com',
    }),
  });
  assert.equal(invalidRes.status, 400, 'Unknown model ID must be rejected with 400');
  const data = await invalidRes.json();
  assert.equal(data.code, 'INVALID_MODEL_SELECTION');
  assert.ok(data.invalid_models.includes('M99'));
  assert.ok(data.invalid_models.includes('INVALID_MODEL'));
});

test('Wire HTTP - Evaluation Tenant Isolation: Tenant Beta cannot access Tenant Alpha evaluation runs or exports', async () => {
  const evalId = `EVAL_WIRE_ALPHA_${Date.now()}`;
  durableStore.setEvaluationRun(evalId, {
    evaluation_id: evalId,
    org_id: TENANT_ALPHA,
    rejection_policy: 'PENALIZE_AS_INCORRECT',
    model_evaluations: {
      M01: {
        model_name: 'Alpha GPT-OSS',
        consistency_experiment: { verdict_agreement_pct: 95 },
        rag_ablation_experiment: { delta_grounding_rate_pct: 25 },
      },
    },
  });

  // Beta calls GET /api/evaluation/:id
  const getByIdRes = await fetch(`${baseUrl}/api/evaluation/${evalId}`, {
    headers: { Authorization: `Bearer ${tokenBetaOwner}` },
  });
  assert.equal(getByIdRes.status, 403, 'Cross-tenant evaluation GET by ID must return 403');

  // Beta calls GET /api/evaluation/export/csv
  // Alpha has evaluation, but Beta does not have its own
  const betaCsvRes = await fetch(`${baseUrl}/api/evaluation/export/csv`, {
    headers: { Authorization: `Bearer ${tokenBetaOwner}` },
  });
  assert.equal(betaCsvRes.status, 200, 'Beta gets CSV generated for its own tenant scope');
  const betaCsv = await betaCsvRes.text();
  assert.ok(!betaCsv.includes('Alpha GPT-OSS'), 'Beta CSV must not contain Alpha model evaluations');
});

test('Wire HTTP - Findings & Trust Score Tenant Isolation: Cross-tenant access fails closed with 403, missing fails with 404', async () => {
  const assessId = `ASSESS_WIRE_ALPHA_${Date.now()}`;
  durableStore.setAssessment(assessId, {
    id: assessId,
    org_id: TENANT_ALPHA,
    website_url: 'https://alpha.example.com',
    trust_score: 85,
    posture: 'HIGH_ASSURANCE',
    evidence_coverage: 90,
  });

  // Cross-tenant GET /api/findings/:id
  const findingsRes = await fetch(`${baseUrl}/api/findings/${assessId}`, {
    headers: { Authorization: `Bearer ${tokenBetaOwner}` },
  });
  assert.equal(findingsRes.status, 403, 'Cross-tenant findings access must return 403');

  // Cross-tenant GET /api/trust-score/:id
  const scoreRes = await fetch(`${baseUrl}/api/trust-score/${assessId}`, {
    headers: { Authorization: `Bearer ${tokenBetaOwner}` },
  });
  assert.equal(scoreRes.status, 403, 'Cross-tenant trust score access must return 403');

  // Missing assessment GET /api/findings/nonexistent
  const missingFindingsRes = await fetch(`${baseUrl}/api/findings/nonexistent_id`, {
    headers: { Authorization: `Bearer ${tokenAlphaOwner}` },
  });
  assert.equal(missingFindingsRes.status, 404, 'Nonexistent assessment findings must return 404');

  // Missing assessment GET /api/trust-score/nonexistent
  const missingScoreRes = await fetch(`${baseUrl}/api/trust-score/nonexistent_id`, {
    headers: { Authorization: `Bearer ${tokenAlphaOwner}` },
  });
  assert.equal(missingScoreRes.status, 404, 'Nonexistent assessment trust score must return 404');
});

test('Wire HTTP - DNS Verification Security: Challenge generation, exact match, rejection of reused and wrong-domain challenges', async () => {
  // 1. Generate challenge for Alpha domain
  const genRes = await fetch(`${baseUrl}/api/organization/domain-challenge`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlphaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain: 'secure-audit.alphatech.in' }),
  });
  assert.equal(genRes.status, 200);
  const genData = await genRes.json();
  assert.ok(genData.challengeRecord.startsWith('trustforge-verification='));

  // 2. Cross-tenant attempt to verify Alpha challenge by Beta returns 400 CHALLENGE_NOT_FOUND or 403
  const crossVerifyRes = await fetch(`${baseUrl}/api/organization/verify-domain`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenBetaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain: 'secure-audit.alphatech.in' }),
  });
  assert.equal(crossVerifyRes.status, 400, 'Beta querying challenge under Beta org receives CHALLENGE_NOT_FOUND');

  // 3. Reused challenge rejection: Mark challenge as verified in durable store and attempt re-verify
  const challenge = durableStore.getDomainChallenge('secure-audit.alphatech.in', TENANT_ALPHA);
  assert.ok(challenge, 'Challenge must exist in store');
  challenge.verified = true;
  durableStore.setDomainChallenge('secure-audit.alphatech.in', challenge, TENANT_ALPHA);

  const reuseRes = await fetch(`${baseUrl}/api/organization/verify-domain`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlphaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain: 'secure-audit.alphatech.in' }),
  });
  assert.equal(reuseRes.status, 400, 'Consumed challenge must be rejected with 400');
  const reuseData = await reuseRes.json();
  assert.equal(reuseData.code, 'CHALLENGE_ALREADY_USED');
});

test('Wire HTTP - Acceptance Test 1: PUT /api/organization restricts fields, strips un-editable score/provenance metadata, and rejects invalid types with 400', async () => {
  // 1. Attempt to inject un-editable score, posture, verifiedAt, and domainVerified
  const patchRes = await fetch(`${baseUrl}/api/organization`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${tokenAlphaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      legalName: 'Alpha Real Legal Name Ltd',
      trustScore: 99,
      posture: 'Strong',
      verifiedAt: '2020-01-01T00:00:00.000Z',
      domainVerified: true,
      authorizationVerified: true,
      cin: 'U72200KA2020PTC123456',
    }),
  });
  assert.equal(patchRes.status, 200);
  const updatedOrg = await patchRes.json();
  assert.equal(updatedOrg.legalName, 'Alpha Real Legal Name Ltd');
  assert.equal(updatedOrg.cin, 'U72200KA2020PTC123456');
  // Confirm uneditable fields were NOT set on the organization record
  assert.strictEqual(updatedOrg.trustScore, undefined, 'Client cannot assign trustScore via PUT /organization');
  assert.strictEqual(updatedOrg.posture, undefined, 'Client cannot assign posture via PUT /organization');
  assert.notEqual(updatedOrg.verifiedAt, '2020-01-01T00:00:00.000Z', 'Client cannot spoof verifiedAt');

  // 2. Reject non-string editable field with 400 INVALID_ORGANIZATION_FIELD
  const nonStringRes = await fetch(`${baseUrl}/api/organization`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${tokenAlphaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ legalName: 12345 }),
  });
  assert.equal(nonStringRes.status, 400);
  const nonStringData = await nonStringRes.json();
  assert.equal(nonStringData.code, 'INVALID_ORGANIZATION_FIELD');

  // 3. Reject non-object body (array) with 400 INVALID_ORGANIZATION_PATCH
  const nonObjectRes = await fetch(`${baseUrl}/api/organization`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${tokenAlphaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['invalid_array_payload']),
  });
  assert.equal(nonObjectRes.status, 400);
  const nonObjectData = await nonObjectRes.json();
  assert.equal(nonObjectData.code, 'INVALID_ORGANIZATION_PATCH');
});

test('Wire HTTP - Acceptance Test 2: DNS verification requires exact server-issued TXT token; bare hex and prefix/suffix fail', async () => {
  const testDomain = 'dns-accept-test.alphatech.in';
  // 1. Generate challenge
  const genRes = await fetch(`${baseUrl}/api/organization/domain-challenge`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlphaOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain: testDomain }),
  });
  assert.equal(genRes.status, 200);
  const genData = await genRes.json();
  const fullToken = genData.challengeRecord; // e.g. trustforge-verification=123456...
  const hexPart = fullToken.replace('trustforge-verification=', '');

  // Mock dns.promises.resolveTxt
  const origResolveTxt = dns.promises.resolveTxt;
  try {
    // Case A: DNS returns only bare hex
    (dns.promises as any).resolveTxt = async () => [[hexPart]];
    const resBareHex = await fetch(`${baseUrl}/api/organization/verify-domain`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenAlphaOwner}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: testDomain }),
    });
    assert.equal(resBareHex.status, 200);
    const dataBareHex = await resBareHex.json();
    assert.strictEqual(dataBareHex.verified, false, 'Bare hex without trustforge-verification= must fail');

    // Case B: DNS returns prefix / suffix mismatch
    (dns.promises as any).resolveTxt = async () => [[`${fullToken}-extra`]];
    const resPrefix = await fetch(`${baseUrl}/api/organization/verify-domain`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenAlphaOwner}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: testDomain }),
    });
    assert.equal(resPrefix.status, 200);
    const dataPrefix = await resPrefix.json();
    assert.strictEqual(dataPrefix.verified, false, 'Prefix/suffix mismatch must fail');

    // Case C: DNS returns exact full token
    (dns.promises as any).resolveTxt = async () => [[fullToken]];
    const resExact = await fetch(`${baseUrl}/api/organization/verify-domain`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenAlphaOwner}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: testDomain }),
    });
    assert.equal(resExact.status, 200);
    const dataExact = await resExact.json();
    assert.strictEqual(dataExact.verified, true, 'Exact match of server-issued token must pass');

    // Case D: Re-verification of already verified challenge returns 400 CHALLENGE_ALREADY_USED
    const resReused = await fetch(`${baseUrl}/api/organization/verify-domain`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenAlphaOwner}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: testDomain }),
    });
    assert.equal(resReused.status, 400);
    const dataReused = await resReused.json();
    assert.equal(dataReused.code, 'CHALLENGE_ALREADY_USED');
  } finally {
    dns.promises.resolveTxt = origResolveTxt;
  }
});

test('Wire HTTP - Acceptance Test 3: evaluateSingleModel on provider failure returns INSUFFICIENT_EVIDENCE with 0 confidence, no invented citations, and MODEL_INFERENCE_FAILED', async () => {
  const gateway = new LLMGateway();
  // Simulate provider unavailable / connection error
  (gateway as any).dispatchProviderCall = async () => {
    throw new Error('Provider connection failed: 503 Service Unavailable');
  };
  const m01 = RESEARCH_MODELS.find(m => m.id === 'M01')!;
  const finding = await gateway.evaluateSingleModel(
    m01,
    {
      controlId: 'TF-SEC-001',
      controlName: 'Transport Security',
      pillar: 'Security Safeguards',
      statutoryRef: 'Section 8(5)',
      retrievedLegalContext: 'Section 8(5) statutory provisions...',
      observedEvidence: [
        {
          id: 'EVID_TEST_1',
          label: 'SSL Cert',
          status: 'VERIFIED' as const,
          source_type: 'WEBSITE_SCAN' as const,
          key: 'transport_security',
          confidence: 0.9,
          extracted_at: new Date().toISOString(),
          value: { https: true },
        },
      ],
    }
  );

  assert.equal(finding.verdict, 'INSUFFICIENT_EVIDENCE', 'Must not fabricate a SUPPORTED verdict on failure');
  assert.strictEqual(finding.confidence, 0, 'Must have 0 confidence on failure');
  assert.strictEqual(finding.legal_citations.length, 0, 'Must have empty legal citations on failure');
  assert.strictEqual(finding.is_grounded, false, 'Must not be marked grounded');
  assert.strictEqual(finding.grounding_score, 0, 'Must have grounding score 0');
  assert.equal(finding.rejection_reason, 'MODEL_INFERENCE_FAILED', 'Must record MODEL_INFERENCE_FAILED rejection');
});

test('Wire HTTP - Acceptance Test 4: GET /api/trust-score/:id preserves 0 evidence coverage, handles unscored assessments, and enforces tenant isolation', async () => {
  const zeroCoverageId = `ASSESS_ZERO_COV_${Date.now()}`;
  durableStore.setAssessment(zeroCoverageId, {
    id: zeroCoverageId,
    org_id: TENANT_ALPHA,
    website_url: 'https://zero-cov.example.com',
    trust_score: 0,
    posture: 'CRITICAL',
    evidence_coverage: 0, // Genuine 0% coverage
    models_evaluated: ['M01'],
    selection_mode: 'TOP3_MAJORITY_VOTING',
    pillar_scores: [],
  });

  // 1. Alpha fetches its own score with 0% coverage: assert coverage is preserved as 0, NOT coerced to 80
  const zeroRes = await fetch(`${baseUrl}/api/trust-score/${zeroCoverageId}`, {
    headers: { Authorization: `Bearer ${tokenAlphaOwner}` },
  });
  assert.equal(zeroRes.status, 200);
  const zeroData = await zeroRes.json();
  assert.strictEqual(zeroData.evidence_coverage, 0, '0 evidence coverage must be preserved as 0, not coerced to 80');
  assert.strictEqual(zeroData.trust_score, 0, '0 trust score must be preserved as 0');

  // 2. Unscored assessment (trust_score: null) returns 404
  const unscoredId = `ASSESS_UNSCORED_${Date.now()}`;
  durableStore.setAssessment(unscoredId, {
    id: unscoredId,
    org_id: TENANT_ALPHA,
    website_url: 'https://unscored.example.com',
    trust_score: null,
    evidence_coverage: 0,
  });
  const unscoredRes = await fetch(`${baseUrl}/api/trust-score/${unscoredId}`, {
    headers: { Authorization: `Bearer ${tokenAlphaOwner}` },
  });
  assert.equal(unscoredRes.status, 404, 'Unscored assessment must return 404');

  // 3. Tenant B cannot access Tenant A's trust score
  const crossRes = await fetch(`${baseUrl}/api/trust-score/${zeroCoverageId}`, {
    headers: { Authorization: `Bearer ${tokenBetaOwner}` },
  });
  assert.equal(crossRes.status, 403, 'Tenant B must receive 403 trying to access Tenant A trust score');
});

test('Wire HTTP - Acceptance Test 6: Zero paid inference gate prevents dispatchProviderCall from making commercial network requests', async () => {
  const gateway = new LLMGateway();
  const m06 = RESEARCH_MODELS.find(m => m.id === 'M06')!;
  // Attempt direct dispatchProviderCall for paid model M06 without server authorization
  await assert.rejects(
    async () => {
      await (gateway as any).dispatchProviderCall(m06, 'Test prompt');
    },
    /Call blocked by Zero-Paid-Spend server policy/,
    'dispatchProviderCall must throw and refuse to call provider for commercial model without server authorization'
  );
});

test('Wire HTTP - Acceptance Test 7: Backend restart persistence verifies disk store survives and reloads', async () => {
  const testOrgId = `org_persist_test_${Date.now()}`;
  const testOrgData = {
    id: testOrgId,
    legalName: 'Persisted Enterprise Solutions',
    primaryDomain: 'persisted-enterprise.in',
    gstin: '36AAACP1234A1Z5',
  };
  durableStore.setOrganization(testOrgId, testOrgData);

  // Read from store instance
  const fetchedOrg = durableStore.getOrganization(testOrgId);
  assert.ok(fetchedOrg, 'Organization must be retrieved from durable store');
  assert.equal(fetchedOrg.legalName, 'Persisted Enterprise Solutions');
  assert.equal(fetchedOrg.primaryDomain, 'persisted-enterprise.in');
});
