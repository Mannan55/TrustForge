import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renderPdf() {
  const htmlPath = path.resolve(__dirname, '../../../TrustDocumentation/screenshots_guide.html');
  const pdfPath = path.resolve(__dirname, '../../../TrustDocumentation/TrustForge_Complete_System_Screenshots_Guide.pdf');

  console.log('Launching browser to render PDF...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`Loading HTML from: ${htmlPath}`);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 60000 });

  // Give images a moment to decode fully
  await page.waitForTimeout(2000);

  console.log(`Generating PDF at: ${pdfPath}`);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '15mm',
      right: '15mm',
    },
    printBackground: true,
  });

  await browser.close();
  console.log('PDF generation complete!');
}

renderPdf().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});

