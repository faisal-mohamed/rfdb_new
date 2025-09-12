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
      margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
      printBackground: true,
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

  // Parse the content into sections
  const sections = parseGeneratedData(extractedContent);
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Document Content</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: white; 
          color: #374151;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 20px;
        }
        .main-title {
          font-size: 28px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .subtitle {
          font-size: 16px;
          color: #64748b;
        }
        .section {
          margin-bottom: 32px;
          page-break-inside: avoid;
        }
        .section-header {
          font-size: 20px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
          page-break-after: avoid;
        }
        .section-header.level-1 {
          font-size: 22px;
          color: #1e40af;
        }
        .section-header.level-2 {
          font-size: 18px;
          color: #059669;
        }
        .section-header.level-3 {
          font-size: 16px;
          color: #7c3aed;
        }
        .section-content {
          margin-left: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          page-break-inside: avoid;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .image-container {
          margin: 16px 0;
          text-align: center;
          page-break-inside: avoid;
        }
        .image-container img {
          max-width: 100%;
          height: auto;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }
        p {
          margin-bottom: 12px;
          line-height: 1.6;
        }
        ul, ol {
          margin: 12px 0;
          padding-left: 24px;
        }
        li {
          margin-bottom: 4px;
          line-height: 1.5;
        }
        @media print {
          .section {
            page-break-inside: avoid;
          }
          .image-container {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="main-title">Document Content</h1>
        <p class="subtitle">Extracted and Formatted Content</p>
      </div>
  `;

  // Render each section
  sections.forEach(section => {
    htmlContent += `
      <div class="section">
        <h${section.level} class="section-header level-${section.level}">
          ${section.title}
        </h${section.level}>
        <div class="section-content">
    `;

    // Render images if present
    if (section.images && section.images.length > 0) {
      section.images.forEach(image => {
        if (image.src) {
          htmlContent += `
            <div class="image-container">
              <img src="${image.src}" alt="${image.alt || 'Document image'}" />
            </div>
          `;
        } else {
          htmlContent += `
            <div class="image-container">
              <div style="border: 2px dashed #d1d5db; padding: 20px; text-align: center; color: #6b7280; background-color: #f9fafb;">
                <p>📷 ${image.alt}</p>
              </div>
            </div>
          `;
        }
      });
    }

    // Render table if present
    if (section.type === 'table' && section.tableData) {
      htmlContent += `
        <table>
          <thead>
            <tr>
              ${section.tableData.headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${section.tableData.rows.map(row => 
              `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
      `;
    } else {
      // Render text content
      const textContent = renderTextContent(section.content);
      htmlContent += textContent;
    }

    htmlContent += `
        </div>
      </div>
    `;
  });

  htmlContent += `
    </body>
    </html>
  `;

  return htmlContent;
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