import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

export async function generatePdfFromHtml(html: string, filenameBase: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });

    const outDir = path.join(process.cwd(), 'public', 'generated');
    await fs.mkdir(outDir, { recursive: true });
    const filePath = path.join(outDir, `${filenameBase}.pdf`);

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0.75in', bottom: '1in', left: '0.75in', right: '0.75in' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 9pt; padding: 0 0.75in; text-align: center; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="border-top: 1px solid #cccccc; padding-top: 8pt;">
            <span style="font-weight: 400;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        </div>
      `,
      preferCSSPageSize: true,
    });

    return `/generated/${filenameBase}.pdf`;
  } finally {
    await browser.close();
  }
}

export async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0.75in', bottom: '1in', left: '0.75in', right: '0.75in' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 9pt; padding: 0 0.75in; text-align: center; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="border-top: 1px solid #cccccc; padding-top: 8pt;">
            <span style="font-weight: 400;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        </div>
      `,
      preferCSSPageSize: true,
    });
    return buffer as Buffer;
  } finally {
    await browser.close();
  }
}


