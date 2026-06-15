// V1 Word Document Download API - Template 2
// Generates Word document body content only (no cover or last page)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { VersionType } from '@prisma/client';
import { generateV1WordDocument } from '@/lib/docx/generateWordDocumentTemplate2';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canView) {
      return NextResponse.json({ error: 'You do not have permission to download documents' }, { status: 403 });
    }

    // Get V1 data from database - same as template 1 route
    const v1Version = await prisma.documentVersion.findFirst({
      where: {
        documentId: processId,
        versionType: VersionType.VERSION_1,
        status: 'APPROVED',
      },
      orderBy: { versionNumber: 'desc' },
    });

    if (!v1Version) {
      return NextResponse.json({ error: 'Approved V1 not found' }, { status: 404 });
    }

    // Generate Word document body with exact PDF styling
    const bodyBuffer = await generateV1WordDocument(v1Version.jsonContent);

    // Return body content only (no cover or last page)
    return new NextResponse(new Uint8Array(bodyBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="V1-Document-Template2-${processId}.docx"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Error generating Word document (Template 2):', error);
    return NextResponse.json({ 
      error: 'Failed to generate Word document (Template 2)',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


