import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { WorkflowStatus } from '@prisma/client';

// GET /api/documents - List documents with filtering and pagination
export async function GET(request: NextRequest) {
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

    // Call external tracking API
    const trackingPayload = {
      pagination: `${page}-${limit}`
    };

    const response = await fetch(`${process.env.AI_URL}/document_extraction/tracking_page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingPayload),
    });

    

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Transform the response to match frontend expectations
    const documents = result.status.map((doc: any) => ({
      id: doc.process_id,
      fileName: doc.filename,
      fileType: doc.filename.split('.').pop()?.toLowerCase() || 'unknown',
      customerName: doc.customer_name,
      status: doc.status,
      workflowStatus: doc.status,
      uploadedDate: doc.start_time,
      verificationStatus: doc.verification_status,
      layoutId: doc.layout_id,
      workflowId: doc.workflow_id,
      uploader: {
        firstName: 'System',
        lastName: 'User',
        email: 'system@company.com'
      }
    }));

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        totalCount: result.total_records,
        totalPages: Math.ceil(result.total_records / limit),
        hasNext: page * limit < result.total_records,
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
    const { fileName, fileContent, customerName } = body;

    if (!fileName || !fileContent || !customerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Build upload payload
    const uploadPayload = {
      file: `${fileContent}`,
      layout_id: "RFP",
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
      `${process.env.AI_URL}/document_extraction/manual_upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadPayload),
      }
    );

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const uploadResult = await response.json();

    // Save document to DB
    const document = await prisma.document.create({
  data: {
    id: uploadResult.process_id || uploadResult.id,
    fileName,
    fileType: fileName.split(".").pop()?.toLowerCase() || "unknown",
    mimeType: "application/pdf", // 👈 FIXED
    fileSize: Buffer.from(fileContent, "base64").length,
    fileContent,
    customerName,
    uploadedDate: new Date(),
    uploadedBy: session.user.id,
    workflowStatus: WorkflowStatus.UPLOADED,
  },
});


    // Kick off V1 generation
    try {
      const v1Response = await fetch(
        `${request.nextUrl.origin}/api/documents/${document.id}/generate-v1`,
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

