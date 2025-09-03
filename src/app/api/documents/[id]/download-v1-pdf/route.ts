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
  const formatFieldName = (fieldName: string) => {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderFieldValue = (fieldData: any) => {
    if (!fieldData || typeof fieldData !== 'object') {
      return '<span style="color: #94a3b8; font-style: italic;">Not provided</span>';
    }

    const value = fieldData.value;
    
    if (!value || value === '') {
      return '<span style="color: #94a3b8; font-style: italic;">Not provided</span>';
    }
    
    if (typeof value === 'string') {
      // Handle different types of line breaks and formatting
      let processedText = value;
      
      // Replace literal \n with actual line breaks
      processedText = processedText.replace(/\\n/g, '\n');
      
      // Split by actual newlines and filter out empty lines
      const lines = processedText.split('\n').filter(line => line.trim() !== '');
      
      let htmlContent = '<div style="line-height: 1.6;">';
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        
        // Check if line starts with bullet point
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          htmlContent += `
            <div style="display: flex; align-items: flex-start; margin-bottom: 8px; margin-left: 16px;">
              <span style="color: #2563eb; font-weight: bold; margin-right: 12px; flex-shrink: 0; margin-top: 2px;">•</span>
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                ${trimmedLine.substring(1).trim()}
              </p>
            </div>
          `;
        }
        // Check if line is a section header (all caps and short)
        else if (trimmedLine === trimmedLine.toUpperCase() && 
                 trimmedLine.length < 100 && 
                 trimmedLine.length > 3 &&
                 !trimmedLine.includes('•') &&
                 /^[A-Z\s&]+$/.test(trimmedLine)) {
          htmlContent += `
            <h4 style="
              font-size: 16px; 
              font-weight: bold; 
              color: #1e293b; 
              margin-top: 32px; 
              margin-bottom: 16px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em;
              page-break-after: avoid;
            ">
              ${trimmedLine}
            </h4>
          `;
        }
        // Check if it's a section header with specific keywords
        else if (trimmedLine.match(/^(Assumptions|Dependencies|Deliverables|Scope|Modules|Features|Security|Key Features|Functionalities)/i)) {
          htmlContent += `
            <h4 style="
              font-size: 16px; 
              font-weight: 600; 
              color: #1f2937; 
              margin-top: 24px; 
              margin-bottom: 12px; 
              border-left: 4px solid #2563eb; 
              padding-left: 12px; 
              background-color: #eff6ff; 
              padding-top: 8px; 
              padding-bottom: 8px;
              page-break-after: avoid;
            ">
              ${trimmedLine}
            </h4>
          `;
        }
        // Check if it's a numbered or lettered list item
        else if (trimmedLine.match(/^[\d\w]\.\s/)) {
          htmlContent += `
            <div style="margin-left: 16px; margin-bottom: 8px;">
              <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 500; line-height: 1.6;">
                ${trimmedLine}
              </p>
            </div>
          `;
        }
        // Regular paragraph
        else {
          htmlContent += `
            <p style="margin-bottom: 12px; color: #374151; font-size: 14px; line-height: 1.6;">
              ${trimmedLine}
            </p>
          `;
        }
      });
      
      htmlContent += '</div>';
      return htmlContent;
    }
    
    return `<span style="color: #374151; font-size: 14px;">${String(value)}</span>`;
  };

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>V1 Document Content</title>
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
        .content-wrapper {
          max-width: 100%;
        }
        .field-section { 
          margin-bottom: 32px; 
          page-break-inside: avoid;
        }
        .field-title { 
          font-size: 18px; 
          font-weight: 600; 
          color: #1f2937; 
          border-bottom: 2px solid #e2e8f0; 
          padding-bottom: 8px; 
          margin-bottom: 16px; 
          page-break-after: avoid;
        }
        .field-content { 
          padding-left: 16px; 
        }
        @media print {
          .field-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="main-title">V1 Document Content</h1>
        <p class="subtitle">Extracted and Formatted Content</p>
      </div>
      <div class="content-wrapper">
  `;

  // Collect all fields from all pages and render them continuously
  Object.entries(v1Data).forEach(([pageKey, pageData]: [string, any]) => {
    pageData.extracted_content?.[0]?.fields?.forEach((fieldGroup: any) => {
      Object.entries(fieldGroup).forEach(([fieldName, fieldData]) => {
        htmlContent += `
          <div class="field-section">
            <h3 class="field-title">${formatFieldName(fieldName)}</h3>
            <div class="field-content">
              ${renderFieldValue(fieldData)}
            </div>
          </div>
        `;
      });
    });
  });

  htmlContent += `
      </div>
    </body>
    </html>
  `;

  return htmlContent;
}