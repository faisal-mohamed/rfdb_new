import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { WorkflowStatus } from '@prisma/client';

// Helper function to sort documents
function sortDocuments(documents: any[], sortBy: string, sortOrder: string): any[] {
  return [...documents].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    // Map sortBy to actual document property
    switch (sortBy) {
      case 'fileName':
        aValue = (a.fileName || '').toLowerCase();
        bValue = (b.fileName || '').toLowerCase();
        break;
      case 'customerName':
        aValue = (a.customerName || '').toLowerCase();
        bValue = (b.customerName || '').toLowerCase();
        break;
      case 'uploadedDate':
      case 'createdAt':
        aValue = new Date(a.uploadedDate || 0).getTime();
        bValue = new Date(b.uploadedDate || 0).getTime();
        break;
      case 'status':
      case 'workflowStatus':
        aValue = (a.workflowStatus || '').toLowerCase();
        bValue = (b.workflowStatus || '').toLowerCase();
        break;
      case 'fileType':
        aValue = (a.fileType || '').toLowerCase();
        bValue = (b.fileType || '').toLowerCase();
        break;
      default:
        // Default to uploadedDate
        aValue = new Date(a.uploadedDate || 0).getTime();
        bValue = new Date(b.uploadedDate || 0).getTime();
    }

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Perform comparison
    let comparison = 0;
    if (aValue < bValue) {
      comparison = -1;
    } else if (aValue > bValue) {
      comparison = 1;
    }

    // Reverse order if descending
    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

// GET /api/documents - List documents with filtering and pagination
export async function GET(request: NextRequest) {
  console.log("request: ", request);
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canView) {
      return NextResponse.json({ error: 'You do not have permission to view documents' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'uploadedDate'; // Default sort field
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // Default sort order
    console.log("page: ", page, "limit: ", limit, "sortBy: ", sortBy, "sortOrder: ", sortOrder);

    // Call external tracking API with correct payload format
    const trackingPayload = {
      page_number: page  // External API expects page_number as a number
    };

    console.log('Calling external API:', `${process.env.AI_URL}/document_extraction/tracking_page`);
    console.log('Payload:', JSON.stringify(trackingPayload, null, 2));

    const response = await fetch(`${process.env.AI_URL}/document_extraction/tracking_page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingPayload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('External API error:', response.status, errorText);
      throw new Error(`External API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('External API response:', JSON.stringify(result, null, 2));
    
    // Transform the response to match frontend expectations
    // Note: External API returns { status: [...] } with document objects
    let documents = (result.status || []).map((doc: any) => ({
      id: doc.process_id,
      fileName: doc.filename || 'Unknown',
      fileType: doc.filename ? doc.filename.split('.').pop()?.toLowerCase() || 'unknown' : 'unknown',
      customerName: doc.customer_name || '',
      status: doc.status || 'ACTIVE',
      workflowStatus: doc.status || 'ACTIVE',
      uploadedDate: doc.start_time || new Date().toISOString(),
      verificationStatus: doc.verification_status || null,
      layoutId: doc.layout_id || null,
      workflowId: doc.workflow_id || null,
      uploader: {
        firstName: 'System',
        lastName: 'User',
        email: 'system@company.com'
      }
    }));

    // Apply sorting
    documents = sortDocuments(documents, sortBy, sortOrder);

    // Calculate pagination - if total_records not provided, estimate based on current results
    const totalRecords = result.total_records || documents.length;
    const totalPages = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        totalCount: totalRecords,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/documents - Upload new document
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to upload documents' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      fileName, 
      fileContent, 
      customerName,
      contactName,
      designation,
      emailAddress,
      mobileNumber,
      validUntil,
      layoutId,
      selectedVendorFields
    } = body;

    if (!fileName || !fileContent || !customerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate required contact fields
    if (!contactName || !contactName.trim()) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 });
    }

    if (!designation || !designation.trim()) {
      return NextResponse.json({ error: 'Designation is required' }, { status: 400 });
    }

    if (!emailAddress || !emailAddress.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    if (!mobileNumber || !mobileNumber.trim()) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    if (!validUntil || !validUntil.trim()) {
      return NextResponse.json({ error: 'Valid until date is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress.trim())) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    // Build upload payload - use layoutId from request, default to "RFP"
    const uploadPayload = {
      file: `${fileContent}`,
      layout_id: layoutId || "RFP",
      file_name: fileName,
      uploader: session.user.firstName || session.user.email || "user",
    };

    // ✅ Write payload to a new file BEFORE sending it to API
    const logsDir = path.join(process.cwd(), "upload_payloads"); 
    await fs.mkdir(logsDir, { recursive: true }); // ensure dir exists

    const payloadFile = path.join(
      logsDir,
      `${Date.now()}-${fileName.replace(/\s+/g, "_")}.json`
    );

    await fs.writeFile(payloadFile, JSON.stringify(uploadPayload, null, 2), "utf-8");
    console.log("Payload written to file:", payloadFile);

    // Now call external API
    const response = await fetch(
      `${process.env.AI_URL}/document_extraction/manual_upload_rfp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('External API error:', response.status, errorText);
      throw new Error(`External API error: ${response.status} - ${errorText}`);
    }

    const uploadResult = await response.json();
    console.log('External API response from manual_upload_rfp:', JSON.stringify(uploadResult, null, 2));
    console.log('uploadResult.process_id:', uploadResult.process_id);
    console.log('uploadResult.id:', uploadResult.id);

    // Parse validUntil date (required)
    const parsedValidUntil = new Date(validUntil);
    if (isNaN(parsedValidUntil.getTime())) {
      return NextResponse.json({ error: 'Invalid valid until date format' }, { status: 400 });
    }

    // Since manual_upload_rfp doesn't return process_id, we need to poll tracking_page to find it
    // Try to find the process_id by searching for the filename in tracking_page
    let processId: string | null = uploadResult.process_id || uploadResult.id || null;
    
    if (!processId) {
      console.log('process_id not in response, searching tracking_page for filename:', fileName);
      // Poll tracking_page API to find the newly uploaded document
      // The external API processes asynchronously, so we need to wait a bit
      const maxAttempts = 10; // Try up to 10 times
      const pollDelay = 1500; // 1.5 seconds between attempts (allow time for processing)
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const trackingResponse = await fetch(`${process.env.AI_URL}/document_extraction/tracking_page`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page_number: 1 }),
          });
          
          if (trackingResponse.ok) {
            const trackingResult = await trackingResponse.json();
            // Find document by matching filename (exact or partial match)
            const docData = (trackingResult.status || []).find((doc: any) => 
              doc.filename === fileName || 
              doc.filename?.toLowerCase() === fileName.toLowerCase() ||
              (doc.filename && fileName && doc.filename.includes(fileName.split('.')[0]))
            );
            
            if (docData?.process_id) {
              processId = docData.process_id;
              console.log(`Found process_id from tracking_page (attempt ${attempt + 1}):`, processId);
              break;
            }
          }
          
          // Wait before next attempt (except on last attempt)
          if (attempt < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, pollDelay));
          }
        } catch (pollError) {
          console.error(`Error polling tracking_page (attempt ${attempt + 1}):`, pollError);
        }
      }
    }

    // If we still don't have a process_id after polling, we cannot create the document properly
    // because Document.id must match the process_id for DocumentVersion.documentId to work
    if (!processId) {
      console.error('Could not find process_id after polling. Document creation may fail or mismatch will occur.');
      // We'll still create the document, but it will have a cuid ID that won't match future DocumentVersion records
      // This is a limitation - the external API should ideally return process_id immediately
    }

    // Save document to DB
    // IMPORTANT: We MUST use process_id as the ID to maintain consistency with DocumentVersion.documentId
    const document = await prisma.document.create({
      data: {
        id: processId || undefined, // Use process_id if available, otherwise Prisma generates cuid (not ideal)
        fileName,
        fileType: fileName.split(".").pop()?.toLowerCase() || "unknown",
        mimeType: "application/pdf",
        fileSize: Buffer.from(fileContent, "base64").length,
        fileContent,
        customerName,
        uploadedDate: new Date(),
        uploadedBy: session.user.id,
        workflowStatus: WorkflowStatus.UPLOADED,
        contactName: contactName.trim(),
        designation: designation.trim(),
        emailAddress: emailAddress.trim(),
        mobileNumber: mobileNumber.trim(),
        validUntil: parsedValidUntil,
        selectedVendorFields: selectedVendorFields && Array.isArray(selectedVendorFields) ? selectedVendorFields : [],
      } as any, // Type assertion until Prisma Client regenerates
    });

    // Verify document was created correctly
    // If processId was found, document.id should equal processId
    // If processId is null, document.id will be a cuid and we'll have a mismatch issue
    if (!processId) {
      console.warn(`WARNING: Document created with cuid ID ${document.id} but process_id was not found. DocumentVersion records will not link correctly.`);
    } else if (document.id !== processId) {
      console.error(`ERROR: Document ID mismatch! Expected ${processId} but got ${document.id}`);
    }

    // Kick off V1 generation using document.id
    // Note: This should be process_id if polling succeeded, otherwise it's a cuid which won't work with external API
    const idForV1Generation = document.id;
    try {
      const v1Response = await fetch(
        `${request.nextUrl.origin}/api/documents/${idForV1Generation}/generate-v1`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );

      if (!v1Response.ok) {
        console.error("Failed to auto-generate V1");
      }
    } catch (v1Error) {
      console.error("Error auto-generating V1:", v1Error);
    }

    return NextResponse.json({
      message: "Request is being processed in the background",
      document: {
        id: document.id,
        fileName: document.fileName,
        customerName: document.customerName,
        workflowStatus: document.workflowStatus,
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

