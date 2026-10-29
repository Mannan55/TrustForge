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
import app from '../index.js';
import { durableStore } from '../database/durableStore.js';
import { authService } from '../services/authService.js';

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
