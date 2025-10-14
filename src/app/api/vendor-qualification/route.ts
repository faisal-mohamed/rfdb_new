import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET - List all vendor qualifications with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { organizationName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPersonName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const totalCount = await prisma.vendorQualification.count({ where });

    // Get paginated data
    const qualifications = await prisma.vendorQualification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
        references: true,
        personnel: true,
        _count: {
          select: {
            documents: true
          }
        }
      }
    });

    return NextResponse.json({
      qualifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching vendor qualifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor qualifications' },
      { status: 500 }
    );
  }
}

// POST - Create new vendor qualification (draft)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Extract nested data
    const { directors, references, personnel, documents, ...mainData } = body;

    // Create vendor qualification with related data
    const qualification = await prisma.vendorQualification.create({
      data: {
        ...mainData,
        incorporationDate: new Date(mainData.incorporationDate),
        totalEmployees: parseInt(mainData.totalEmployees) || 0,
        managementTeam: parseInt(mainData.managementTeam) || 0,
        technicalTeam: parseInt(mainData.technicalTeam) || 0,
        nonTechnicalTeam: parseInt(mainData.nonTechnicalTeam) || 0,
        submittedBy: session.user.id,
        status: 'DRAFT',
        directors: {
          create: directors || []
        },
        references: {
          create: references || []
        },
        personnel: {
          create: personnel || []
        },
        documents: {
          create: documents || []
        }
      },
      include: {
        directors: true,
        references: true,
        personnel: true,
        documents: true
      }
    });

    return NextResponse.json({
      message: 'Vendor qualification created successfully',
      qualification
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating vendor qualification:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor qualification' },
      { status: 500 }
    );
  }
}



