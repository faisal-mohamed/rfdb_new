import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { VersionType, VersionStatus } from '@prisma/client';
import { getSimplePermissions } from '@/lib/simplePermissions';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canProcess) {
      return NextResponse.json(
        { error: 'You do not have permission to verify V1' },
        { status: 403 }
      );
    }

    // Get V1 data from database
    const v1Version: any = await prisma.documentVersion.findFirst({
      where: {
        documentId: processId,
        versionType: VersionType.VERSION_1,
      },
      orderBy: { versionNumber: 'desc' },
    });

    if (!v1Version) {
      return NextResponse.json(
        { error: 'V1 not found' },
        { status: 404 }
      );
    }

    // Extract content for verification
    const firstPageKey = Object.keys(v1Version.jsonContent ?? {})[0];
    let extractedContent = v1Version.jsonContent?.[firstPageKey]?.extracted_content ?? {};

    if (Array.isArray(extractedContent)) {
      extractedContent = extractedContent[0] ?? {};
    }

    // Build payload for verification API
    const payload = {
      process_id: processId,
      page_no: '1',
      collection_name: 'fielditem_content',
      verification_component: 'EV',
      content: JSON.stringify(extractedContent),
    };

    // Call external verification API
    const response = await fetch(
      `${process.env.AI_URL}/document_extraction/verification_save`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Verification API Error:', errorText);
      return NextResponse.json(
        {
          error: `External API error: ${response.status}`,
          details: errorText,
        },
        { status: 500 }
      );
    }

    const verificationResult = await response.json();
    console.log('Verification result:', verificationResult);

    // Update V1 status to APPROVED
    await prisma.documentVersion.updateMany({
      where: {
        documentId: processId,
        versionType: VersionType.VERSION_1,
      },
      data: {
        status: VersionStatus.APPROVED,
        editedBy: session.user.id,
        editedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'V1 verified successfully',
      result: verificationResult,
    });
  } catch (error) {
    console.error('Error verifying V1:', error);
    return NextResponse.json(
      { error: 'Failed to verify V1' },
      { status: 500 }
    );
  }
}
