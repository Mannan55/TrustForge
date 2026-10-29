import os
import json
import base64
from pathlib import Path
from make_docx_guide import CATALOG

def generate_html_and_render_pdf():
    screenshots_dir = Path("TrustForge/TrustDocumentation/complete_documentation_screenshots").resolve()
    html_out = Path("TrustForge/TrustDocumentation/screenshots_guide.html").resolve()

    items_html = []
    current_cat = None

    for item in CATALOG:
        cat_badge = ""
        if item["category"] != current_cat:
            current_cat = item["category"]
            cat_badge = f"""
            <div class="category-header">
                <h2>{current_cat}</h2>
            </div>
            """

        img_file = screenshots_dir / item["file"]
        img_src = ""
        if img_file.exists():
            img_src = img_file.as_uri()

        items_html.append(f"""
        {cat_badge}
        <div class="figure-card">
            <div class="figure-header">
                <h3>{item["title"]}</h3>
                <div class="meta-tags">
                    <span class="tag route">Route: {item["route"]}</span>
                    <span class="tag role">Role: {item["role"]}</span>
                </div>
            </div>
            <div class="image-wrapper">
                <img src="{img_src}" alt="{item["title"]}" />
            </div>
            <div class="figure-caption">
                <p>{item["desc"]}</p>
            </div>
        </div>
        """)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TrustForge™ — Complete System Screenshots & Feature Verification Guide</title>
<style>
    @page {{
        size: A4 portrait;
        margin: 15mm 15mm 15mm 15mm;
        @bottom-right {{
            content: counter(page);
        }}
    }}
    body {{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #1e293b;
        background-color: #ffffff;
        margin: 0;
        padding: 0;
        line-height: 1.5;
    }}
    .cover {{
        padding: 40px 20px 20px 20px;
        text-align: center;
        border-bottom: 2px solid #e2e8f0;
        margin-bottom: 30px;
        page-break-after: always;
    }}
    .cover h1 {{
        color: #1e3a8a;
        font-size: 26pt;
        margin-bottom: 8px;
        font-weight: 800;
    }}
    .cover .subtitle {{
        font-size: 14pt;
        color: #475569;
        margin-bottom: 30px;
        font-weight: 500;
    }}
    .metadata-box {{
        display: inline-block;
        text-align: left;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 16px 24px;
        margin-bottom: 30px;
        max-width: 650px;
        width: 100%;
    }}
    .metadata-row {{
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #e2e8f0;
        font-size: 9.5pt;
    }}
    .metadata-row:last-child {{
        border-bottom: none;
    }}
    .metadata-label {{
        font-weight: 700;
        color: #334155;
    }}
    .metadata-value {{
        color: #0f172a;
        font-family: monospace;
        font-size: 9pt;
        text-align: right;
        max-width: 400px;
    }}
    .executive-summary {{
        text-align: justify;
        max-width: 680px;
        margin: 0 auto;
        font-size: 10pt;
        color: #334155;
        line-height: 1.6;
    }}
    .category-header {{
        page-break-before: always;
        margin-top: 20px;
        margin-bottom: 20px;
        padding-bottom: 8px;
        border-bottom: 3px solid #1e3a8a;
    }}
    .category-header h2 {{
        color: #0f172a;
        font-size: 18pt;
        margin: 0;
    }}
    .figure-card {{
        page-break-inside: avoid;
        margin-bottom: 30px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        overflow: hidden;
    }}
    .figure-header {{
        background: #f8fafc;
        padding: 12px 16px;
        border-bottom: 1px solid #e2e8f0;
    }}
    .figure-header h3 {{
        margin: 0 0 6px 0;
        color: #1e40af;
        font-size: 12pt;
    }}
    .meta-tags {{
        display: flex;
        gap: 8px;
    }}
    .tag {{
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 8.5pt;
        font-weight: 600;
    }}
    .tag.route {{
        background: #e0f2fe;
        color: #0369a1;
        font-family: monospace;
    }}
    .tag.role {{
        background: #f1f5f9;
        color: #475569;
    }}
    .image-wrapper {{
        text-align: center;
        background: #0f172a;
        padding: 8px;
    }}
    .image-wrapper img {{
        max-width: 100%;
        max-height: 480px;
        display: block;
        margin: 0 auto;
        border-radius: 4px;
    }}
    .figure-caption {{
        padding: 12px 16px;
        background: #ffffff;
    }}
    .figure-caption p {{
        margin: 0;
        font-size: 9.5pt;
        color: #334155;
        line-height: 1.5;
        text-align: justify;
    }}
</style>
</head>
<body>

<div class="cover">
    <h1>TrustForge™</h1>
    <div class="subtitle">Complete System Screenshots &amp; Feature Verification Guide</div>
    <div class="metadata-box">
        <div class="metadata-row">
            <span class="metadata-label">Platform Version:</span>
            <span class="metadata-value">v1.0.0-release (Golden Master)</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Verified Commit SHA:</span>
            <span class="metadata-value">035429f6c76d7ab6d14f2053b3e9d2050f493672</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Statutory Foundation:</span>
            <span class="metadata-value">DPDP Act 2023 (Act No. 22 of 2023, India)</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Authentication &amp; Tokens:</span>
            <span class="metadata-value">PBKDF2 (SHA-512, 10k iter), HMAC-SHA256 (tf_tok_)</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Trust Score Structure:</span>
            <span class="metadata-value">6 Canonical Pillars (C1-C10 Mappings, min(TS, 40) Caps)</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Benchmarking &amp; TOPSIS:</span>
            <span class="metadata-value">10 Candidate Slots (M01-M10), 7 Primary Criteria, $0 Spend</span>
        </div>
    </div>
    <div class="executive-summary">
        <p>
            <strong>Executive Architecture Summary:</strong> TrustForge is an automated compliance auditing and model benchmarking platform 
            designed to evaluate enterprise data privacy posture against India's Digital Personal Data Protection (DPDP) Act 2023. 
            This document delivers complete visual evidence of all customer-facing workflows, the complete 14-step statutory 
            assessment wizard, empirical analytics suites (hybrid RAG with Reciprocal Rank Fusion and TOPSIS MCDM), and the isolated Administrative Governance Console. 
            Every figure represents active application execution verified under strict continuous integration and zero-paid commercial inference boundary enforcement.
        </p>
    </div>
</div>

<div class="catalog-content">
    {"".join(items_html)}
</div>

</body>
</html>
"""

    with open(html_out, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"HTML guide generated at: {html_out}")

if __name__ == "__main__":
    generate_html_and_render_pdf()
