import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canSubmitVendorQualification, UserRole } from '@/lib/vendorPermissions';

// POST - Submit vendor qualification for review (role-based)
export async function POST(
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

    // Check submit permissions using RBAC
    if (!canSubmitVendorQualification(
      session.user.role as UserRole,
      existing.submittedBy,
      session.user.id,
      existing.status as any
    )) {
      return NextResponse.json(
        { error: 'You do not have permission to submit this qualification. Only the owner or ADMIN can submit DRAFT qualifications.' },
        { status: 403 }
      );
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Qualification already submitted' },
        { status: 400 }
      );
    }

    // Validate required data
    const validationErrors: string[] = [];

    if (!existing.organizationName || existing.organizationName.trim() === '') {
      validationErrors.push('Organization name is required');
    }
    if (!existing.incorporationDate) {
      validationErrors.push('Incorporation date is required (Step 1: General Information)');
    }
    if (!existing.email || existing.email.trim() === '') {
      validationErrors.push('Email is required');
    }
    if (!existing.telephone || existing.telephone.trim() === '') {
      validationErrors.push('Telephone is required');
    }
    if (existing.directors.length === 0) {
      validationErrors.push('At least one director is required (Step 2: Banking & Directors)');
    }
    if (existing.references.length === 0) {
      validationErrors.push('At least one reference is required (Step 3: References)');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Update status to SUBMITTED
    const qualification = await prisma.vendorQualification.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
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

    return NextResponse.json({
      message: 'Vendor qualification submitted successfully',
      qualification
    });

  } catch (error) {
    console.error('Error submitting vendor qualification:', error);
    return NextResponse.json(
      { error: 'Failed to submit vendor qualification' },
      { status: 500 }
    );
  }
}



