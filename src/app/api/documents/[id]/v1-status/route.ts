import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { VersionType } from '@prisma/client';

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
      return NextResponse.json(
        { error: 'You do not have permission to view documents' },
        { status: 403 }
      );
    }

    // Get V1 version status from database
    const v1Version = await prisma.documentVersion.findFirst({
      where: {
        documentId: processId,
        versionType: VersionType.VERSION_1,
      },
      orderBy: { versionNumber: 'desc' },
      select: {
        status: true,
        editedAt: true,
        editedBy: true,
      },
    });

    if (!v1Version) {
      return NextResponse.json({ error: 'V1 not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: v1Version.status,
      editedAt: v1Version.editedAt,
      editedBy: v1Version.editedBy,
    });
  } catch (error) {
    console.error('Error fetching V1 status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
