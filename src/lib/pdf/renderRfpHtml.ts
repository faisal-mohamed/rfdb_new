import { RfpNode, RfpLeaf } from '@/types/workflow';

type RenderOptions = {
  title: string;
  customerName: string;
  generatedAt?: Date;
  data: RfpNode;
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function isLeaf(node: any): node is RfpLeaf {
  return node && typeof node === 'object' && 'extracted_data' in node && 'pages' in node;
}

function renderTree(node: RfpNode | RfpLeaf, level = 2): string {
  if (isLeaf(node)) {
    const body = escapeHtml(node.extracted_data || '');
    const pages = (node.pages || []).join(', ');
    return `<div class="rfp-leaf">
      <div class="rfp-leaf-body">${body || '<em>No content</em>'}</div>
      <div class="rfp-pages">Pages: ${pages || '-'}</div>
    </div>`;
  }

  const entries = Object.entries(node);
  return entries
    .map(([key, child]) => {
      const safeKey = escapeHtml(key);
      const tag = level >= 6 ? 'h6' : `h${level}`;
      return `<section class="rfp-section">
        <${tag} class="rfp-heading level-${level}">${safeKey}</${tag}>
        ${renderTree(child as any, Math.min(level + 1, 6))}
      </section>`;
    })
    .join('\n');
}

export function renderRfpHtml({ title, customerName, generatedAt = new Date(), data }: RenderOptions): string {
  const content = renderTree(data, 2);
  const generated = generatedAt.toLocaleString();

  // Professional, print-ready styles
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      /* Page setup */
      @page {
        size: A4 portrait;
        margin: 0.75in 0.75in 1in 0.75in;
      }
      
      /* Reset and base styles */
      * { 
        box-sizing: border-box; 
        margin: 0; 
        padding: 0; 
      }
      
      html {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      html, body { 
        margin: 0; 
        padding: 0; 
      }
      
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        color: #1a1a1a;
        font-size: 11pt;
        line-height: 1.6;
        background: #ffffff;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
      }
      
      .page { 
        padding: 0; 
        max-width: 100%;
      }
      
      /* Document header */
      .title { 
        font-size: 20pt; 
        font-weight: 700; 
        margin: 0 0 6pt; 
        color: #000000;
        border-bottom: 2pt solid #1a1a1a;
        padding-bottom: 10pt;
      }
      
      .subtitle { 
        color: #666666; 
        font-size: 10pt; 
        margin: 0 0 24pt; 
        font-weight: 400;
      }
      
      /* RFP Headings */
      .rfp-heading { 
        margin: 18pt 0 10pt; 
        color: #1a1a1a;
        font-weight: 600;
        page-break-after: avoid;
        page-break-inside: avoid;
      }
      
      .rfp-heading.level-2 { 
        font-size: 15pt; 
        border-bottom: 1.5pt solid #666666; 
        padding-bottom: 6pt;
        font-weight: 700;
      }
      
      .rfp-heading.level-3 { 
        font-size: 13pt;
        font-weight: 600;
      }
      
      .rfp-heading.level-4 { 
        font-size: 12pt;
        font-weight: 600;
      }
      
      .rfp-heading.level-5 { 
        font-size: 11pt;
        font-weight: 600;
        color: #333333;
      }
      
      .rfp-heading.level-6 { 
        font-size: 11pt;
        font-weight: 600;
        color: #333333;
      }
      
      /* Sections */
      .rfp-section { 
        margin-bottom: 18pt;
      }
      
      /* Leaf content */
      .rfp-leaf { 
        padding: 10pt 0 14pt; 
        border-bottom: 1pt dashed #cccccc;
        page-break-inside: avoid;
      }
      
      .rfp-leaf-body { 
        white-space: pre-wrap; 
        line-height: 1.6; 
        font-size: 11pt;
        color: #1a1a1a;
        margin-bottom: 8pt;
      }
      
      .rfp-pages { 
        margin-top: 8pt; 
        font-size: 9pt; 
        color: #666666;
        font-style: italic;
      }
      
      /* Print optimization */
      @media print {
        body {
          font-size: 11pt;
          color: #1a1a1a;
        }
        
        .rfp-heading {
          page-break-after: avoid;
        }
        
        .rfp-leaf {
          page-break-inside: avoid;
        }
        
        .rfp-section {
          page-break-inside: avoid;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <h1 class="title">${escapeHtml(title)}</h1>
      <div class="subtitle">Customer: ${escapeHtml(customerName)} · Generated: ${escapeHtml(generated)}</div>
      ${content}
    </div>
  </body>
 </html>`;
}


