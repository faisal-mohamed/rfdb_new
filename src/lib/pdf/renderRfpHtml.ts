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

  // Basic, print-friendly styles; tune later for brand
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --text: #0f172a;
        --muted: #475569;
        --border: #e2e8f0;
        --accent: #ec4899;
        --accent2: #ef4444;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'; color: var(--text); }
      .page { padding: 24px; }
      .title { font-size: 24px; font-weight: 800; margin: 0 0 4px; }
      .subtitle { color: var(--muted); font-size: 12px; margin: 0 0 24px; }
      .rfp-heading { margin: 16px 0 8px; color: var(--text); }
      .rfp-heading.level-2 { font-size: 16px; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
      .rfp-heading.level-3 { font-size: 14px; }
      .rfp-heading.level-4 { font-size: 13px; }
      .rfp-section { margin-bottom: 12px; }
      .rfp-leaf { padding: 8px 0 12px; border-bottom: 1px dashed var(--border); }
      .rfp-leaf-body { white-space: pre-wrap; line-height: 1.5; font-size: 12px; }
      .rfp-pages { margin-top: 8px; font-size: 11px; color: var(--muted); }
      .header, .footer { font-size: 10px; color: var(--muted); }
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


