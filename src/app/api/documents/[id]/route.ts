import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getSimplePermissions } from '@/lib/simplePermissions';

// GET /api/documents/[id] - Get single document details from external API
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canView) {
      return NextResponse.json({ error: 'You do not have permission to view documents' }, { status: 403 });
    }

    const { id: processId } = await context.params;

    // Call external API to get document details
    const trackingPayload = {
      pagination: "1-10" // Default pagination for single document lookup
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
    
    // Find the specific document by process_id
    const docData = result.status.find((doc: any) => doc.process_id === processId);
    
    if (!docData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Transform the response to match frontend expectations
    const document = {
      id: docData.process_id,
      fileName: docData.filename,
      fileType: docData.filename.split('.').pop()?.toLowerCase() || 'unknown',
      customerName: docData.customer_name,
      status: docData.status,
      workflowStatus: docData.status,
      uploadedDate: docData.start_time,
      verificationStatus: docData.verification_status,
      layoutId: docData.layout_id,
      workflowId: docData.workflow_id,
      fileSize: 1024000, // Mock size since not provided by external API
      uploader: {
        firstName: session.user.firstName || 'System',
        lastName: session.user.lastName || 'User',
        email: session.user.email || 'system@company.com'
      }
    };

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
