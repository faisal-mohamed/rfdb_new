import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET - Fetch single vendor qualification
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const qualification = await prisma.vendorQualification.findUnique({
      where: { id },
      include: {
        submitter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        directors: true,
        references: {
          orderBy: { serialNumber: 'asc' }
        },
        personnel: true,
        documents: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true
            // Exclude fileContent for listing
          }
        }
      }
    });

    if (!qualification) {
      return NextResponse.json(
        { error: 'Vendor qualification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(qualification);

  } catch (error) {
    console.error('Error fetching vendor qualification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor qualification' },
      { status: 500 }
    );
  }
}

// PUT - Update vendor qualification
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Extract nested data
    const { directors, references, personnel, documents, ...mainData } = body;

    // Check if qualification exists and user has permission
    const existing = await prisma.vendorQualification.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Vendor qualification not found' },
        { status: 404 }
      );
    }

    // Only allow editing if it's a draft or the user is the submitter
    if (existing.status !== 'DRAFT' && existing.submittedBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Cannot edit submitted qualification' },
        { status: 403 }
      );
    }

    // Update qualification with cascading updates
    const qualification = await prisma.vendorQualification.update({
      where: { id },
      data: {
        ...mainData,
        incorporationDate: mainData.incorporationDate ? new Date(mainData.incorporationDate) : undefined,
        totalEmployees: mainData.totalEmployees ? parseInt(mainData.totalEmployees) : undefined,
        managementTeam: mainData.managementTeam ? parseInt(mainData.managementTeam) : undefined,
        technicalTeam: mainData.technicalTeam ? parseInt(mainData.technicalTeam) : undefined,
        nonTechnicalTeam: mainData.nonTechnicalTeam ? parseInt(mainData.nonTechnicalTeam) : undefined,
        // Update nested data if provided
        ...(directors && {
          directors: {
            deleteMany: {},
            create: directors
          }
        }),
        ...(references && {
          references: {
            deleteMany: {},
            create: references
          }
        }),
        ...(personnel && {
          personnel: {
            deleteMany: {},
            create: personnel
          }
        })
      },
      include: {
        directors: true,
        references: true,
        personnel: true,
        documents: true
      }
    });

    return NextResponse.json({
      message: 'Vendor qualification updated successfully',
      qualification
    });

  } catch (error) {
    console.error('Error updating vendor qualification:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor qualification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete vendor qualification
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if qualification exists and user has permission
    const existing = await prisma.vendorQualification.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Vendor qualification not found' },
        { status: 404 }
      );
    }

    // Only allow deletion if it's a draft and user is the submitter or admin
    const isAdmin = session.user.userType === 'ADMIN';
    if (existing.status !== 'DRAFT' && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete submitted qualification' },
        { status: 403 }
      );
    }

    // Delete qualification (cascades to related data)
    await prisma.vendorQualification.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Vendor qualification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vendor qualification:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor qualification' },
      { status: 500 }
    );
  }
}



