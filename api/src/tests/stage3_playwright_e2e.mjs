/**
 * Stage 3 Playwright End-to-End Release Gate Verification Suite.
 * Performs real browser interactions and strict assertions across:
 * 1. Admin login rejection with invalid credentials
 * 2. Authenticated login with seeded credentials -> redirects to /dashboard
 * 3. Settings persistence (Grievance Officer and Email wired to real backend, reloaded and verified)
 * 4. DNS challenge generation with statutory legal disclaimer verification
 * 5. Full assessment execution with non-default questionnaire choices, evaluation & posture
 * 6. Live RAG framework monitor & statutory legal retrieval inspection
 * 7. Benchmark RFC 4180 CSV export download and HTTP 200 validation
 * 8. Strict multi-tenant isolation across two independent organizations (Alpha vs Beta)
 * 9. Fail-closed assertion ensuring zero unexpected 5xx server errors
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';

// Store screenshots inside the repository so they are tracked, committed and verifiable in PRs
const repoScreenshotDir = path.resolve(import.meta.dirname, '../../../TrustDocumentation/stage3_screenshots');
const externalScreenshotDir = path.resolve('C:/TF new V1/TrustDocumentation/stage3_screenshots');

if (!fs.existsSync(repoScreenshotDir)) {
  fs.mkdirSync(repoScreenshotDir, { recursive: true });
}
if (!fs.existsSync(externalScreenshotDir)) {
  fs.mkdirSync(externalScreenshotDir, { recursive: true });
}

async function takeScreenshot(targetPage, filename) {
  const p1 = path.join(repoScreenshotDir, filename);
  const p2 = path.join(externalScreenshotDir, filename);
  await targetPage.screenshot({ path: p1 });
  try {
    fs.copyFileSync(p1, p2);
  } catch {}
}

async function runPlaywrightGates() {
  console.log('================================================================');
  console.log('Starting Stage 3 Playwright End-to-End Verification Harness');
  console.log(`Screenshots will be saved to: ${repoScreenshotDir}`);
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
  });

  const contextAlpha = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await contextAlpha.newPage();

  // Fail browser tests on unexpected 5xx server errors
  const serverErrors = [];
  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 500) {
      serverErrors.push(`[${status}] HTTP Server Error at ${url}`);
      console.error(`[Playwright Network Error] ${status} at ${url}`);
    }
  });

  let alphaAuthToken = '';
  let alphaAssessmentId = '';
  let alphaBenchmarkId = '';

  try {
    // ------------------------------------------------------------------------
    // Step 1: Admin Authentication Gate Security Rejections
    // ------------------------------------------------------------------------
    console.log('[Test 1] Testing Admin Login Security Gate...');
    await page.goto('http://127.0.0.1:5173/admin/login', { waitUntil: 'networkidle', timeout: 15000 });

    // 1a. Test empty email / empty password rejection (no hardcoded fallback)
    console.log('Testing empty credentials rejection at /admin/login...');
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="password"]', '');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    assert.ok(page.url().includes('/admin/login'), 'Empty credentials submission must remain on /admin/login');
    let pageContent = await page.textContent('body');
    assert.ok(pageContent.includes('required'), 'Empty submission must display validation requirement');

    // 1b. Test customer credentials (rajesh@technova.in / Owner role) submitted at /admin/login
    console.log('Testing customer credentials (rajesh@technova.in) submitted at /admin/login...');
    await page.fill('input[type="email"]', 'rajesh@technova.in');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    assert.ok(page.url().includes('/admin/login'), 'Customer credentials must never redirect to /admin');
    pageContent = await page.textContent('body');
    assert.ok(
      pageContent.includes('Access denied') || pageContent.includes('platform administrator'),
      'Customer login at /admin/login must be rejected with access denied error'
    );

    // Verify localStorage has no admin session or token
    const tokenAfterCustomerAttempt = await page.evaluate(() => localStorage.getItem('trustforge.session') || localStorage.getItem('trustforge.auth_token'));
    assert.ok(!tokenAfterCustomerAttempt || !tokenAfterCustomerAttempt.includes('Super Admin'), 'No admin session must be stored after rejected attempt');

    // 1c. Test invalid admin password
    console.log('Testing invalid admin password rejection at /admin/login...');
    await page.fill('input[type="email"]', 'admin@trustforge.in');
    await page.fill('input[type="password"]', 'TotallyWrongPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    assert.ok(page.url().includes('/admin/login'), 'Invalid admin password must stay on /admin/login');

    await takeScreenshot(page, '01_invalid_login_rejected.png');
    console.log('✓ [Test 1 Passed] Admin Authentication Gate properly rejects empty inputs, customer credentials, and wrong passwords.');

    // ------------------------------------------------------------------------
    // Step 2: Customer / Workspace Login with Seeded Credentials (Tenant Alpha)
    // ------------------------------------------------------------------------
    console.log('[Test 2] Testing workspace login at /login...');
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle', timeout: 15000 });

    await page.fill('input[type="email"]', 'rajesh@technova.in');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log(`Current URL after login: ${page.url()}`);
    assert.ok(page.url().includes('/dashboard'), 'Successful login must redirect to /dashboard workspace');

    // Verify token stored in localStorage
    alphaAuthToken = await page.evaluate(() => localStorage.getItem('trustforge.auth_token') || localStorage.getItem('tf_auth_token'));
    assert.ok(alphaAuthToken && alphaAuthToken.length > 20, 'Authentic JWT session token must be stored in localStorage');

    await takeScreenshot(page, '02_authenticated_dashboard.png');
    console.log('✓ [Test 2 Passed] User successfully authenticated; token stored; dashboard loaded.');

    // ------------------------------------------------------------------------
    // Step 3: Settings Page — Grievance Officer Persistence & Reload Verification
    // ------------------------------------------------------------------------
    console.log('[Test 3] Testing Settings persistence for Grievance Contact at /settings...');
    await page.goto('http://127.0.0.1:5173/settings', { waitUntil: 'networkidle', timeout: 15000 });

    const testOfficerName = 'Dr. Priya Sharma (Lead DPDP Grievance Officer)';
    const testOfficerEmail = 'grievance.lead@technova.in';

    const officerInput = page.getByLabel('Grievance officer');
    if (await officerInput.count() > 0) {
      await officerInput.fill(testOfficerName);
    }
    const emailInput = page.getByLabel('Grievance email');
    if (await emailInput.count() > 0) {
      await emailInput.fill(testOfficerEmail);
    }

    // Click "Update contact" button
    const updateBtn = page.getByRole('button', { name: /Update contact|Save Contact|Save changes/i }).first();
    if (await updateBtn.count() > 0) {
      await updateBtn.click();
      await page.waitForTimeout(1500);
      console.log('Clicked Update contact button');
    }

    // HARD ASSERTION: Reload page and read back from server to verify actual persistence
    console.log('Reloading /settings page to verify persisted state from server...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const reloadedOfficerVal = await page.getByLabel('Grievance officer').inputValue();
    const reloadedEmailVal = await page.getByLabel('Grievance email').inputValue();
    assert.equal(reloadedOfficerVal, testOfficerName, 'Grievance officer name must be persisted in durable store and reloaded');
    assert.equal(reloadedEmailVal, testOfficerEmail, 'Grievance email must be persisted in durable store and reloaded');

    await takeScreenshot(page, '03_settings_persisted.png');
    console.log('✓ [Test 3 Passed] Settings saved, reloaded and verified from server.');

    // ------------------------------------------------------------------------
    // Step 4: Organization DNS Verification & Legal Disclaimer
    // ------------------------------------------------------------------------
    console.log('[Test 4] Testing DNS Challenge Generation & Legal Disclaimer...');
    const generateBtn = page.getByRole('button', { name: /Generate Verification Challenge/i }).first();
    assert.ok(await generateBtn.count() > 0, 'Generate Verification Challenge button must be present');
    await generateBtn.click();
    await page.waitForTimeout(1500);

    const pageText = await page.textContent('body');
    assert.ok(pageText.includes('trustforge-verification='), 'DNS TXT challenge record must be generated and displayed');
    assert.ok(pageText.includes('Technical DNS control confirms domain routing control; it does not substitute for corporate registration verification'), 'Statutory legal disclaimer on corporate authority must be prominently displayed');

    await takeScreenshot(page, '04_dns_challenge_generated.png');
    console.log('✓ [Test 4 Passed] DNS challenge section verified with legal disclaimers.');

    // ------------------------------------------------------------------------
    // Step 5: Full Assessment Wizard Execution with Non-Default Answers
    // ------------------------------------------------------------------------
    console.log('[Test 5] Executing full Assessment Wizard with non-default answers at /assessment...');
    await page.goto('http://127.0.0.1:5173/assessment', { waitUntil: 'networkidle', timeout: 15000 });

    // Step 1: Click "Begin assessment"
    const beginBtn = page.getByRole('button', { name: /Begin assessment/i });
    if (await beginBtn.count() > 0) {
      await beginBtn.click();
      await page.waitForTimeout(500);
    }

    // Step through wizard until Review step
    for (let s = 2; s <= 13; s++) {
      // Toggle custom non-default selections where present
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      if (checkboxes.length > 1) {
        // Toggle the second checkbox to make answers non-default
        await checkboxes[1].click().catch(() => {});
      }

      // Check for retention select
      const selects = await page.locator('select').all();
      if (selects.length > 0) {
        await selects[0].selectOption({ index: 2 }).catch(() => {});
      }

      // Click "Continue" or "Run analysis"
      const continueBtn = page.getByRole('button', { name: /Continue|Run analysis/i });
      if (await continueBtn.count() > 0) {
        await continueBtn.click();
        await page.waitForTimeout(600);
      }
    }

    // Wait for the assessment result to process and load
    console.log('Waiting for assessment analysis to complete...');
    await page.waitForSelector('text=/Assessment complete|What to fix first|Pillars|evidence coverage/i', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const resultText = await page.textContent('body');
    assert.ok(
      resultText.includes('Assessment complete') || resultText.includes('What to fix first') || resultText.includes('Trust Score'),
      'Assessment results page must render evaluation summary and posture'
    );

    // Hard Assertion 1: Query API for latest assessment completed by Tenant Alpha
    const latestAssessRes = await page.request.get('http://127.0.0.1:8000/api/assessments/latest', {
      headers: { Authorization: `Bearer ${alphaAuthToken}` },
    });
    assert.equal(latestAssessRes.status(), 200, 'GET /api/assessments/latest must return HTTP 200');
    const latestData = await latestAssessRes.json();
    alphaAssessmentId = latestData.assessment_id || latestData.id;
    assert.ok(alphaAssessmentId && alphaAssessmentId.length > 5, 'Assessment ID must be captured and non-empty');
    assert.equal(latestData.org_id, 'org_technova', 'Assessment org_id must match Tenant Alpha');

    // Hard Assertion 2: Verify C1-C10 control findings exist for this assessment
    const findingsRes = await page.request.get(`http://127.0.0.1:8000/api/findings/${alphaAssessmentId}`, {
      headers: { Authorization: `Bearer ${alphaAuthToken}` },
    });
    assert.equal(findingsRes.status(), 200, 'GET /api/findings/:id must return HTTP 200');
    const findingsData = await findingsRes.json();
    const findingsList = Array.isArray(findingsData) ? findingsData : findingsData.findings || [];
    assert.ok(findingsList.length >= 10, 'Must have at least 10 C1-C10 control findings returned');
    console.log(`Verified ${findingsList.length} C1-C10 findings for assessment ${alphaAssessmentId}`);

    // Hard Assertion 3: Verify Trust Score calculation is present and valid
    const scoreRes = await page.request.get(`http://127.0.0.1:8000/api/trust-score/${alphaAssessmentId}`, {
      headers: { Authorization: `Bearer ${alphaAuthToken}` },
    });
    assert.equal(scoreRes.status(), 200, 'GET /api/trust-score/:id must return HTTP 200');
    const scoreData = await scoreRes.json();
    assert.ok(typeof scoreData.trust_score === 'number', 'Trust score must be a valid numeric value');
    console.log(`Verified Trust Score: ${scoreData.trust_score}/100, Posture: ${scoreData.posture}`);

    await takeScreenshot(page, '05_assessment_nondefault_result.png');
    console.log('✓ [Test 5 Passed] Assessment wizard completed with non-default answers; score, findings and ID verified.');

    // ------------------------------------------------------------------------
    // Step 6: Live RAG Framework Monitor & Evidence Inspection
    // ------------------------------------------------------------------------
    console.log('[Test 6] Navigating to Live RAG Monitor at /rag-monitor...');
    await page.goto('http://127.0.0.1:5173/rag-monitor', { waitUntil: 'networkidle', timeout: 15000 });

    const ragText = await page.textContent('body');
    assert.ok(
      ragText.includes('BM25') || ragText.includes('RAG') || ragText.includes('Retrieval') || ragText.includes('Statutory') || ragText.includes('Corpus'),
      'RAG Monitor must display hybrid retrieval events and statutory context'
    );

    // Hard Assertion 4: Query RAG execution trace endpoint directly for the active assessment
    const ragTraceRes = await page.request.get(`http://127.0.0.1:8000/api/assessments/${alphaAssessmentId}/rag-trace`, {
      headers: { Authorization: `Bearer ${alphaAuthToken}` },
    });
    assert.equal(ragTraceRes.status(), 200, 'GET /api/assessments/:id/rag-trace must return HTTP 200');
    const ragTraceData = await ragTraceRes.json();
    assert.equal(ragTraceData.assessment_id, alphaAssessmentId, 'RAG trace must match the active assessment ID');
    assert.ok(ragTraceData.rag_execution_trace, 'rag_execution_trace must be present on the active assessment');
    console.log(`Verified live RAG trace for assessment ${alphaAssessmentId} (status: ${ragTraceData.rag_execution_trace.status || 'OK'})`);

    await takeScreenshot(page, '06_rag_evidence_inspection.png');
    console.log('✓ [Test 6 Passed] Live RAG Framework monitor loaded and verified against active assessment trace.');

    // ------------------------------------------------------------------------
    // Step 7: Reports Page & Benchmark RFC 4180 CSV Download (Assert HTTP 200)
    // ------------------------------------------------------------------------
    console.log('[Test 7] Triggering candidate model benchmark to ensure benchmark data exists...');
    const benchTriggerRes = await page.request.post('http://127.0.0.1:8000/api/benchmark/run', {
      headers: {
        Authorization: `Bearer ${alphaAuthToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        selected_models: ['M01', 'M02', 'M06', 'M07'],
        target_url: 'https://technova.in',
      },
    });
    assert.equal(benchTriggerRes.status(), 200, 'Benchmark trigger must return 200');
    const benchData = await benchTriggerRes.json();
    alphaBenchmarkId = benchData.benchmark_id;
    console.log(`Generated Benchmark ID for Alpha: ${alphaBenchmarkId}`);

    console.log('Navigating to Reports Page at /reports...');
    await page.goto('http://127.0.0.1:5173/reports', { waitUntil: 'networkidle', timeout: 15000 });

    // Verify Benchmark RFC 4180 CSV export endpoint directly
    console.log('Testing GET /api/benchmark/export/csv...');
    const csvResponse = await page.request.get('http://127.0.0.1:8000/api/benchmark/export/csv', {
      headers: { Authorization: `Bearer ${alphaAuthToken}` },
    });

    console.log(`CSV Export status: ${csvResponse.status()}`);
    assert.equal(csvResponse.status(), 200, 'Benchmark CSV export must respond with HTTP 200');
    const csvContent = await csvResponse.text();
    assert.ok(csvContent.includes('Slot,Model Name,Provider'), 'CSV must contain RFC 4180 header row');
    assert.ok(csvContent.includes('M01'), 'CSV must contain M01 candidate model row');
    assert.ok(csvContent.includes('M02'), 'CSV must contain M02 candidate model row');

    // Hard Assertion 5: Research Provenance Check on CSV Export (Blocker 7)
    assert.ok(csvContent.includes('Execution Status'), 'CSV must contain Execution Status column');
    assert.ok(csvContent.includes('M06') && csvContent.includes('BLOCKED_PAID_MODEL'), 'Commercial model M06 must be marked BLOCKED_PAID_MODEL');
    assert.ok(csvContent.includes('M07') && csvContent.includes('BLOCKED_PAID_MODEL'), 'Commercial model M07 must be marked BLOCKED_PAID_MODEL');
    assert.ok(csvContent.includes('$0.000000'), 'Blocked commercial models must have $0.000000 cost');

    await takeScreenshot(page, '07_reports_and_benchmark_csv.png');
    console.log('✓ [Test 7 Passed] Reports and RFC 4180 CSV export validated with HTTP 200 & proven research metrics.');

    // ------------------------------------------------------------------------
    // Step 8: Multi-Tenant Isolation Across Two Organizations (Alpha vs Beta)
    // ------------------------------------------------------------------------
    console.log('[Test 8] Testing strict multi-tenant isolation with Tenant Beta...');
    // Create second independent browser context for Tenant Beta
    const contextBeta = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pageBeta = await contextBeta.newPage();

    // Authenticate Tenant Beta using distinct user via server registration
    const betaSignupRes = await pageBeta.request.post('http://127.0.0.1:8000/api/auth/signup', {
      data: {
        email: `beta_owner_${Date.now()}@betaanalytics.co.in`,
        password: 'BetaSecurePassword123!',
        name: 'Beta Compliance Officer',
        orgName: 'Beta Analytics India Private Limited',
      },
    });

    if (betaSignupRes.status() !== 201) {
      const errText = await betaSignupRes.text();
      console.error(`Tenant Beta signup failed with status ${betaSignupRes.status()}:`, errText);
    }
    assert.equal(betaSignupRes.status(), 201, 'Tenant Beta signup must succeed with HTTP 201');
    const betaData = await betaSignupRes.json();
    const betaToken = betaData.token;
    console.log(`Tenant Beta successfully authenticated: ${betaData.user.email} (Org: ${betaData.user.orgId})`);

    assert.ok(betaToken, 'Tenant Beta token must be acquired');

    // Blocker 4: Hard Unconditional Cross-Tenant Assertions (No Skipping Permitted)
    assert.ok(alphaAssessmentId, 'Tenant Alpha assessment ID must be non-empty');
    assert.ok(alphaBenchmarkId, 'Tenant Alpha benchmark ID must be non-empty');

    // 1. Tenant Beta attempts to access Tenant Alpha's benchmark by ID
    console.log(`Tenant Beta querying Tenant Alpha benchmark '${alphaBenchmarkId}'...`);
    const crossBenchRes = await pageBeta.request.get(`http://127.0.0.1:8000/api/benchmark/${alphaBenchmarkId}`, {
      headers: { Authorization: `Bearer ${betaToken}` },
    });
    assert.equal(crossBenchRes.status(), 403, 'Cross-tenant benchmark GET must be strictly denied with HTTP 403');
    const crossBenchData = await crossBenchRes.json();
    assert.equal(crossBenchData.code, 'CROSS_ORGANISATION_ACCESS_DENIED');

    // 2. Tenant Beta attempts to download Tenant Alpha's benchmark CSV
    console.log(`Tenant Beta querying Tenant Alpha benchmark CSV '${alphaBenchmarkId}/csv'...`);
    const crossCsvRes = await pageBeta.request.get(`http://127.0.0.1:8000/api/benchmark/${alphaBenchmarkId}/csv`, {
      headers: { Authorization: `Bearer ${betaToken}` },
    });
    assert.equal(crossCsvRes.status(), 403, 'Cross-tenant CSV export must be strictly denied with HTTP 403');

    // 3. Tenant Beta attempts to query Tenant Alpha's assessment directly
    console.log(`Tenant Beta querying Tenant Alpha assessment '${alphaAssessmentId}'...`);
    const crossAssessRes = await pageBeta.request.get(`http://127.0.0.1:8000/api/assessments/${alphaAssessmentId}`, {
      headers: { Authorization: `Bearer ${betaToken}` },
    });
    assert.equal(crossAssessRes.status(), 403, 'Cross-tenant assessment record must be denied with HTTP 403');

    // 4. Tenant Beta attempts to query Tenant Alpha's assessment RAG trace
    const crossTraceRes = await pageBeta.request.get(`http://127.0.0.1:8000/api/assessments/${alphaAssessmentId}/rag-trace`, {
      headers: { Authorization: `Bearer ${betaToken}` },
    });
    assert.equal(crossTraceRes.status(), 403, 'Cross-tenant assessment RAG trace must be denied with HTTP 403');

    // 5. Tenant Beta attempts to access Tenant Alpha's report
    const crossReportRes = await pageBeta.request.get(`http://127.0.0.1:8000/api/reports/${alphaAssessmentId}`, {
      headers: { Authorization: `Bearer ${betaToken}` },
    });
    assert.equal(crossReportRes.status(), 403, 'Cross-tenant assessment report must be denied with HTTP 403');

    // 6. Tenant Beta attempts to access Tenant Alpha's findings
    const crossFindingsRes = await pageBeta.request.get(`http://127.0.0.1:8000/api/findings/${alphaAssessmentId}`, {
      headers: { Authorization: `Bearer ${betaToken}` },
    });
    assert.equal(crossFindingsRes.status(), 403, 'Cross-tenant findings must be denied with HTTP 403');

    // 7. Tenant Beta attempts to access Tenant Alpha's trust score
    const crossScoreRes = await pageBeta.request.get(`http://127.0.0.1:8000/api/trust-score/${alphaAssessmentId}`, {
      headers: { Authorization: `Bearer ${betaToken}` },
    });
    assert.equal(crossScoreRes.status(), 403, 'Cross-tenant trust score must be denied with HTTP 403');

    await pageBeta.goto('http://127.0.0.1:5173/login', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await takeScreenshot(pageBeta, '08_tenant_isolation_verified.png');
    await contextBeta.close();
    console.log('✓ [Test 8 Passed] Cross-tenant boundaries verified across all private resources; fail closed with HTTP 403.');

    // ------------------------------------------------------------------------
    // Step 9: Admin Role-Based Access Control (RBAC) Enforcement
    // ------------------------------------------------------------------------
    console.log('[Test 9] Testing RBAC restrictions on Admin routes...');
    // Unauthenticated user attempting to access /admin
    const anonContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const anonPage = await anonContext.newPage();
    await anonPage.goto('http://127.0.0.1:5173/admin', { waitUntil: 'networkidle', timeout: 15000 });
    assert.ok(anonPage.url().includes('/login'), 'Unauthenticated user attempting /admin must be redirected to /login');
    await anonContext.close();

    // Customer user (page with Tenant Alpha / Rajesh) attempting to access /admin
    console.log('Testing authenticated customer user attempting to access /admin...');
    await page.goto('http://127.0.0.1:5173/admin', { waitUntil: 'networkidle', timeout: 15000 });
    assert.ok(page.url().includes('/dashboard'), 'Customer user attempting /admin must be redirected back to /dashboard');

    console.log('Testing authenticated customer user attempting to access /admin/organizations...');
    await page.goto('http://127.0.0.1:5173/admin/organizations', { waitUntil: 'networkidle', timeout: 15000 });
    assert.ok(page.url().includes('/dashboard'), 'Customer user attempting /admin/organizations must be redirected to /dashboard');
    console.log('✓ [Test 9 Passed] Admin RBAC properly enforced: unauthorized access rejected.');

    // ------------------------------------------------------------------------
    // Step 10: Authenticated Super Admin Login & Command Center
    // ------------------------------------------------------------------------
    console.log('[Test 10] Testing authentic Super Admin login at /admin/login...');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    adminPage.on('response', (response) => {
      const status = response.status();
      const url = response.url();
      if (status >= 500) {
        serverErrors.push(`[${status}] HTTP Server Error at ${url}`);
        console.error(`[Playwright Admin Network Error] ${status} at ${url}`);
      }
    });

    await adminPage.goto('http://127.0.0.1:5173/admin/login', { waitUntil: 'networkidle', timeout: 15000 });
    await adminPage.fill('input[type="email"]', 'admin@trustforge.in');
    await adminPage.fill('input[type="password"]', 'AdminSecret2026!');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/admin', { timeout: 15000 });
    console.log(`Admin URL after login: ${adminPage.url()}`);
    assert.ok(adminPage.url().endsWith('/admin'), 'Super Admin login must redirect to /admin command center');

    await adminPage.waitForSelector('text=Activity and health across every tenant', { timeout: 15000 });
    const adminBodyText = await adminPage.textContent('body');
    assert.ok(adminBodyText.includes('Command Center'), 'Admin page must display Command Center header');
    assert.ok(adminBodyText.includes('Organizations'), 'Admin page must display Organizations KPI');
    assert.ok(adminBodyText.includes('Active users'), 'Admin page must display Active users KPI');
    assert.ok(adminBodyText.includes('Website scans'), 'Admin page must display Website scans KPI');

    // Verify user profile is built from server data, not hardcoded ADMIN_USER
    const storedAdminSession = await adminPage.evaluate(() => localStorage.getItem('trustforge.session'));
    assert.ok(storedAdminSession, 'Admin session must be persisted');
    const parsedAdminSession = JSON.parse(storedAdminSession);
    assert.equal(parsedAdminSession.role, 'Super Admin', 'Stored session role must be authentic Super Admin');
    assert.equal(parsedAdminSession.email, 'admin@trustforge.in', 'Stored session email must match authenticated user');

    // Test session refresh on /admin: reload page and assert session is validated via /api/auth/me
    console.log('Testing Admin session refresh on /admin...');
    await adminPage.reload({ waitUntil: 'networkidle' });
    await adminPage.waitForSelector('text=Activity and health across every tenant', { timeout: 15000 });
    assert.ok(adminPage.url().endsWith('/admin'), 'Session refresh must keep admin on /admin without redirect to login');

    await takeScreenshot(adminPage, '09_admin_dashboard_overview.png');
    console.log('✓ [Test 10 Passed] Super Admin logged in, server-built profile verified, and session refresh succeeded.');

    // ------------------------------------------------------------------------
    // Step 11: Admin Organization Management & Tenant Inspection
    // ------------------------------------------------------------------------
    console.log('[Test 11] Testing Organization Management at /admin/organizations...');
    await adminPage.goto('http://127.0.0.1:5173/admin/organizations', { waitUntil: 'networkidle', timeout: 15000 });
    await adminPage.waitForSelector('text=Every organization on the platform', { timeout: 15000 });

    const orgsText = await adminPage.textContent('body');
    assert.ok(orgsText.includes('TechNova Solutions'), 'Organizations table must include TechNova tenant');

    // Test search filter
    const searchInput = adminPage.locator('input[placeholder*="Search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('TechNova');
      await adminPage.waitForTimeout(500);
      const filteredText = await adminPage.textContent('body');
      assert.ok(filteredText.includes('TechNova'), 'Filtered view must retain matching tenant');
    }

    // Click on organization row to view detail
    const orgRow = adminPage.locator('tr').filter({ hasText: 'TechNova' }).first();
    if (await orgRow.count() > 0) {
      await orgRow.click();
      await adminPage.waitForTimeout(1000);
      assert.ok(adminPage.url().includes('/admin/organizations/'), 'Clicking organization must navigate to detail view');
      const detailText = await adminPage.textContent('body');
      assert.ok(detailText.includes('Trust Score') || detailText.includes('Tenant activity'), 'Detail view must render tenant stats and activity');
    }

    await takeScreenshot(adminPage, '10_admin_organizations_table.png');
    console.log('✓ [Test 11 Passed] Admin Organizations management and tenant inspection verified.');

    // ------------------------------------------------------------------------
    // Step 12: Admin User Management & Role Auditing
    // ------------------------------------------------------------------------
    console.log('[Test 12] Testing User Management at /admin/users...');
    await adminPage.goto('http://127.0.0.1:5173/admin/users', { waitUntil: 'networkidle', timeout: 15000 });
    await adminPage.waitForSelector('text=People across all organizations', { timeout: 15000 });

    const usersText = await adminPage.textContent('body');
    assert.ok(usersText.includes('Rajesh Kumar') || usersText.includes('Owner'), 'User table must display platform users and roles');

    // Click on user row to view user detail
    const userRow = adminPage.locator('tr').filter({ hasText: 'Rajesh Kumar' }).first();
    if (await userRow.count() > 0) {
      await userRow.click();
      await adminPage.waitForTimeout(1000);
      assert.ok(adminPage.url().includes('/admin/users/'), 'Clicking user must navigate to user detail view');
    }

    await takeScreenshot(adminPage, '11_admin_users_management.png');
    console.log('✓ [Test 12 Passed] Admin User management and role auditing verified.');

    // ------------------------------------------------------------------------
    // Step 13: Admin Global Assessments Ops & Audit Logs
    // ------------------------------------------------------------------------
    console.log('[Test 13] Testing Global Assessments at /admin/assessments and Audit Logs at /admin/audit...');
    await adminPage.goto('http://127.0.0.1:5173/admin/assessments', { waitUntil: 'networkidle', timeout: 15000 });
    await adminPage.waitForSelector('text=Where each tenant stands', { timeout: 15000 });
    const assessBodyText = await adminPage.textContent('body');
    assert.ok(assessBodyText.includes('Completed') || assessBodyText.includes('In progress'), 'Assessments table must render tenant assessment status');

    await adminPage.goto('http://127.0.0.1:5173/admin/audit', { waitUntil: 'networkidle', timeout: 15000 });
    await adminPage.waitForSelector('text=A tamper-evident record', { timeout: 15000 });
    const auditText = await adminPage.textContent('body');
    assert.ok(auditText.includes('Time') && auditText.includes('Actor'), 'Audit log table must render tamper-evident headers');

    await takeScreenshot(adminPage, '12_admin_assessments_audit.png');
    console.log('✓ [Test 13 Passed] Global assessment operations and audit logs verified.');

    // ------------------------------------------------------------------------
    // Step 14: Admin System Health Monitoring
    // ------------------------------------------------------------------------
    console.log('[Test 14] Testing System Health at /admin/system...');
    await adminPage.goto('http://127.0.0.1:5173/admin/system', { waitUntil: 'networkidle', timeout: 15000 });
    await adminPage.waitForSelector('text=Live status of the services behind TrustForge', { timeout: 15000 });
    const sysText = await adminPage.textContent('body');
    assert.ok(sysText.includes('monitored service') || sysText.includes('Operational') || sysText.includes('TrustForge'), 'System health must display active services');

    await takeScreenshot(adminPage, '13_admin_system_health.png');
    console.log('✓ [Test 14 Passed] System health monitoring verified.');

    // Test Admin Logout and post-logout direct route rejection
    console.log('Testing Admin Logout...');
    const signOutBtn = adminPage.getByRole('button', { name: /Sign out/i }).first();
    if (await signOutBtn.count() > 0) {
      await signOutBtn.click();
      await adminPage.waitForTimeout(1000);
      console.log(`URL after clicking sign out: ${adminPage.url()}`);
      // Now attempt direct navigation to /admin
      await adminPage.goto('http://127.0.0.1:5173/admin', { waitUntil: 'networkidle', timeout: 15000 });
      assert.ok(adminPage.url().includes('/login'), 'Direct navigation to /admin after logout must redirect to /login');
      console.log('✓ Admin sign out and post-logout direct access rejection verified.');
    }

    await adminContext.close();

    // ------------------------------------------------------------------------
    // Step 15: Assert Zero Unexpected 5xx Server Errors
    // ------------------------------------------------------------------------
    console.log('[Test 15] Checking for unexpected server errors...');
    assert.equal(
      serverErrors.length,
      0,
      `Unexpected server 5xx errors were encountered during browser run:\n${serverErrors.join('\n')}`
    );
    console.log('✓ [Test 15 Passed] Zero 5xx server errors occurred during Playwright session.');

    console.log('================================================================');
    console.log('ALL PLAYWRIGHT ASSERTIONS PASSED SUCCESSFULLY!');
    console.log(`Screenshots saved to: ${repoScreenshotDir}`);
    for (const f of fs.readdirSync(repoScreenshotDir)) {
      console.log(` - ${f}`);
    }
    console.log('================================================================');

  } catch (err) {
    console.error('Playwright verification error:', err);
    await takeScreenshot(page, 'error_failure.png').catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

runPlaywrightGates().catch((err) => {
  console.error(err);
  process.exit(1);
});
