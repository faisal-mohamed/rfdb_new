import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET /api/documents - List documents with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view documents (ADMIN or EDITOR)
    const userRole = session.user.role;
    if (!['ADMIN', 'EDITOR'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const fileType = searchParams.get('fileType') || '';
    const customerName = searchParams.get('customerName') || '';
    const status = searchParams.get('status') || 'ACTIVE';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: status as any,
    };

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (fileType) {
      where.fileType = { contains: fileType, mode: 'insensitive' };
    }

    if (customerName) {
      where.customerName = { contains: customerName, mode: 'insensitive' };
    }

    // Get documents with pagination
    const [documents, totalCount] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    // Remove file content from list response for performance
    const documentsWithoutContent = documents.map(({ fileContent, ...doc }) => doc);

    return NextResponse.json({
      documents: documentsWithoutContent,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/documents - Upload new document
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to upload documents (ADMIN or EDITOR)
    const userRole = session.user.role;
    if (!['ADMIN', 'EDITOR'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      fileName,
      fileType,
      mimeType,
      fileSize,
      fileContent,
      customerName,
      uploadedDate,
      description,
      tags,
    } = body;

    // Validate required fields
    if (!fileName || !fileType || !mimeType || !fileSize || !fileContent || !customerName || !uploadedDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type - Only PDF, DOC/DOCX, XLSX, ZIP allowed
    const allowedTypes = ['pdf', 'doc', 'docx', 'xlsx', 'zip'];

    if (!allowedTypes.includes(fileType.toLowerCase())) {
      return NextResponse.json(
        { error: 'File type not supported. Only PDF, DOC, DOCX, XLSX, and ZIP files are allowed.' },
        { status: 400 }
      );
    }

    // Create document
    const document = await prisma.document.create({
      data: {
        fileName,
        fileType: fileType.toLowerCase(),
        mimeType,
        fileSize,
        fileContent,
        customerName,
        uploadedDate: new Date(uploadedDate),
        description: description || null,
        tags: tags || [],
        uploadedBy: session.user.id,
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Return document without file content
    const { fileContent: _, ...documentResponse } = document;

    return NextResponse.json({
      message: 'Document uploaded successfully',
      document: documentResponse,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
