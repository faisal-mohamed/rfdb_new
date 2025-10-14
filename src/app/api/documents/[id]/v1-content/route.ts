import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { VersionType, VersionStatus, WorkflowStatus } from '@prisma/client';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the async params object before accessing properties
    const { id: processId } = await params;

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

    // Get V1 from database using processId
    const v1Version = await prisma.documentVersion.findFirst({
      where: {
        documentId: processId,
        versionType: VersionType.VERSION_1,
      },
      orderBy: { versionNumber: 'desc' },
    });

    console.log("v1version: ", v1Version)

    if (!v1Version) {
      return NextResponse.json({ error: 'V1 not found' }, { status: 404 });
    }

    return NextResponse.json(v1Version.jsonContent);
  } catch (error) {
    console.error('Error loading V1 content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


// PUT - Save V1 changes to database
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canEdit) {
      return NextResponse.json({ error: 'You do not have permission to edit documents' }, { status: 403 });
    }

    const { id: processId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    // Update existing V1 version directly
    const updatedVersion = await prisma.documentVersion.updateMany({
      where: {
        documentId: processId,
        versionType: VersionType.VERSION_1
      },
      data: {
        jsonContent: content,
        editedBy: session.user.id,
        editedAt: new Date(),
        status: VersionStatus.EDITING,
      }
    });

    if (updatedVersion.count === 0) {
      return NextResponse.json({ error: 'V1 not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'V1 content updated successfully'
    });

  } catch (error) {
    console.error('Error saving V1 content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
