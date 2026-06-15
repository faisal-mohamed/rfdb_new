import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canReviewVendorQualification, canApproveVendorQualification, UserRole } from '@/lib/vendorPermissions';

// POST - Review/Approve/Reject vendor qualification (APPROVER/ADMIN only)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can review/approve qualifications
    if (!canReviewVendorQualification(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'You do not have permission to review vendor qualifications. Only APPROVER and ADMIN roles can review.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { action, comment } = body; // action: 'review' | 'approve' | 'reject'

    // Validate action
    if (!action || !['review', 'approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "review", "approve", or "reject"' },
        { status: 400 }
      );
    }

    // Check if qualification exists
    const existing = await prisma.vendorQualification.findUnique({
      where: { id },
      include: {
        directors: true,
        references: true,
        personnel: true,
        documents: true
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Vendor qualification not found' },
        { status: 404 }
      );
    }

    // Validate status transitions
    let newStatus: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
    let updateData: any = {
      reviewedBy: session.user.id,
      reviewedAt: new Date()
    };

    switch (action) {
      case 'review':
        // Move from SUBMITTED to UNDER_REVIEW
        if (existing.status !== 'SUBMITTED') {
          return NextResponse.json(
            { error: `Cannot move to review. Qualification must be in SUBMITTED status. Current status: ${existing.status}` },
            { status: 400 }
          );
        }
        newStatus = 'UNDER_REVIEW';
        break;

      case 'approve':
        // Move from UNDER_REVIEW to APPROVED
        if (existing.status !== 'UNDER_REVIEW') {
          return NextResponse.json(
            { error: `Cannot approve. Qualification must be in UNDER_REVIEW status. Current status: ${existing.status}` },
            { status: 400 }
          );
        }
        // Check if user can approve (APPROVER/ADMIN)
        if (!canApproveVendorQualification(session.user.role as UserRole)) {
          return NextResponse.json(
            { error: 'You do not have permission to approve vendor qualifications' },
            { status: 403 }
          );
        }
        newStatus = 'APPROVED';
        break;

      case 'reject':
        // Move from UNDER_REVIEW to REJECTED
        if (existing.status !== 'UNDER_REVIEW') {
          return NextResponse.json(
            { error: `Cannot reject. Qualification must be in UNDER_REVIEW status. Current status: ${existing.status}` },
            { status: 400 }
          );
        }
        // Check if user can approve/reject (APPROVER/ADMIN)
        if (!canApproveVendorQualification(session.user.role as UserRole)) {
          return NextResponse.json(
            { error: 'You do not have permission to reject vendor qualifications' },
            { status: 403 }
          );
        }
        newStatus = 'REJECTED';
        if (comment) {
          // Store rejection comment (you may want to add a comment field to the schema)
          updateData.comment = comment;
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update qualification status
    const qualification = await prisma.vendorQualification.update({
      where: { id },
      data: {
        status: newStatus,
        ...updateData
      },
      include: {
        directors: true,
        references: true,
        personnel: true,
        documents: true,
        submitter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const actionMessages = {
      review: 'Vendor qualification moved to review successfully',
      approve: 'Vendor qualification approved successfully',
      reject: 'Vendor qualification rejected successfully'
    };

    return NextResponse.json({
      message: actionMessages[action as keyof typeof actionMessages],
      qualification
    });

  } catch (error) {
    console.error('Error reviewing vendor qualification:', error);
    return NextResponse.json(
      { error: 'Failed to process review action' },
      { status: 500 }
    );
  }
}

