import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { generateKnowledgeBaseTemplate } from '@/lib/docx/generateKnowledgeBaseTemplate';

// GET /api/knowledge-base/template - Download Knowledge Base template
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canView) {
      return NextResponse.json(
        { error: 'You do not have permission to download templates' },
        { status: 403 }
      );
    }

    // Get category name from query parameter
    const { searchParams } = new URL(request.url);
    const categoryName = searchParams.get('category') || undefined;

    // Generate the template with category name
    const buffer = await generateKnowledgeBaseTemplate(categoryName || undefined);

    // Return the file as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Knowledge_Base_Template.docx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating knowledge base template:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

