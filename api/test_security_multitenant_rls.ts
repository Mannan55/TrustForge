/**
 * Comprehensive Multi-Tenant Security & Tenant Isolation Test Suite.
 * Validates Phase B requirements:
 * 1. User A / Org A vs User B / Org B tenant boundary enforcement.
 * 2. Prevention of IDOR vulnerabilities on assessments, findings, scores, reports, and PDFs.
 * 3. Prevention of client-side org_id tampering on writes.
 * 4. Anonymous access rejection for private resources.
 */
import app from './src/index.js';
import { durableStore } from './src/database/durableStore.js';
import { db } from './src/database/supabaseClient.js';

interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  text: string;
}

// In-process HTTP dispatcher for deterministic Express route testing
function request(
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<MockResponse> {
  return new Promise((resolve) => {
    const reqHeaders: Record<string, string> = {
      'content-type': 'application/json',
      ...headers,
    };

    const listeners: Record<string, ((...args: any[]) => void)[]> = {};
    const resHeaders: Record<string, string> = {};
    let statusCode = 200;
    let resBody = '';

    const req: any = {
      method,
      url,
      headers: reqHeaders,
      rawHeaders: Object.entries(reqHeaders).flat(),
      get(name: string) {
        return reqHeaders[name.toLowerCase()];
      },
      header(name: string) {
        return reqHeaders[name.toLowerCase()];
      },
      on(event: string, cb: any) {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
        return req;
      },
      emit(event: string, ...args: any[]) {
        (listeners[event] || []).forEach(cb => cb(...args));
      },
    };

    const res: any = {
      statusCode: 200,
      status(code: number) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      setHeader(name: string, val: string) {
        resHeaders[name.toLowerCase()] = String(val);
        return this;
      },
      header(name: string, val: string) {
        resHeaders[name.toLowerCase()] = String(val);
        return this;
      },
      getHeader(name: string) {
        return resHeaders[name.toLowerCase()];
      },
      json(data: any) {
        resHeaders['content-type'] = 'application/json';
        resBody = JSON.stringify(data);
        resolve({
          status: statusCode,
          headers: resHeaders,
          body: data,
          text: resBody,
        });
      },
      send(data: any) {
        resBody = Buffer.isBuffer(data) ? data.toString('utf-8') : String(data);
        resolve({
          status: statusCode,
          headers: resHeaders,
          body: resBody,
          text: resBody,
        });
      },
      end(data: any) {
        if (data) resBody = String(data);
        resolve({
          status: statusCode,
          headers: resHeaders,
          body: resBody,
          text: resBody,
        });
      },
    };

    // Dispatch to express application
    (app as any).handle(req, res);

    if (body) {
      req.emit('data', Buffer.from(JSON.stringify(body)));
    }
    req.emit('end');
  });
}

async function runSecurityTests() {
  console.log('========================================================================');
  console.log('TrustForge Multi-Tenant Security & Tenant Isolation Verification (P0)');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (detail) console.error(`         -> ${detail}`);
      failed++;
    }
  }

  // Seed two distinct test assessments in two isolated organizations
  const testAsmOrgA = `ASM_TEST_ORGA_${Date.now()}`;
  const testAsmOrgB = `ASM_TEST_ORGB_${Date.now()}`;

  const recordA = {
    assessment_id: testAsmOrgA,
    org_id: 'org_technova',
    website_url: 'https://technova.in',
    status: 'complete' as const,
    progress: 100,
    trust_score: 88,
    posture: 'Strong Alignment',
    created_at: new Date().toISOString(),
  };

  const recordB = {
    assessment_id: testAsmOrgB,
    org_id: 'org_competitor',
    website_url: 'https://competitor.com',
    status: 'complete' as const,
    progress: 100,
    trust_score: 52,
    posture: 'Needs Attention',
    created_at: new Date().toISOString(),
  };

  durableStore.setAssessment(testAsmOrgA, recordA);
  durableStore.setAssessment(testAsmOrgB, recordB);
  await db.saveAssessment(recordA);
  await db.saveAssessment(recordB);

  console.log('Test 1: User A (TechNova) Reads Own Assessment');
  const res1 = await request('GET', `/api/assessments/${testAsmOrgA}`, {
    'x-org-id': 'org_technova',
    'x-user-id': 'usr_rajesh',
  });
  assert(res1.status === 200 && res1.body.assessment_id === testAsmOrgA, 'User A can read own assessment (200 OK)');

  console.log('\nTest 2: User B (Competitor) Attempts Cross-Tenant Access to User A Assessment (IDOR Attack)');
  const res2 = await request('GET', `/api/assessments/${testAsmOrgA}`, {
    'x-org-id': 'org_competitor',
    'x-user-id': 'usr_competitor',
  });
  assert(
    res2.status === 403 && res2.body.code === 'CROSS_ORGANISATION_ACCESS_DENIED',
    'Cross-organisation assessment read blocked with 403 Forbidden',
    `Received status ${res2.status}: ${JSON.stringify(res2.body)}`
  );

  console.log('\nTest 3: Anonymous User Attempts Access to Private Assessment');
  const res3 = await request('GET', `/api/assessments/${testAsmOrgA}`, {
    'x-anonymous': 'true',
  });
  assert(
    res3.status === 401 && res3.body.code === 'UNAUTHORIZED',
    'Anonymous access to private assessment rejected with 401 Unauthorized',
    `Received status ${res3.status}: ${JSON.stringify(res3.body)}`
  );

  console.log('\nTest 4: User B Attempts to Download User A Executive Report (IDOR Attack)');
  const res4 = await request('GET', `/api/reports/executive/${testAsmOrgA}`, {
    'x-org-id': 'org_competitor',
  });
  assert(
    res4.status === 403 && res4.body.code === 'CROSS_ORGANISATION_ACCESS_DENIED',
    'Cross-organisation executive report read blocked with 403 Forbidden',
    `Received status ${res4.status}: ${JSON.stringify(res4.body)}`
  );

  console.log('\nTest 5: User B Attempts to Download User A PDF Report (IDOR Attack)');
  const res5 = await request('GET', `/api/reports/${testAsmOrgA}/pdf`, {
    'x-org-id': 'org_competitor',
  });
  assert(
    res5.status === 403 && res5.body.code === 'CROSS_ORGANISATION_ACCESS_DENIED',
    'Cross-organisation PDF download blocked with 403 Forbidden',
    `Received status ${res5.status}: ${JSON.stringify(res5.body)}`
  );

  console.log('\nTest 6: User B Attempts to Access User A Risk Findings (IDOR Attack)');
  const res6 = await request('GET', `/api/findings/${testAsmOrgA}`, {
    'x-org-id': 'org_competitor',
  });
  assert(
    res6.status === 403 && res6.body.code === 'CROSS_ORGANISATION_ACCESS_DENIED',
    'Cross-organisation findings access blocked with 403 Forbidden',
    `Received status ${res6.status}: ${JSON.stringify(res6.body)}`
  );

  console.log('\nTest 7: User B Attempts to Access User A Trust Score (IDOR Attack)');
  const res7 = await request('GET', `/api/trust-score/${testAsmOrgA}`, {
    'x-org-id': 'org_competitor',
  });
  assert(
    res7.status === 403 && res7.body.code === 'CROSS_ORGANISATION_ACCESS_DENIED',
    'Cross-organisation trust score access blocked with 403 Forbidden',
    `Received status ${res7.status}: ${JSON.stringify(res7.body)}`
  );

  console.log('\nTest 8: Assessment List is Scoped to Authenticated Tenant (No Cross-Tenant Leaks)');
  const res8 = await request('GET', '/api/assessments', {
    'x-org-id': 'org_competitor',
  });
  const competitorJobs = res8.body || [];
  const leakedTechNovaJobs = competitorJobs.filter((j: any) => j.org_id === 'org_technova');
  assert(
    res8.status === 200 && leakedTechNovaJobs.length === 0,
    'Assessment list contains zero leaked cross-tenant records',
    `Found ${leakedTechNovaJobs.length} leaked TechNova records in Competitor listing`
  );

  console.log('\nTest 9: Anonymous User Cannot Create Assessments');
  const res9 = await request('POST', '/api/assessments', {
    'x-anonymous': 'true',
  }, {
    website_url: 'https://evil.com',
  });
  assert(
    res9.status === 401,
    'Anonymous POST /assessments rejected with 401 Unauthorized',
    `Received status ${res9.status}: ${JSON.stringify(res9.body)}`
  );

  console.log('\nTest 10: Client Org ID Tampering is Overridden by Verified Session');
  const res10 = await request('POST', '/api/assessments', {
    'x-org-id': 'org_technova',
  }, {
    org_id: 'org_competitor', // Tampered client payload
    website_url: 'https://technova.in',
  });
  const createdId = res10.body?.assessment_id;
  const createdRecord = createdId ? durableStore.getAssessment(createdId) : null;
  assert(
    res10.status === 202 && createdRecord?.org_id === 'org_technova',
    'Client org_id tampering overridden by verified session (saved under org_technova)',
    `Created record org_id was: ${createdRecord?.org_id}`
  );

  console.log('\n========================================================================');
  console.log(`SECURITY VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((e) => {
  console.error('Security test exception:', e);
  process.exit(1);
});
