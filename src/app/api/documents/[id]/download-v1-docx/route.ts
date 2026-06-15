// V1 Word Document Download API
// Generates Word document with exact PDF styling

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { VersionType } from '@prisma/client';
import { generateV1WordDocument } from '@/lib/docx/generateWordDocumentTemplate3';
import { processTemplate } from '@/lib/docx/processTemplate';
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

    // Get V1 data from database - same as PDF route
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

    // Get document data for template placeholders
    // DocumentVersion.documentId stores the external processId
    // This should match Document.id when documents are created with process_id as the ID
    // But we'll try both the processId and v1Version.documentId to be safe
    let document = await prisma.document.findFirst({
      where: {
        id: processId, // Try processId first (should match if document was created with process_id as ID)
      },
      select: {
        contactName: true,
        designation: true,
        emailAddress: true,
        mobileNumber: true,
        validUntil: true,
        customerName: true,
        uploadedDate: true,
        selectedVendorFields: true,
      } as any, // Type assertion until Prisma Client regenerates
    }) as any;

    // If not found with processId, try with v1Version.documentId (should be the same, but just in case)
    if (!document && v1Version.documentId !== processId) {
      document = await prisma.document.findFirst({
        where: {
          id: v1Version.documentId,
        },
        select: {
          contactName: true,
          designation: true,
          emailAddress: true,
          mobileNumber: true,
          validUntil: true,
          customerName: true,
          uploadedDate: true,
          selectedVendorFields: true,
        } as any, // Type assertion until Prisma Client regenerates
      }) as any;
    }

    // If document still not found, log warning but continue with empty values
    // This allows document generation even if document record is missing
    if (!document) {
      console.warn(`⚠️ Document not found for processId: ${processId}`);
      console.warn(`   DocumentVersion.documentId: ${v1Version.documentId}`);
      console.warn(`   Attempted lookups: Document.id = '${processId}' and Document.id = '${v1Version.documentId}'`);
      console.warn(`   Using default/empty values for template placeholders`);
      console.warn(`   To fix: Ensure Document record exists with id matching the processId`);
    } else {
      console.log(`✅ Document found:`, {
        id: document.customerName ? 'found' : 'missing customerName',
        hasContactInfo: !!(document.contactName && document.emailAddress),
      });
    }

    // Get vendor qualification data if document has selected vendor fields
    // Note: Only one vendor record exists for the entire application - use it for all documents
    let vendorData: any = null;
    let selectedVendorFields: string[] = [];

    const docWithVendorFields = document as any;
    if (docWithVendorFields?.selectedVendorFields && Array.isArray(docWithVendorFields.selectedVendorFields) && docWithVendorFields.selectedVendorFields.length > 0) {
      selectedVendorFields = docWithVendorFields.selectedVendorFields as string[];

      // Fetch the single vendor qualification record (most recent if multiple exist)
      const vendorQualification = await prisma.vendorQualification.findFirst({
        orderBy: { createdAt: 'desc' }, // Get most recent vendor record
        include: {
          directors: true,
          references: {
            orderBy: { serialNumber: 'asc' }
          },
          personnel: true,
          documents: {
            select: {
              id: true,
              documentType: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              uploadedAt: true,
            },
          },
        },
      });

      if (vendorQualification) {
        vendorData = vendorQualification;
        console.log(`✅ Found vendor qualification (global record) with ${selectedVendorFields.length} selected fields`);
      } else {
        console.log(`⚠️ No vendor qualification record found in the system`);
      }
    }

    // Generate Word document body with exact PDF styling, including vendor fields if available
    const bodyBuffer = await generateV1WordDocument(
      v1Version.jsonContent,
      vendorData,
      selectedVendorFields
    );

    // Prepare template paths
    const coverPath = path.join(process.cwd(), 'templates', 'cover-2pages.docx');
    const lastPath = path.join(process.cwd(), 'templates', 'last-page.docx');

    // Ensure templates exist
    if (!fs.existsSync(coverPath)) {
      return NextResponse.json({ error: 'Cover template not found', path: coverPath }, { status: 500 });
    }
    if (!fs.existsSync(lastPath)) {
      return NextResponse.json({ error: 'Last page template not found', path: lastPath }, { status: 500 });
    }

    // Extract proposal/customer metadata from V1 JSON response if available
    // Cover page needs: proposalOn ("Proposal on X") and preparedFor ("Prepared for Y")
    let preparedFor = document?.customerName || '';
    let proposalTheme = '';
    let kpiCustomerName = '';

    try {
      const v1JsonContent = v1Version.jsonContent as any;

      // Try different possible paths for prepared_for/client_name in V1 response
      if (v1JsonContent?.prepared_for) {
        preparedFor = v1JsonContent.prepared_for;
      } else if (v1JsonContent?.client_name) {
        preparedFor = v1JsonContent.client_name;
      } else if (v1JsonContent?.["1"]?.extracted_content?.[0]?.prepared_for) {
        preparedFor = v1JsonContent["1"].extracted_content[0].prepared_for;
      } else if (v1JsonContent?.["1"]?.extracted_content?.[0]?.client_name) {
        preparedFor = v1JsonContent["1"].extracted_content[0].client_name;
      } else if (v1JsonContent?.["1"]?.extracted_content?.[0]?.fields?.[0]?.prepared_for?.value) {
        preparedFor = v1JsonContent["1"].extracted_content[0].fields[0].prepared_for.value;
      } else if (v1JsonContent?.["1"]?.extracted_content?.[0]?.fields?.[0]?.client_name?.value) {
        preparedFor = v1JsonContent["1"].extracted_content[0].fields[0].client_name.value;
      } else if (v1JsonContent?.fields?.find((f: any) => f.prepared_for?.value)) {
        const field = v1JsonContent.fields.find((f: any) => f.prepared_for?.value);
        preparedFor = field.prepared_for.value;
      } else if (v1JsonContent?.fields?.find((f: any) => f.client_name?.value)) {
        const field = v1JsonContent.fields.find((f: any) => f.client_name?.value);
        preparedFor = field.client_name.value;
      }

      // Try to extract KPI block for proposal theme / customer name (used for cover title)
      const kpiField = v1JsonContent?.["1"]?.extracted_content?.[0]?.fields?.find(
        (field: any) => field?.kpi?.value
      );

      if (kpiField?.kpi?.value) {
        const parsedKpi =
          typeof kpiField.kpi.value === 'string'
            ? JSON.parse(kpiField.kpi.value)
            : kpiField.kpi.value;

        proposalTheme = parsedKpi?.proposal_theme || '';
        kpiCustomerName = parsedKpi?.customer_name || '';
      }

      console.log('Extracted preparedFor from V1 response:', preparedFor);
      if (proposalTheme || kpiCustomerName) {
        console.log('Extracted KPI data for cover:', { proposalTheme, kpiCustomerName });
      }
    } catch (error) {
      console.warn('Error extracting cover data from V1 response:', error);
      // Fallback to document.customerName if extraction fails
    }

    // Prepare template data for dynamic content replacement
    // Use document data if available, otherwise use empty strings
    const templateData = {
      contactName: document?.contactName || 'RFP',
      designation: document?.designation || 'Proposal',
      emailAddress: document?.emailAddress || 'aravindh@gmail.com',
      mobileNumber: document?.mobileNumber || '1234567890',
      // Fallback valid-until date if none stored on the document
      validUntil: document?.validUntil || new Date('2026-12-31'),
      customerName: document?.customerName || kpiCustomerName || '',
      preparedFor: preparedFor || kpiCustomerName || document?.customerName || '',
      proposalOn: proposalTheme ? `${proposalTheme}` : '',
      uploadedDate: document?.uploadedDate || new Date(),
      documentId: processId,
    };

    // Process templates with dynamic content using docxtemplater
    console.log('Processing cover template with data:', templateData);
    const coverBuffer = await processTemplate(coverPath, templateData);

    console.log('Processing last page template with data:', templateData);
    const lastBuffer = await processTemplate(lastPath, templateData);

    // Convert to binary strings (required by docx-merger)
    const coverBinary = coverBuffer.toString('binary');
    const lastBinary = lastBuffer.toString('binary');
    const bodyBinary = Buffer.from(bodyBuffer).toString('binary');

    // Import docx-merger (CommonJS module - handle default export)
    // @ts-ignore - docx-merger doesn't have TypeScript definitions
    const DocxMergerModule = await import('docx-merger');
    const DocxMerger = (DocxMergerModule.default || DocxMergerModule) as any;

    // Merge: cover (2 pages) + body + last (1 page)
    // Order: [cover, body, last] - docx-merger concatenates in this order
    const merger = new DocxMerger({ pageBreak: true }, [coverBinary, bodyBinary, lastBinary]);

    const mergedBuffer: Buffer = await new Promise((resolve, reject) => {
      try {
        merger.save('nodebuffer', (buf: Buffer) => resolve(buf));
      } catch (e) {
        reject(e);
      }
    });

    // Return merged Word document as response
    return new NextResponse(new Uint8Array(mergedBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="V1-Document-${processId}.docx"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Error generating Word document:', error);
    return NextResponse.json({
      error: 'Failed to generate Word document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

