import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getSimplePermissions } from '@/lib/simplePermissions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canEdit) {
      return NextResponse.json({ error: 'You do not have permission to save documents' }, { status: 403 });
    }

    const processId = params.id;
    const body = await request.json();
    const { extracted_content } = body;

    if (!extracted_content) {
      return NextResponse.json({ error: 'Missing extracted_content' }, { status: 400 });
    }

    // Just save V1 content without generating V2
    // You can store this in your database or call a different API endpoint
    // For now, we'll just return success
    
    console.log('Saving V1 content for process:', processId);
    console.log('Content:', extracted_content);
    
    return NextResponse.json({
      message: 'V1 content saved successfully',
      processId
    });
  } catch (error) {
    console.error('Error saving V1 content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
