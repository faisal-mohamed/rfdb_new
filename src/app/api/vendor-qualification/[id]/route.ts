import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { 
  canViewAllVendorQualifications, 
  canViewVendorQualifications,
  canEditVendorQualification,
  canDeleteVendorQualification,
  UserRole 
} from '@/lib/vendorPermissions';

// GET - Fetch single vendor qualification (role-based access)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can view vendor qualifications
    if (!canViewVendorQualifications(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'You do not have permission to view vendor qualifications' },
        { status: 403 }
      );
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

    // Role-based access: Users can only view their own unless ADMIN/APPROVER
    const canViewAll = canViewAllVendorQualifications(session.user.role as UserRole);
    if (!canViewAll && qualification.submittedBy !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this vendor qualification' },
        { status: 403 }
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

// PUT - Update vendor qualification (role-based)
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

    // Check edit permissions using RBAC
    if (!canEditVendorQualification(
      session.user.role as UserRole,
      existing.submittedBy,
      session.user.id,
      existing.status as any
    )) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this vendor qualification. Only DRAFT status can be edited, and only by the owner or ADMIN.' },
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

// DELETE - Delete vendor qualification (role-based)
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

    // Check delete permissions using RBAC
    if (!canDeleteVendorQualification(
      session.user.role as UserRole,
      existing.submittedBy,
      session.user.id,
      existing.status as any
    )) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this vendor qualification. Only ADMIN can delete submitted qualifications, or owners can delete their own DRAFT.' },
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



