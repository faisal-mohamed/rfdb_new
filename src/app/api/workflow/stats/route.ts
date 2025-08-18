import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { WorkflowService } from '@/lib/workflowService';
import { getSimplePermissions } from '@/lib/simplePermissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can view documents (stats are part of viewing)
    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canView) {
      return NextResponse.json({ error: 'You do not have permission to view workflow statistics' }, { status: 403 });
    }

    const stats = await WorkflowService.getWorkflowStats();

    return NextResponse.json({ success: true, data: stats });

  } catch (error) {
    console.error('Workflow stats API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
