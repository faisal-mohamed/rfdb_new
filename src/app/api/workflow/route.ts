import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { WorkflowService } from '@/lib/workflowService';
import { getSimplePermissions } from '@/lib/simplePermissions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Full session object:", JSON.stringify(session, null, 2));
    console.log("Session user:", session?.user);
    console.log("Session user id:", session?.user?.id);
    console.log("Session user role:", session?.user?.role);
    
    if (!session?.user?.id) {
      console.log("No session or user ID found");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, documentId, versionId, jsonContent } = body;
    const userId = session.user.id;
    const userRole = session.user.role;

    // Get simple permissions
    const permissions = getSimplePermissions(userRole);

    let result;

    switch (action) {
      case 'process_v1':
      case 'process_v2':
        if (!permissions.canProcess) {
          return NextResponse.json({ error: 'You do not have permission to process documents' }, { status: 403 });
        }
        if (action === 'process_v1') {
          result = await WorkflowService.processToV1(documentId, userId);
        } else {
          result = await WorkflowService.processToV2(documentId, userId);
        }
        break;

      case 'start_edit_v1':
      case 'save_v1':
      case 'complete_v1':
      case 'start_edit_v2':
      case 'save_v2':
      case 'complete_v2':
        if (!permissions.canEdit) {
          return NextResponse.json({ error: 'You do not have permission to edit documents' }, { status: 403 });
        }
        
        // Execute the appropriate action
        switch (action) {
          case 'start_edit_v1':
            result = await WorkflowService.startEditingV1(documentId, versionId, userId);
            break;
          case 'save_v1':
            result = await WorkflowService.saveV1Edits(versionId, jsonContent, userId);
            break;
          case 'complete_v1':
            result = await WorkflowService.completeV1Editing(documentId, versionId, userId);
            break;
          case 'start_edit_v2':
            result = await WorkflowService.startEditingV2(documentId, versionId, userId);
            break;
          case 'save_v2':
            result = await WorkflowService.saveV2Edits(versionId, jsonContent, userId);
            break;
          case 'complete_v2':
            result = await WorkflowService.completeV2Editing(documentId, versionId, userId);
            break;
        }
        break;

      case 'approve':
        if (!permissions.canApprove) {
          return NextResponse.json({ error: 'You do not have permission to approve documents' }, { status: 403 });
        }
        result = await WorkflowService.approveDocument(documentId, versionId, userId);
        break;

      case 'generate_document':
        if (!permissions.canGenerate) {
          return NextResponse.json({ error: 'You do not have permission to generate documents' }, { status: 403 });
        }
        result = await WorkflowService.generateWordDocument(documentId, versionId, userId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Check if user can view documents
    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canView) {
      return NextResponse.json({ error: 'You do not have permission to view documents' }, { status: 403 });
    }

    const document = await WorkflowService.getDocumentWithVersions(documentId);
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: document });

  } catch (error) {
    console.error('Workflow GET API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
