import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
  const outDir = path.resolve('TrustForge/TrustDocumentation/stage3_screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Checking Admin Login Page (Empty Password Check)...');
  await page.goto('http://127.0.0.1:5173/admin/login');
  await page.waitForTimeout(1000);
  const passwordVal = await page.locator('input[type="password"]').inputValue();
  console.log('   Admin password input value:', JSON.stringify(passwordVal));
  await page.screenshot({ path: path.join(outDir, 'fig_s3_admin_login_clean.png') });

  console.log('2. Logging in as Rajesh (Organization Mode)...');
  await page.goto('http://127.0.0.1:5173/login');
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'rajesh@technova.in');
  await page.fill('input[type="password"]', 'DemoPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('   Dashboard reached successfully.');

  console.log('3. Navigating to Onboarding (Step 2 Domain Challenge)...');
  await page.goto('http://127.0.0.1:5173/onboarding');
  await page.waitForTimeout(800);
  await page.fill('input[value*=""], input:not([disabled])', '29ABCDE1234F1Z5');
  await page.click('button:has-text("Verify GSTIN")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(800);

  // Step 2: Generate DNS Challenge
  console.log('   Generating DNS Challenge for technova.in...');
  await page.fill('input[placeholder*="technova.in"]', 'technova.in');
  await page.click('button:has-text("Generate DNS Challenge")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, 'fig_s3_onboarding_dns_challenge.png') });
  console.log('   DNS challenge screenshot captured.');

  console.log('4. Navigating to Settings Page...');
  await page.goto('http://127.0.0.1:5173/settings');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'fig_s3_organization_settings.png') });
  console.log('   Settings screenshot captured.');

  console.log('5. Navigating to Model Benchmark Dashboard...');
  await page.goto('http://127.0.0.1:5173/benchmark');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'fig_s3_benchmark_dashboard.png'), fullPage: false });
  console.log('   Benchmark dashboard screenshot captured.');

  await browser.close();
  console.log('All Stage 3 screenshots successfully generated in:', outDir);
}

main().catch(err => {
  console.error('Playwright error:', err);
  process.exit(1);
});
