// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth-config';
// import { prisma } from '@/lib/prisma';
// import { getSimplePermissions } from '@/lib/simplePermissions';
// import { VersionType } from '@prisma/client';
// import { chromium } from 'playwright';

// export async function GET(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id: processId } = await context.params;
//     const session = await getServerSession(authOptions);

//     if (!session?.user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const permissions = getSimplePermissions(session.user.role);
//     if (!permissions.canView) {
//       return NextResponse.json({ error: 'You do not have permission to download documents' }, { status: 403 });
//     }

//     // Get V1 data from database
//     const v1Version = await prisma.documentVersion.findFirst({
//       where: {
//         documentId: processId,
//         versionType: VersionType.VERSION_1,
//         status: 'APPROVED',
//       },
//       orderBy: { versionNumber: 'desc' },
//     });

//     if (!v1Version) {
//       return NextResponse.json({ error: 'Approved V1 not found' }, { status: 404 });
//     }

//     // Generate HTML content
//     const htmlContent = generateHTMLFromV1Data(v1Version.jsonContent);

//     // Generate PDF using Playwright
//     const browser = await chromium.launch();
//     const page = await browser.newPage();
    
//     await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    
//     const pdfBuffer : any = await page.pdf({
//       format: 'A4',
//       margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
//       printBackground: true,
//     });

//     await browser.close();

//     // Return PDF as response
//     return new NextResponse(pdfBuffer, {
//       headers: {
//         'Content-Type': 'application/pdf',
//         'Content-Disposition': `attachment; filename="V1-Document-${processId}.pdf"`,
//       },
//     });

//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
//   }
// }

// function generateHTMLFromV1Data(v1Data: any): string {
//   const formatFieldName = (fieldName: string) => {
//     return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
//   };

//   const renderFieldValue = (fieldData: any) => {
//     if (!fieldData || typeof fieldData !== 'object') {
//       return '<span style="color: #94a3b8; font-style: italic;">Not provided</span>';
//     }

//     const value = fieldData.value;
    
//     if (!value || value === '') {
//       return '<span style="color: #94a3b8; font-style: italic;">Not provided</span>';
//     }
    
//     if (typeof value === 'string') {
//       const lines = value.split('\\n').filter(line => line.trim() !== '');
//       return lines.map(line => `<p style="margin-bottom: 12px; line-height: 1.6; color: #374151;">${line.trim()}</p>`).join('');
//     }
    
//     return `<span style="color: #374151;">${String(value)}</span>`;
//   };

//   let htmlContent = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="UTF-8">
//       <title>V1 Document Content</title>
//       <style>
//         body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
//         .page { margin-bottom: 40px; padding: 32px; border-bottom: 1px solid #e2e8f0; }
//         .page:last-child { border-bottom: none; }
//         .page-title { font-size: 24px; font-weight: bold; color: #1e293b; margin-bottom: 8px; }
//         .page-divider { width: 64px; height: 4px; background: #2563eb; border-radius: 2px; margin-bottom: 32px; }
//         .field-section { margin-bottom: 32px; }
//         .field-title { font-size: 18px; font-weight: 600; color: #1f2937; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
//         .field-content { padding-left: 16px; }
//       </style>
//     </head>
//     <body>
//   `;

//   Object.entries(v1Data).forEach(([pageKey, pageData]: [string, any], pageIndex) => {
//     htmlContent += `
//       <div class="page">
//         <h2 class="page-title">Document Content - Page ${pageIndex + 1}</h2>
//         <div class="page-divider"></div>
//     `;

//     pageData.extracted_content?.[0]?.fields?.forEach((fieldGroup: any) => {
//       Object.entries(fieldGroup).forEach(([fieldName, fieldData]) => {
//         htmlContent += `
//           <div class="field-section">
//             <h3 class="field-title">${formatFieldName(fieldName)}</h3>
//             <div class="field-content">
//               ${renderFieldValue(fieldData)}
//             </div>
//           </div>
//         `;
//       });
//     });

//     htmlContent += `</div>`;
//   });

//   htmlContent += `
//     </body>
//     </html>
//   `;

//   return htmlContent;
// }





