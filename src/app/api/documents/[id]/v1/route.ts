import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getSimplePermissions } from '@/lib/simplePermissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: processId } = await params;

    // Call external API to get V1 data
    const payload = {
      process_id: processId,
      collection_name: "fielditem_content",
      page_no: "1"
    };

    console.log('Calling API with payload:', payload);

    const response = await fetch(`${process.env.AI_URL}/document_extraction/select_projection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      return NextResponse.json({ 
        error: `External API error: ${response.status}`,
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('API Success response:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching V1 data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
