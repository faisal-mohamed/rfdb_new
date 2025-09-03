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

    // Call external API to save V2 data
    const payload = {
      process_id: processId,
      page_no: "1",
      collection_name: "fielditem_content",
      verification_component: "EV",
      extracted_content
    };

    const response = await fetch(`${process.env.AI_URL}/document_extraction/verification_save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      message: 'V2 data saved successfully',
      result
    });
  } catch (error) {
    console.error('Error saving V2 data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