import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { VersionType } from '@prisma/client';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canView) {
      return NextResponse.json({ error: 'You do not have permission to download documents' }, { status: 403 });
    }

    // Get V1 data from database
    const v1Version = await prisma.documentVersion.findFirst({
      where: {
        documentId: processId,
        versionType: VersionType.VERSION_1,
        status: 'APPROVED',
      },
      orderBy: { versionNumber: 'desc' },
    });

    if (!v1Version) {
      return NextResponse.json({ error: 'Approved V1 not found' }, { status: 404 });
    }

    // Generate HTML content
    const htmlContent = generateHTMLFromV1Data(v1Version.jsonContent);

    // Generate PDF using Playwright
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    
    const pdfBuffer : any = await page.pdf({
      format: 'A4',
      margin: { top: '1in', right: '1in', bottom: '0.85in', left: '1in' },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 9pt; padding: 0 1in; text-align: center; color: #000000; font-family: Arial, Helvetica, sans-serif;">
          <span style="font-weight: 500;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    });

    await browser.close();
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="V1-Document-${processId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

function generateHTMLFromV1Data(v1Data: any): string {
  // Extract generated_data from the response structure
  const extractedContent = v1Data?.["1"]?.extracted_content?.[0]?.fields?.[0]?.generated_data?.value;
  
  if (!extractedContent) {
    return '<html><body><p>No generated data found</p></body></html>';
  }

  // Process images first to convert relative paths to base64
  const processedContent = processImagesInContent(extractedContent);
  
  // Generate HTML using professional template
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RFP Document</title>
      <style>
        /* Page setup - Professional margins */
        @page {
          size: A4 portrait;
          margin: 1in 1in 0.85in 1in;
        }
        
        /* Reset and base styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: 13pt;
          line-height: 1.7;
          color: #000000;
          background: #ffffff;
          padding: 0;
          margin: 0;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-weight: 400;
        }
        
        /* Document container */
        .document-container {
          max-width: 100%;
          margin: 0 auto;
          padding: 0;
        }
        
        /* Headers - Exact match to your template */
        h1, h2, h3, h4, h5, h6 {
          font-family: Arial, Helvetica, sans-serif;
          font-weight: 700;
          line-height: 1.2;
          page-break-after: avoid;
          page-break-inside: avoid;
          color: #000000;
          letter-spacing: 0.02em;
        }
        
        /* H1 - Major sections (CONFIDENTIALITY CLAUSE, DISCLAIMER, etc.) */
        h1 {
          font-size: 20pt;
          font-weight: 700;
          color: #000000;
          border-bottom: 2.5pt solid #000000;
          padding-bottom: 6pt;
          margin-top: 0;
          margin-bottom: 14pt;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        
        /* H2 - Subsections (GLOSSARY AND ABBREVIATIONS, etc.) */
        h2 {
          font-size: 16pt;
          font-weight: 700;
          color: #000000;
          border-bottom: 2pt solid #000000;
          padding-bottom: 5pt;
          margin-top: 16pt;
          margin-bottom: 12pt;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        /* H3 - Sub-subsections */
        h3 {
          font-size: 14pt;
          font-weight: 700;
          color: #000000;
          margin-top: 12pt;
          margin-bottom: 8pt;
          text-transform: none;
          letter-spacing: 0.02em;
        }
        
        /* H4 - Minor sections */
        h4 {
          font-size: 13pt;
          font-weight: 700;
          color: #000000;
          margin-top: 10pt;
          margin-bottom: 6pt;
          text-transform: none;
        }
        
        /* H5, H6 - Small headers */
        h5, h6 {
          font-size: 12pt;
          font-weight: 700;
          color: #000000;
          margin-top: 10pt;
          margin-bottom: 6pt;
          text-transform: none;
        }
        
        /* Bold text - preserve weight */
        h1 strong, h2 strong, h3 strong, h4 strong, h5 strong, h6 strong {
          font-weight: 700;
        }
        
        /* Paragraphs - Enhanced spacing */
        p {
          margin-bottom: 10pt;
          line-height: 1.6;
          text-align: justify;
          text-justify: inter-word;
          orphans: 2;
          widows: 2;
          font-size: 13pt;
          color: #000000;
        }
        
        p + p {
          margin-top: 0;
        }
        
        /* Keep paragraph with following list */
        p:has(+ ul), p:has(+ ol) {
          margin-bottom: 6pt;
          page-break-after: avoid;
        }
        
        /* Strong and emphasis */
        strong, b {
          font-weight: 700;
          color: #000000;
        }
        
        em, i {
          font-style: italic;
          color: #000000;
        }
        
        /* Underline text */
        u {
          text-decoration: underline;
          text-decoration-thickness: 0.5pt;
        }
        
        /* Blockquotes - Enhanced spacing */
        blockquote {
          margin: 18pt 0 18pt 55pt;
          padding: 0;
          border-left: none;
          background-color: transparent;
          font-style: italic;
          color: #000000;
          page-break-inside: avoid;
          line-height: 1.65;
        }
        
        blockquote p {
          margin-bottom: 12pt;
          font-size: 12pt;
          text-align: left;
        }
        
        blockquote p:last-child {
          margin-bottom: 0;
        }
        
        /* Lists - Professional spacing */
        ul, ol {
          margin: 6pt 0 10pt 45pt;
          padding-left: 0;
          page-break-before: avoid;
        }
        
        li {
          margin-bottom: 6pt;
          line-height: 1.55;
          padding-left: 6pt;
          font-size: 13pt;
          color: #000000;
          page-break-inside: auto;
        }
        
        /* Keep list with preceding content */
        p + ul, p + ol,
        h1 + ul, h1 + ol,
        h2 + ul, h2 + ol,
        h3 + ul, h3 + ol,
        h4 + ul, h4 + ol {
          margin-top: 4pt;
          page-break-before: avoid;
        }
        
        ul li {
          list-style-type: disc;
        }
        
        ul ul li {
          list-style-type: circle;
          margin-left: 20pt;
        }
        
        ul ul ul li {
          list-style-type: square;
        }
        
        ol {
          list-style-type: decimal;
        }
        
        ol ol {
          list-style-type: lower-alpha;
          margin-left: 20pt;
        }
        
        /* Numbered lists with proper spacing */
        ol li {
          padding-left: 6pt;
        }
        
        /* Tables - Professional with better spacing */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16pt 0;
          page-break-inside: avoid;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9pt;
          background: white;
          table-layout: auto;
        }
        
        /* Keep table headers on each page */
        thead {
          display: table-header-group;
          background: #ffffff;
          border-bottom: none;
        }
        
        /* Our Clientele table specific styling - no special rules needed since we convert thead to tbody */
        
        th {
          padding: 8pt 10pt;
          text-align: left !important;
          font-weight: 700;
          color: #000000;
          border: 1pt solid #000000;
          vertical-align: middle;
          line-height: 1.3;
          font-size: 9pt;
          background-color: #e8e8e8;
          white-space: normal;
          word-wrap: break-word;
        }
        
        td {
          padding: 8pt 10pt;
          border: 1pt solid #000000;
          text-align: left !important;
          vertical-align: top;
          color: #000000;
          line-height: 1.4;
          font-size: 9pt;
          white-space: normal;
          word-wrap: break-word;
        }
        
        /* Alternating row colors - subtle like your template */
        tbody tr:nth-child(odd) {
          background-color: #ffffff;
        }
        
        tbody tr:nth-child(even) {
          background-color: #f5f5f5;
        }
        
        /* Table classes from markdown */
        tr.header {
          background: #e8e8e8;
          font-weight: 700;
        }
        
        tr.odd {
          background-color: #ffffff;
        }
        
        tr.even {
          background-color: #f5f5f5;
        }
        
        /* FORCE LEFT ALIGNMENT FOR ALL TABLE ROWS AND CELLS */
        tr.header th, tr.header td,
        tr.odd th, tr.odd td,
        tr.even th, tr.even td {
          text-align: left !important;
        }
        
        /* Colgroup styling - preserve column widths */
        colgroup col {
          border: none;
        }
        
        /* Enhanced table alignment and spacing */
        table {
          border-spacing: 0;
        }
        
        /* Better text alignment in table cells - LEFT ALIGN ALL */
        th {
          text-align: left;
          vertical-align: middle;
        }
        
        td {
          text-align: left;
          vertical-align: top;
        }
        
        /* Better spacing for table content */
        th, td {
          padding: 6pt 8pt;
          word-break: break-word;
          hyphens: auto;
        }
        
        /* FORCE LEFT ALIGNMENT FOR ALL TABLE CONTENT */
        table th, table td {
          text-align: left !important;
        }
        
        /* Override any center alignment */
        table th[style*="text-align: center"],
        table td[style*="text-align: center"] {
          text-align: left !important;
        }
        
        /* Ensure all table content is left-aligned */
        table * {
          text-align: left !important;
        }
        
        /* Fix bullet point alignment in table cells */
        table ul, table ol {
          margin-left: 0 !important;
          margin-right: 0;
          padding-left: 0 !important;
        }
        
        table li {
          padding-left: 0 !important;
          margin-left: 0;
          text-indent: 0;
        }
        
        /* Ensure bullet points are properly positioned in table cells */
        table ul li {
          list-style-position: inside;
          padding-left: 0;
          margin-left: 0;
        }
        
        /* But keep images centered in table cells */
        table img {
          text-align: center !important;
          margin: 0 auto;
        }
        
        /* Small tables (glossary, contact info) */
        table[style*="width: 21%"] {
          font-size: 8.5pt;
        }
        
        /* Our Clientele table - prevent unnecessary page breaks */
        table:has(th:has(img)) {
          page-break-inside: avoid;
          margin: 12pt 0;
        }
        
        /* Ensure Our Clientele table stays together */
        h2:has(+ table:has(th:has(img))),
        h2:has(+ p + table:has(th:has(img))) {
          page-break-after: avoid;
        }
        
        /* Prevent table breaks after headers when possible */
        thead tr {
          page-break-after: avoid;
        }
        
        tbody tr {
          page-break-inside: avoid;
        }
        
        /* Images - Generous spacing and sizing */
        img {
          max-width: 100%;
          height: auto;
          margin: 18pt auto;
          display: block;
          page-break-inside: avoid;
          // border: 1.5pt solid #999999;
          border-radius: 0;
        }
        
        /* Small images (logos in tables) - Constrain size to prevent overflow */
        td img, th img {
          max-width: 50pt !important;
          max-height: 32pt !important;
          height: auto !important;
          width: auto !important;
          margin: 3pt auto;
          border: none;
          display: block;
          box-shadow: none;
          object-fit: contain;
        }
        
        /* Override inline styles on table images */
        table img[style] {
          max-width: 50pt !important;
          max-height: 32pt !important;
          width: auto !important;
          height: auto !important;
        }
        
        /* Handle multiple images in a single table cell */
        td p {
          margin: 0;
          padding: 0;
          text-align: center;
        }
        
        td p + p {
          margin-top: 3pt;
        }
        
        td p img {
          max-width: 50pt !important;
          max-height: 28pt !important;
        }
        
        /* Ensure alt text and style attributes are not visible */
        img {
          font-size: 0;
          line-height: 0;
        }
        
        /* Hide any text content that might appear with images */
        td:has(img), th:has(img) {
          font-size: 0;
          line-height: 0;
        }
        
        /* Hide any text content in table cells containing images */
        td img, th img {
          display: block;
          text-indent: -9999px;
          overflow: hidden;
        }
        
        /* Ensure no text appears with images in table cells */
        td:has(img) *, th:has(img) * {
          display: none;
        }
        
        /* But allow paragraph tags that contain images */
        td:has(img) p:has(img), th:has(img) p:has(img) {
          display: block !important;
        }
        
        td:has(img) img, th:has(img) img {
          display: block !important;
        }
        
        /* Small standalone images (< 2 inches) */
        img[style*="width:0."], 
        img[style*="width:1."] {
          max-width: 140pt;
          margin: 14pt auto;
          // border: 1.5pt solid #999999;
        }
        
        /* Medium images (2-4 inches) */
        img[style*="width:2."],
        img[style*="width:3."],
        img[style*="width:4."] {
          max-width: 65%;
          margin: 18pt auto;
          // border: 1.5pt solid #999999;
        }
        
        /* Large images (4-6 inches) */
        img[style*="width:5."],
        img[style*="width:6."] {
          max-width: 85%;
          margin: 20pt auto;
          // border: 2pt solid #999999;
        }
        
        /* Full-width diagrams (> 6 inches) */
        img[style*="width:6.5"], 
        img[style*="width:6.69"], 
        img[style*="width:7."] {
          max-width: 100%;
          margin: 24pt auto;
          page-break-before: auto;
          // border: 2pt solid #000000;
        }
        
        /* Screenshot images - preserve quality */
        img[alt*="screenshot"], 
        img[alt*="Screenshot"],
        img[alt*="Description automatically generated"] {
          max-width: 95%;
          // border: 2pt solid #666666;
        }
        
        /* Image container */
        .image-container {
          margin: 20pt 0;
          text-align: center;
          page-break-inside: avoid;
        }
        
        /* Preformatted text - Contact info blocks */
        pre {
          background-color: #ffffff;
          border: 1pt solid #000000;
          border-radius: 0;
          padding: 8pt;
          margin: 12pt 0;
          font-family: 'Courier New', 'Consolas', monospace;
          font-size: 7pt;
          line-height: 1.15;
          white-space: pre;
          word-wrap: normal;
          page-break-inside: avoid;
          color: #000000;
          overflow: visible;
          letter-spacing: 0;
          font-weight: normal;
        }
        
        code {
          font-family: 'Courier New', 'Consolas', monospace;
          font-size: 11pt;
          background-color: #f5f5f5;
          padding: 2pt 4pt;
          border-radius: 0;
          color: #000000;
          border: 0.5pt solid #cccccc;
        }
        
        pre code {
          background-color: transparent;
          padding: 0;
          color: #000000;
          border: none;
        }
        
        /* Horizontal rules */
        hr {
          border: none;
          border-top: 2pt solid #000000;
          margin: 28pt 0;
          page-break-after: avoid;
        }
        
        /* Links - Black for printing */
        a {
          color: #000000;
          text-decoration: underline;
          text-decoration-thickness: 0.5pt;
        }
        
        a:hover {
          color: #000000;
        }
        
        /* Spans with inline styles (preserve) */
        span[style] {
          /* Inline styles preserved */
        }
        
        /* Special span formatting from markdown */
        span[style*="font-family:Aptos"],
        span[style*="font-family: Aptos"] {
          font-family: 'Calibri', 'Arial', sans-serif;
        }
        
        span[style*="font-size:12pt"],
        span[style*="font-size: 12pt"] {
          font-size: 11pt;
        }
        
        /* Page break utilities */
        .page-break {
          page-break-before: always;
        }
        
        .page-break-after {
          page-break-after: always;
        }
        
        .no-break {
          page-break-inside: avoid;
        }
        
        /* Print-specific optimizations */
        @media print {
          body {
            font-size: 13pt;
            color: #000000;
          }
          
          h1 {
            font-size: 20pt;
            page-break-after: avoid;
            margin-top: 0;
          }
          
          h2 {
            font-size: 16pt;
            page-break-after: avoid;
            margin-top: 16pt;
          }
          
          h3 {
            font-size: 14pt;
            page-break-after: avoid;
            margin-top: 12pt;
          }
          
          h4, h5, h6 {
            font-size: 13pt;
            page-break-after: avoid;
            margin-top: 10pt;
          }
          
          table {
            page-break-inside: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tr {
            page-break-inside: avoid;
          }
          
          img {
            page-break-inside: avoid;
            page-break-before: auto;
            page-break-after: auto;
          }
          
          pre {
            page-break-inside: avoid;
          }
          
          blockquote {
            page-break-inside: avoid;
          }
          
          /* Keep content together */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
          }
          
          h1 + p, h2 + p, h3 + p, h4 + p {
            page-break-before: avoid;
          }
          
          h1 + ul, h2 + ul, h3 + ul, h4 + ul {
            page-break-before: avoid;
          }
          
          p {
            orphans: 2;
            widows: 2;
          }
          
          /* Allow page breaks in long lists */
          ul, ol {
            page-break-inside: auto;
          }
          
          li {
            page-break-inside: auto;
          }
          
          /* Don't force new pages for major sections */
          h1 {
            page-break-before: auto;
          }
        }
        
        /* Additional professional touches */
        .section-break {
          margin: 20pt 0;
          border-top: 1.5pt solid #000000;
        }
        
        /* Caption text */
        .caption {
          font-size: 10pt;
          font-style: italic;
          text-align: center;
          margin-top: 8pt;
          color: #000000;
        }
        
        /* Footnote text */
        .footnote {
          font-size: 10pt;
          line-height: 1.5;
          margin-top: 24pt;
          padding-top: 10pt;
          border-top: 0.75pt solid #000000;
          color: #000000;
        }
      </style>
    </head>
    <body>
      <div class="document-container">
  `;

  // Convert the markdown/HTML content directly, preserving the original structure
  htmlContent += convertMarkdownToHtml(processedContent);

  htmlContent += `
      </div>
    </body>
    </html>
  `;

  return htmlContent;
}

function processInlineFormatting(text: string): string {
  let processed = text;
  
  // Fix pattern like "6.** **TEXT" or "number.** **TEXT"
  processed = processed.replace(/(\d+\.)\*\*\s+\*\*([^*]+?)$/g, '$1 **$2**');
  processed = processed.replace(/(\d+\.)\*\*\s+([^*]+?)$/g, '$1 **$2**');
  
  // Fix malformed asterisk patterns
  processed = processed.replace(/^\*([^*]+?)\*\*$/g, '**$1**');
  processed = processed.replace(/^\*\*([^*]+?)\*$/g, '**$1**');
  processed = processed.replace(/\*([^*]+?)\*\*/g, '**$1**');
  processed = processed.replace(/\*\*([^*]+?)\*/g, '**$1**');
  processed = processed.replace(/\*\*\s+\*\*([^*]+?)$/g, '**$1**');
  processed = processed.replace(/^\s*\*\s*([^*])/g, '$1');
  
  // Convert bold markers **text** to <strong>
  processed = processed.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert single asterisks to italic
  processed = processed.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  
  // Clean up stray asterisks
  processed = processed.replace(/^\*+\s*/g, '');
  processed = processed.replace(/\s*\*+$/g, '');
  
  return processed;
}

function convertMarkdownTableToHtml(tableLines: string[]): string {
  if (tableLines.length < 2) return '';
  
  let html = '<table>\n';
  let isFirstRow = true;
  let isSeparatorRow = false;
  
  for (let i = 0; i < tableLines.length; i++) {
    const line = tableLines[i];
    let cells = line.split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1);
    
    if (i === 1 && cells.every(cell => /^[-:\s]+$/.test(cell))) {
      isSeparatorRow = true;
      html += '</thead>\n<tbody>\n';
      continue;
    }
    
    if (isFirstRow && !isSeparatorRow) {
      html += '<thead>\n<tr>\n';
      cells.forEach(cell => {
        const processedCell = processInlineFormatting(cell);
        html += `<th>${processedCell}</th>\n`;
      });
      html += '</tr>\n';
      isFirstRow = false;
    } else if (!isSeparatorRow) {
      if (i === 1 && !html.includes('<tbody>')) {
        html += '</thead>\n<tbody>\n';
      }
      html += '<tr>\n';
      cells.forEach(cell => {
        const processedCell = processInlineFormatting(cell);
        html += `<td>${processedCell}</td>\n`;
      });
      html += '</tr>\n';
    }
    
    isSeparatorRow = false;
  }
  
  if (!html.includes('</tbody>')) {
    html += '</thead>\n';
  } else {
    html += '</tbody>\n';
  }
  html += '</table>\n';
  
  return html;
}

function convertMarkdownToHtml(content: string): string {
  // Process line by line to maintain exact structure
  const lines = content.split('\n');
  let html = '';
  let inPreBlock = false;
  let preContent = '';
  let inMarkdownTable = false;
  let markdownTableLines: string[] = [];
  let inMultiLineImg = false;
  let multiLineImgContent = '';
  let inClienteleTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Handle pre blocks first
    if (trimmedLine === '<pre> \n') {
      inPreBlock = true;
      preContent = '';
      continue;
    }
    
    if (inPreBlock) {
      if (trimmedLine === '</pre>' || trimmedLine === '</pre>\n') {
        html += `<pre>\n${preContent}</pre>\n`;
        inPreBlock = false;
        preContent = '';
      } else {
        preContent += line + '\n';
      }
      continue;
    }
    
    // Handle multi-line img tags
    if (inMultiLineImg) {
      multiLineImgContent += line + '\n';
      
      // Check if this line closes the img tag
      if (trimmedLine.includes('/>') || trimmedLine.includes('</img>')) {
        html += multiLineImgContent;
        inMultiLineImg = false;
        multiLineImgContent = '';
      }
      continue;
    }
    
    
    // Detect Markdown table (pipe-separated)
    const isMarkdownTableRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|') && trimmedLine.includes('|');
    
    if (isMarkdownTableRow && !inMarkdownTable) {
      inMarkdownTable = true;
      markdownTableLines = [trimmedLine];
      continue;
    }
    
    if (inMarkdownTable) {
      if (isMarkdownTableRow) {
        markdownTableLines.push(trimmedLine);
        continue;
      } else {
        html += convertMarkdownTableToHtml(markdownTableLines);
        inMarkdownTable = false;
        markdownTableLines = [];
      }
    }
    
    // Handle existing HTML elements - preserve exactly as they are
    if (line.includes('<table') || line.includes('<thead') || line.includes('<tbody') || 
        line.includes('<tr') || line.includes('<th') || line.includes('<td') || 
        line.includes('</table') || line.includes('</thead') || line.includes('</tbody') || 
        line.includes('</tr') || line.includes('</th') || line.includes('</td') ||
        line.includes('<colgroup') || line.includes('<col') || line.includes('</colgroup') ||
        line.includes('<img') || line.includes('<span') || line.includes('<blockquote') ||
        line.includes('</blockquote') || line.includes('</span') ||
        line.includes('<p>') || line.includes('</p>') ||
        // Also include lines that look like HTML attributes
        trimmedLine.match(/^[a-zA-Z][a-zA-Z0-9]*="[^"]*"$/) ||
        trimmedLine.match(/^(src|alt|style|width|height|class|id)=/)) {
      
      // Check if this is a multi-line img tag (starts with <img but doesn't end with />)
      if (trimmedLine.startsWith('<img') && !trimmedLine.includes('/>') && !trimmedLine.includes('</img>')) {
        inMultiLineImg = true;
        multiLineImgContent = line + '\n';
        continue;
      }
      
      // Check if this is a continuation line of an img tag (attribute line)
      if (inMultiLineImg && (trimmedLine.match(/^[a-zA-Z][a-zA-Z0-9]*="[^"]*"$/) || trimmedLine.match(/^(src|alt|style|width|height|class|id)=/))) {
        multiLineImgContent += line + '\n';
        continue;
      }
      
      // Clean up any stray text that might appear with img tags
      let cleanedLine = line;
      if (line.includes('<img')) {
        // Remove any text that appears after img tags on the same line
        cleanedLine = cleanedLine.replace(/<\/img>([^<]+)/g, '</img>');
        cleanedLine = cleanedLine.replace(/\/>([^<]+)/g, '/>');
      }
      
      // Detect Our Clientele table and add class
      if (trimmedLine === '<table>') {
        // Check if this is the Our Clientele table by looking ahead for the specific colgroup
        const nextLines = lines.slice(i, i + 10).join('\n');
        if (nextLines.includes('col style="width: 28%"') && 
            nextLines.includes('col style="width: 19%"') &&
            nextLines.includes('col style="width: 27%"') &&
            nextLines.includes('col style="width: 25%"')) {
          cleanedLine = cleanedLine.replace('<table>', '<table class="clientele-table">');
          inClienteleTable = true;
        }
      }
      
      // Convert thead to tbody for Our Clientele table to prevent header repetition
      if (inClienteleTable && trimmedLine === '<thead>') {
        cleanedLine = cleanedLine.replace('<thead>', '<tbody>');
      }
      
      if (inClienteleTable && trimmedLine === '</thead>') {
        cleanedLine = cleanedLine.replace('</thead>', '</tbody>');
      }
      
      // Convert th to td for Our Clientele table first row
      if (inClienteleTable && trimmedLine.includes('<th')) {
        cleanedLine = cleanedLine.replace(/<th/g, '<td').replace(/<\/th>/g, '</td>');
      }
      
      // Reset clientele table flag when table ends
      if (trimmedLine === '</table>') {
        inClienteleTable = false;
      }
      
      html += cleanedLine + '\n';
      continue;
    }
    
    // Process inline HTML tags (normalize <U> to <u>)
    let processedLine = line;
    processedLine = processedLine.replace(/<U>/gi, '<u>');
    processedLine = processedLine.replace(/<\/U>/gi, '</u>');
    const processedTrimmed = processedLine.trim();
    
    // Handle markdown headers
    if (trimmedLine.startsWith('# **') && trimmedLine.endsWith('**')) {
      const headerText = trimmedLine.replace(/^# \*\*(.*)\*\*$/, '$1');
      html += `<h1><strong>${headerText}</strong></h1>\n`;
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4 && !trimmedLine.includes('<u>')) {
      const headerText = trimmedLine.replace(/\*\*/g, '');
      html += `<h2><strong>${headerText}</strong></h2>\n`;
    } else if (trimmedLine.startsWith('## **') && trimmedLine.endsWith('**')) {
      const headerText = trimmedLine.replace(/^## \*\*(.*)\*\*$/, '$1');
      html += `<h3><strong>${headerText}</strong></h3>\n`;
    } else if (trimmedLine.startsWith('### **') && trimmedLine.endsWith('**')) {
      const headerText = trimmedLine.replace(/^### \*\*(.*)\*\*$/, '$1');
      html += `<h4><strong>${headerText}</strong></h4>\n`;
    } else if (trimmedLine.startsWith('# ')) {
      const headerText = trimmedLine.replace(/^# /, '');
      html += `<h1>${headerText}</h1>\n`;
    } else if (trimmedLine.startsWith('## ')) {
      const headerText = trimmedLine.replace(/^## /, '');
      html += `<h2>${headerText}</h2>\n`;
    } else if (trimmedLine.startsWith('### ')) {
      const headerText = trimmedLine.replace(/^### /, '');
      html += `<h3>${headerText}</h3>\n`;
    }
    // Handle bullet points with inline formatting
    else if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ')) {
      const listItem = processedTrimmed.substring(1).trim();
      const formattedItem = processInlineFormatting(listItem);
      html += `<li>${formattedItem}</li>\n`;
    }
    else if (trimmedLine.match(/^\*\s+/)) {
      const listItem = processedTrimmed.substring(1).trim();
      const formattedItem = processInlineFormatting(listItem);
      html += `<li>${formattedItem}</li>\n`;
    }
    // Handle quote blocks
    else if (trimmedLine.startsWith('>')) {
      const quoteText = trimmedLine.replace(/^>\s*/, '');
      html += `<blockquote><p>${quoteText}</p></blockquote>\n`;
    }
    // Handle empty lines
    else if (trimmedLine === '') {
      html += '\n';
    }
    // Handle paragraph text
    else {
      if (processedTrimmed && !processedLine.startsWith('<table') && !processedLine.startsWith('<img')) {
        const formatted = processInlineFormatting(processedLine);
        if (formatted.trim()) {
          html += `<p>${formatted}</p>\n`;
        }
      } else if (trimmedLine) {
        html += processedLine + '\n';
      }
    }
  }
  
  // Handle markdown table at end of content
  if (inMarkdownTable && markdownTableLines.length > 0) {
    html += convertMarkdownTableToHtml(markdownTableLines);
  }
  
  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li>.*?<\/li>\s*)+/g, '<ul>\n$&\n</ul>');
  
  return html;
}

function processImagesInContent(content: string): string {
  // Find all image references and convert them to base64
  return content.replace(/<img\s+src="([^"]*)"[^>]*>/gi, (match, src) => {
    try {
      // Convert relative path to absolute file system path
      let imagePath = src;
      if (src.startsWith('./')) {
        imagePath = path.join(process.cwd(), 'public', src.replace('./', '/'));
      } else if (src.startsWith('/')) {
        imagePath = path.join(process.cwd(), 'public', src);
      }
      
      // Check if file exists and convert to base64
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = getMimeType(imagePath);
        const base64Src = `data:${mimeType};base64,${base64Image}`;
        
        // Replace src in the original img tag
        return match.replace(`src="${src}"`, `src="${base64Src}"`);
      } else {
        console.warn(`Image not found: ${imagePath}`);
        return match;
      }
    } catch (error) {
      console.error(`Error processing image ${src}:`, error);
      return match;
    }
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseGeneratedData(content: string): any[] {
  const sections: any[] = [];
  const lines = content.split('\n');
  let currentSection: any = null;
  let inHtmlTable = false;
  let htmlTableLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      if (inHtmlTable && htmlTableLines.length > 0) {
        if (currentSection) {
          const tableData = parseHtmlTable(htmlTableLines.join('\n'));
          if (tableData) {
            currentSection.type = 'table';
            currentSection.tableData = tableData;
          }
        }
        inHtmlTable = false;
        htmlTableLines = [];
      }
      continue;
    }
    
    // Detect HTML table start
    if (trimmedLine.includes('<table>')) {
      inHtmlTable = true;
      htmlTableLines = [line];
      continue;
    }
    
    // Continue collecting HTML table lines
    if (inHtmlTable) {
      htmlTableLines.push(line);
      if (trimmedLine.includes('</table>')) {
        if (currentSection) {
          const tableData = parseHtmlTable(htmlTableLines.join('\n'));
          if (tableData) {
            currentSection.type = 'table';
            currentSection.tableData = tableData;
          }
        }
        inHtmlTable = false;
        htmlTableLines = [];
      }
      continue;
    }
    
    // Detect headers
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: trimmedLine.replace(/\*\*/g, ''),
        content: '',
        level: 1,
        type: 'text'
      };
    } else if (trimmedLine.startsWith('# ')) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: trimmedLine.replace(/^# /, ''),
        content: '',
        level: 1,
        type: 'text'
      };
    } else if (trimmedLine.startsWith('## ')) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: trimmedLine.replace(/^## /, ''),
        content: '',
        level: 2,
        type: 'text'
      };
    } else if (trimmedLine.startsWith('### ')) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: trimmedLine.replace(/^### /, ''),
        content: '',
        level: 3,
        type: 'text'
      };
    } else {
      if (!currentSection) {
        currentSection = {
          title: 'Introduction',
          content: '',
          level: 1,
          type: 'text'
        };
      }
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  }
  
  if (currentSection) sections.push(currentSection);
  
  // Parse images in each section
  sections.forEach(section => {
    const images = parseImages(section.content);
    if (images.length > 0) {
      section.images = images;
      section.type = section.type === 'table' ? 'table' : 'mixed';
    }
  });
  
  return sections;
}

function parseHtmlTable(htmlContent: string): any {
  try {
    // Simple regex-based parsing for server-side
    const headerMatch = htmlContent.match(/<thead>[\s\S]*?<\/thead>/i);
    const bodyMatch = htmlContent.match(/<tbody>[\s\S]*?<\/tbody>/i);
    
    if (!headerMatch || !bodyMatch) return null;
    
    // Extract headers
    const headerCells = headerMatch[0].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
    const headers = headerCells.map(cell => 
      cell.replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ')
    );
    
    // Extract rows
    const rowMatches = bodyMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const rows = rowMatches.map(row => {
      const cellMatches = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      return cellMatches.map(cell => 
        cell.replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ')
      );
    });
    
    return { headers, rows };
  } catch (error) {
    console.error('Error parsing HTML table:', error);
    return null;
  }
}

function parseImages(content: string): any[] {
  const images: any[] = [];
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>/gi;
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    const alt = match[2] || '';
    
    try {
      // Convert relative path to absolute file system path
      let imagePath = src;
      if (src.startsWith('./')) {
        imagePath = path.join(process.cwd(), 'public', src.replace('./', '/'));
      } else if (src.startsWith('/')) {
        imagePath = path.join(process.cwd(), 'public', src);
      }
      
      // Check if file exists and convert to base64
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = getMimeType(imagePath);
        const base64Src = `data:${mimeType};base64,${base64Image}`;
        
        images.push({ src: base64Src, alt });
      } else {
        console.warn(`Image not found: ${imagePath}`);
        // Add placeholder or skip
        images.push({ src: '', alt: `Image not found: ${src}` });
      }
    } catch (error) {
      console.error(`Error processing image ${src}:`, error);
      images.push({ src: '', alt: `Error loading image: ${src}` });
    }
  }
  
  return images;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    default: return 'image/png';
  }
}

function renderTextContent(content: string): string {
  // Remove img tags for text rendering
  const cleanContent = content.replace(/<img[^>]*\/?>/gi, '');
  
  const lines = cleanContent.split('\n').filter(line => line.trim());
  let htmlContent = '';
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
      htmlContent += `<li>${trimmedLine.substring(1).trim()}</li>`;
    } else {
      htmlContent += `<p>${trimmedLine}</p>`;
    }
  });
  
  // Wrap consecutive list items in ul tags
  htmlContent = htmlContent.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
  
  return htmlContent;
}