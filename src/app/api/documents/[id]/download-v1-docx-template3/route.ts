// V1 Word Document Download API - Template 3
// Generates Word document with cover pages (2 pages) + body content in single document

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { VersionType } from '@prisma/client';
import { generateV1WordDocumentWithCover } from '@/lib/docx/generateWordDocumentTemplate3';

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

    // Get document for contact info and selected vendor fields
    const document = await prisma.document.findFirst({
      where: { id: processId },
      select: {
        contactName: true,
        designation: true,
        emailAddress: true,
        mobileNumber: true,
        validUntil: true,
        customerName: true,
        uploadedDate: true,
        selectedVendorFields: true,
      } as any,
    }) as any;

    // Extract proposal/customer metadata from V1 JSON response
    let preparedFor = document?.customerName || '';
    let proposalTheme = '';
    let kpiCustomerName = '';

    try {
      const v1JsonContent = v1Version.jsonContent as any;

      // Try different possible paths for prepared_for/client_name
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
      }

      // Extract KPI block for proposal theme
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

      console.log('Extracted for Template 3 cover:', { preparedFor, proposalTheme, kpiCustomerName });
    } catch (error) {
      console.warn('Error extracting cover data from V1 response:', error);
    }

    // Get vendor qualification data if document has selected vendor fields
    let vendorData: any = null;
    let selectedVendorFields: string[] = [];
    
    if (document?.selectedVendorFields && Array.isArray(document.selectedVendorFields) && document.selectedVendorFields.length > 0) {
      selectedVendorFields = document.selectedVendorFields as string[];
      
      const vendorQualification = await prisma.vendorQualification.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          directors: true,
          references: { orderBy: { serialNumber: 'asc' } },
          personnel: true,
          documents: {
            select: {
              id: true,
              documentType: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              uploadedAt: true,
              fileContent: true,
            },
          },
        },
      });
      
      if (vendorQualification) {
        vendorData = vendorQualification;
        console.log(`✅ Found vendor qualification with ${selectedVendorFields.length} selected fields for Template 3`);
      }
    }

    // Cover page data
    const coverData = {
      proposalOn: proposalTheme || `Implementation of Smart Branch Solutions for ${kpiCustomerName || document?.customerName || 'Customer'}`,
      preparedFor: preparedFor || kpiCustomerName || document?.customerName || '',
      contactName: document?.contactName || 'Contact Name',
      designation: document?.designation || 'Designation',
      emailAddress: document?.emailAddress || 'email@example.com',
      mobileNumber: document?.mobileNumber || '+91 0000000000',
      submittedOn: document?.uploadedDate || new Date(),
      validUntil: document?.validUntil || new Date('2026-12-31'),
    };

    // Generate complete Word document (cover + body) in single document
    console.log('Generating Template 3 document with cover...');
    const buffer = await generateV1WordDocumentWithCover(
      v1Version.jsonContent,
      coverData,
      vendorData,
      selectedVendorFields
    );

    // Return document
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="V1-Document-Template3-${processId}.docx"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Error generating Word document (Template 3):', error);
    return NextResponse.json({ 
      error: 'Failed to generate Word document (Template 3)',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
