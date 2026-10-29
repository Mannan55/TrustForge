import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const screenshotDir = path.resolve('C:/TF new V1/TrustForge/TrustDocumentation/complete_documentation_screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function capture(page, filename) {
  const p = path.join(screenshotDir, filename);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`[Captured] ${filename}`);
}

async function run() {
  console.log('Starting Complete TrustForge Documentation Screenshot Capture Harness...');
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Public Marketing
  console.log('Capturing Public Marketing Views...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  await capture(page, 'fig_01_landing_hero.png');

  await page.goto('http://127.0.0.1:5173/scan', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  await capture(page, 'fig_02_public_scan_page.png');

  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  await capture(page, 'fig_03_customer_login_page.png');

  await page.goto('http://127.0.0.1:5173/signup', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  await capture(page, 'fig_04_customer_signup_page.png');

  // Customer Login
  console.log('Logging in as Customer (rajesh@technova.in)...');
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.fill('input[type="email"]', 'rajesh@technova.in');
  await page.fill('input[type="password"]', 'DemoPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 20000 });

  await page.goto('http://127.0.0.1:5173/onboarding', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  await capture(page, 'fig_05_onboarding_page.png');

  await page.goto('http://127.0.0.1:5173/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await capture(page, 'fig_06_dashboard_overview.png');

  await page.goto('http://127.0.0.1:5173/settings', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await capture(page, 'fig_07_org_settings_profile.png');

  const genBtn = page.getByRole('button', { name: /Generate Verification Challenge/i }).first();
  if (await genBtn.count() > 0) {
    await genBtn.click();
    await page.waitForTimeout(1200);
  }
  await capture(page, 'fig_08_org_settings_dns_challenge.png');

  // 14-Step Assessment
  console.log('Stepping through Assessment Wizard...');
  await page.goto('http://127.0.0.1:5173/assessment', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  await capture(page, 'fig_09_assessment_step01_governance.png');

  const beginBtn = page.getByRole('button', { name: /Begin assessment/i });
  if (await beginBtn.count() > 0) {
    await beginBtn.click();
    await page.waitForTimeout(600);
  }

  const stepNames = [
    'fig_10_assessment_step02_consent.png',
    'fig_11_assessment_step03_notice.png',
    'fig_12_assessment_step04_consent_mgr.png',
    'fig_13_assessment_step05_minimization.png',
    'fig_14_assessment_step06_retention.png',
    'fig_15_assessment_step07_accuracy.png',
    'fig_16_assessment_step08_safeguards.png',
    'fig_17_assessment_step09_breach.png',
    'fig_18_assessment_step10_children.png',
    'fig_19_assessment_step11_rights.png',
    'fig_20_assessment_step12_grievance.png',
    'fig_21_assessment_step13_sdf.png',
    'fig_22_assessment_step14_review.png',
  ];

  for (let i = 0; i < stepNames.length; i++) {
    await page.waitForTimeout(600);
    await capture(page, stepNames[i]);

    const continueBtn = page.getByRole('button', { name: /Continue|Run analysis/i });
    if (await continueBtn.count() > 0) {
      await continueBtn.click();
      await page.waitForTimeout(800);
    }
  }

  // Wait for results
  console.log('Waiting for assessment results...');
  await page.waitForSelector('text=/Assessment complete|What to fix first|Pillars|evidence coverage/i', { timeout: 35000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await capture(page, 'fig_23_assessment_results.png');

  // Customer Modules
  console.log('Capturing Workspace Modules...');
  await page.goto('http://127.0.0.1:5173/trust-score', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await capture(page, 'fig_24_trust_score_page.png');

  await page.goto('http://127.0.0.1:5173/website-scan', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await capture(page, 'fig_25_website_scan_page.png');

  await page.goto('http://127.0.0.1:5173/findings', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await capture(page, 'fig_26_findings_page.png');

  await page.goto('http://127.0.0.1:5173/evidence', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await capture(page, 'fig_27_evidence_page.png');

  await page.goto('http://127.0.0.1:5173/remediation', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await capture(page, 'fig_28_remediation_page.png');

  await page.goto('http://127.0.0.1:5173/reports', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await capture(page, 'fig_29_reports_page.png');

  await page.goto('http://127.0.0.1:5173/benchmark', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  await capture(page, 'fig_30_model_benchmark_page.png');

  await page.goto('http://127.0.0.1:5173/rag-monitor', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  await capture(page, 'fig_31_rag_monitor_page.png');

  await page.goto('http://127.0.0.1:5173/rights', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await capture(page, 'fig_32_rights_portal_page.png');

  await context.close();

  // Admin Console Context
  console.log('Capturing Platform Admin Console Views...');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();

  await adminPage.goto('http://127.0.0.1:5173/admin/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1000);
  await capture(adminPage, 'fig_33_admin_login_page.png');

  // Admin Login Error State
  await adminPage.fill('input[type="email"]', 'rajesh@technova.in');
  await adminPage.fill('input[type="password"]', 'DemoPassword123!');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForTimeout(1000);
  await capture(adminPage, 'fig_34_admin_login_error.png');

  // Valid Super Admin Sign-in
  await adminPage.fill('input[type="email"]', 'admin@trustforge.in');
  await adminPage.fill('input[type="password"]', 'AdminSecret2026!');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/admin', { timeout: 20000 });
  await adminPage.waitForSelector('text=Activity and health across every tenant', { timeout: 20000 }).catch(() => {});
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_35_admin_command_center.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/analytics', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_36_admin_analytics_page.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/organizations', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_37_admin_organizations_page.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/organizations/org_technova', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_38_admin_organization_detail.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/users', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_39_admin_users_page.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/users/usr_rajesh', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_40_admin_user_detail.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/assessments', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_41_admin_assessments_page.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/scans', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_42_admin_scans_page.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/findings', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_43_admin_findings_page.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/evidence', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_44_admin_evidence_page.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/review', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_45_admin_review_page.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/rules', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_46_admin_rules_page.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/reports', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_47_admin_reports_page.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/system', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_48_admin_system_health.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/audit', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_49_admin_audit_logs.png');

  await adminPage.goto('http://127.0.0.1:5173/admin/settings', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adminPage.waitForTimeout(1500);
  await capture(adminPage, 'fig_50_admin_settings_page.png');

  await adminContext.close();
  await browser.close();
  console.log('Successfully captured all 50 TrustForge documentation screenshots!');
}

run().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});

