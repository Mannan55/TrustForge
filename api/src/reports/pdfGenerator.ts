/**
 * TrustForge Evidence-Backed PDF Compliance Report Generator.
 * Generates publication-ready assessment reports with TrustForge branding,
 * deterministic scoring breakdowns, verified DPDP citations, and mandatory research disclaimers.
 */
import PDFDocument from 'pdfkit';
import { ModelFinding, TrustScoreComputation } from '../types/index.js';

export interface ReportGenerationOptions {
  scanId: string;
  websiteUrl: string;
  assessmentDate: string;
  trustScore: TrustScoreComputation;
  findings: ModelFinding[];
  evaluatedModels: string[];
}

export function generatePdfReport(options: ReportGenerationOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: `TrustForge DPDP Compliance Report — ${options.websiteUrl}`,
          Author: 'TrustForge Research Framework',
          Subject: 'Digital Personal Data Protection Act, 2023 Compliance Assessment',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Colors
      const navy = '#0F172A';
      const slate = '#475569';
      const beige = '#F8FAFC';
      const accent = '#2563EB';
      const gold = '#D97706';

      // ── Header / Brand Banner ─────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 100).fill(navy);
      
      doc.fillColor('#FFFFFF')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('TRUSTFORGE', 50, 32, { characterSpacing: 2 });

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#94A3B8')
        .text('Research-Grade DPDP Compliance Assessment Platform', 50, 60);

      doc.fillColor('#38BDF8')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('OFFICIAL STATUTORY EVALUATION', 400, 42, { align: 'right' });

      doc.moveDown(4);

      // ── Assessment Metadata Card ──────────────────────────────────────────
      doc.rect(50, 115, doc.page.width - 100, 80).fill('#F1F5F9');
      
      doc.fillColor(navy).fontSize(11).font('Helvetica-Bold').text('ASSESSMENT SUMMARY', 65, 128);

      doc.fontSize(9).font('Helvetica').fillColor(slate)
        .text(`Target URL:`, 65, 148).font('Helvetica-Bold').fillColor(navy).text(options.websiteUrl, 140, 148)
        .font('Helvetica').fillColor(slate).text(`Scan ID:`, 65, 164).font('Helvetica-Bold').fillColor(navy).text(options.scanId, 140, 164)
        .font('Helvetica').fillColor(slate).text(`Date:`, 330, 148).font('Helvetica-Bold').fillColor(navy).text(options.assessmentDate, 380, 148)
        .font('Helvetica').fillColor(slate).text(`Corpus:`, 330, 164).font('Helvetica-Bold').fillColor(navy).text('DPDP Act 2023 & Rules 2025 (83 Chunks)', 380, 164);

      // ── Overall Trust Score Block ─────────────────────────────────────────
      const scoreY = 215;
      doc.rect(50, scoreY, 200, 100).fill('#0F172A');
      doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('OVERALL TRUST SCORE', 65, scoreY + 16);
      
      const scoreStr = options.trustScore.trust_score != null ? `${options.trustScore.trust_score}` : 'N/A';
      doc.fillColor('#38BDF8').fontSize(36).font('Helvetica-Bold').text(scoreStr, 65, scoreY + 34);
      doc.fontSize(12).font('Helvetica').fillColor('#94A3B8').text('/ 100', 145, scoreY + 48);

      doc.rect(265, scoreY, doc.page.width - 315, 100).fill('#F8FAFC');
      doc.rect(265, scoreY, doc.page.width - 315, 100).stroke('#CBD5E1');

      doc.fillColor(navy).fontSize(10).font('Helvetica-Bold').text('POSTURE & METHODOLOGY', 280, scoreY + 16);
      doc.fontSize(9).font('Helvetica').fillColor(slate)
        .text(`Compliance Posture:`, 280, scoreY + 36).font('Helvetica-Bold').fillColor(gold).text(options.trustScore.posture, 390, scoreY + 36)
        .font('Helvetica').fillColor(slate).text(`Evidence Coverage:`, 280, scoreY + 54).font('Helvetica-Bold').fillColor(navy).text(`${options.trustScore.evidence_coverage}%`, 390, scoreY + 54)
        .font('Helvetica').fillColor(slate).text(`Evaluation Engine:`, 280, scoreY + 72).font('Helvetica-Bold').fillColor(navy).text(options.trustScore.is_consensus ? 'Top-3 Majority Voting Consensus' : options.trustScore.model_id, 390, scoreY + 72);

      // ── Pillar Breakdown Table ────────────────────────────────────────────
      const pillarY = 335;
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold').text('COMPLIANCE PILLAR PERFORMANCE', 50, pillarY);
      
      let curY = pillarY + 20;
      doc.rect(50, curY, doc.page.width - 100, 20).fill('#E2E8F0');
      doc.fillColor(navy).fontSize(8).font('Helvetica-Bold')
        .text('TRUST PILLAR', 60, curY + 6)
        .text('WEIGHT', 240, curY + 6)
        .text('SCORE', 310, curY + 6)
        .text('STATUS', 370, curY + 6)
        .text('PASS / GAP', 440, curY + 6);

      curY += 22;
      for (const [pId, p] of Object.entries(options.trustScore.pillar_scores)) {
        doc.rect(50, curY, doc.page.width - 100, 18).fill(curY % 2 === 0 ? '#FFFFFF' : '#F8FAFC');
        doc.fillColor(slate).fontSize(8).font('Helvetica')
          .text(p.pillar_name, 60, curY + 5)
          .text(`${Math.round(p.weight * 100)}%`, 240, curY + 5)
          .text(`${p.score}%`, 310, curY + 5)
          .font('Helvetica-Bold').fillColor(p.score >= 70 ? '#16A34A' : '#DC2626').text(p.score >= 70 ? 'Aligned' : 'Action Required', 370, curY + 5)
          .font('Helvetica').fillColor(slate).text(`${p.pass_count ?? p.passCount ?? 0} / ${p.gap_count ?? p.gapCount ?? 0}`, 440, curY + 5);
        curY += 20;
      }

      // ── Key Statutory Findings & Remediation ──────────────────────────────
      curY += 15;
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold').text('KEY STATUTORY FINDINGS & CITATIONS', 50, curY);
      curY += 18;

      const topFindings = options.findings.slice(0, 4);
      for (const f of topFindings) {
        if (curY > 680) {
          doc.addPage();
          curY = 50;
        }

        doc.rect(50, curY, doc.page.width - 100, 52).fill('#F8FAFC');
        doc.rect(50, curY, doc.page.width - 100, 52).stroke('#E2E8F0');

        const vColor = f.verdict === 'SUPPORTED' ? '#16A34A' : f.verdict === 'NOT_SUPPORTED' ? '#DC2626' : '#D97706';
        doc.fillColor(vColor).fontSize(8).font('Helvetica-Bold').text(`[${f.verdict}] ${f.control_id}`, 60, curY + 8);
        doc.fillColor(slate).fontSize(8).font('Helvetica').text(f.reasoning_summary.substring(0, 180), 60, curY + 20, { width: doc.page.width - 120 });

        if (f.legal_citations && f.legal_citations.length > 0) {
          const cit = f.legal_citations[0];
          doc.fillColor(accent).fontSize(7).font('Helvetica-Oblique').text(`Citation: ${cit.section} — "${(cit.verbatim_quote || '').substring(0, 100)}..."`, 60, curY + 38);
        }
        curY += 58;
      }

      // ── Mandatory Research Disclaimer ─────────────────────────────────────
      if (curY > 670) doc.addPage();
      const discY = doc.page.height - 90;
      doc.rect(50, discY, doc.page.width - 100, 50).fill('#FEF2F2');
      doc.rect(50, discY, doc.page.width - 100, 50).stroke('#FCA5A5');

      doc.fillColor('#991B1B').fontSize(7).font('Helvetica-Bold').text('MANDATORY ACADEMIC & RESEARCH DISCLAIMER', 60, discY + 8);
      doc.fillColor('#7F1D1D').fontSize(6.5).font('Helvetica').text(
        'This automated compliance report is generated for academic evaluation and research purposes under the Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025. Automated public website scanning cannot establish complete organizational legal compliance, which requires internal operational evidence and formal legal audits. Not a legal certification.',
        60, discY + 20, { width: doc.page.width - 120 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
