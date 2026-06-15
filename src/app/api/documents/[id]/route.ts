import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getSimplePermissions } from '@/lib/simplePermissions';

// GET /api/documents/[id] - Get single document details
// Always fetches from external API (tracking_page) - does not use local database
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

    // Always use external API - don't check local database
    console.log('Searching external API for document:', processId);
    
    let foundDoc = null;
    let currentPage = 1;
    const maxPages = 10; // Limit search to prevent infinite loops

    while (currentPage <= maxPages && !foundDoc) {
      const trackingPayload = {
        page_number: currentPage
      };

      console.log(`Searching external API page ${currentPage} for document:`, processId);

      const response = await fetch(`${process.env.AI_URL}/document_extraction/tracking_page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingPayload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`External API error on page ${currentPage}:`, response.status, errorText);
        break; // Stop searching if API fails
      }

      const result = await response.json();
      const docData = (result.status || []).find((doc: any) => doc.process_id === processId);
      
      if (docData) {
        foundDoc = docData;
        console.log(`Document found in external API on page ${currentPage}`);
        break;
      }

      // Check if there are more pages to search
      const totalRecords = result.total_records || 0;
      const recordsPerPage = result.status?.length || 0;
      const totalPages = recordsPerPage > 0 ? Math.ceil(totalRecords / recordsPerPage) : 1;

      if (currentPage >= totalPages || recordsPerPage === 0) {
        console.log('Reached end of external API results');
        break;
      }

      currentPage++;
    }

    if (!foundDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Transform the external API response to match frontend expectations
    const document = {
      id: foundDoc.process_id,
      fileName: foundDoc.filename || `${foundDoc.process_id}.pdf`,
      fileType: foundDoc.filename ? foundDoc.filename.split('.').pop()?.toLowerCase() || 'unknown' : 'pdf',
      customerName: foundDoc.customer_name || '',
      status: foundDoc.status || 'ACTIVE',
      workflowStatus: foundDoc.status || 'ACTIVE',
      uploadedDate: foundDoc.start_time || new Date().toISOString(),
      verificationStatus: foundDoc.verification_status || null,
      layoutId: foundDoc.layout_id || null,
      workflowId: foundDoc.workflow_id || null,
      fileSize: foundDoc.file_size || 1024000,
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
