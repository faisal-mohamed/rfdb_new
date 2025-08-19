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
      margin: { top: '40px', bottom: '48px', left: '24px', right: '24px' },
      displayHeaderFooter: false,
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
      margin: { top: '40px', bottom: '48px', left: '24px', right: '24px' },
      displayHeaderFooter: false,
    });
    return buffer as Buffer;
  } finally {
    await browser.close();
  }
}


