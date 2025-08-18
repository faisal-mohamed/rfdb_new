import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { WorkflowStatus } from '@/types/workflow';

// GET /api/documents - List documents with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view documents
    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canView) {
      return NextResponse.json({ error: 'You do not have permission to view documents' }, { status: 403 });
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
    
    console.log("=== SESSION DEBUG ===");
    console.log("Full session:", JSON.stringify(session, null, 2));
    console.log("Session user:", session?.user);
    console.log("Session user id:", session?.user?.id);
    console.log("Session user email:", session?.user?.email);
    console.log("Session user role:", session?.user?.role);
    console.log("=== END SESSION DEBUG ===");
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    if (!session.user.id) {
      return NextResponse.json({ error: 'No user ID in session' }, { status: 401 });
    }

    // Check if user has permission to upload documents
    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canEdit) {
      return NextResponse.json({ error: 'You do not have permission to upload documents' }, { status: 403 });
    }

    console.log("User ID for document creation:", session.user.id);

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

    // Validate file type - Allow more file types
    const allowedTypes = ['pdf', 'doc', 'docx', 'xlsx', 'zip', 'txt', 'jpg', 'jpeg', 'png'];

    if (!allowedTypes.includes(fileType.toLowerCase())) {
      return NextResponse.json(
        { error: 'File type not supported. Only PDF, DOC, DOCX, XLSX, ZIP, TXT, and Image files are allowed.' },
        { status: 400 }
      );
    }

    // Create document with minimal fields first
    console.log("Creating document with user ID:", session.user.id);
    console.log("Session user object:", session.user);
    
    try {
      const document = await prisma.document.create({
        data: {
          fileName,
          fileType: fileType.toLowerCase(),
          mimeType,
          fileSize,
          fileContent,
          customerName,
          uploadedDate: new Date(uploadedDate),
          uploadedBy: session.user.id,
        }
      });
      
      console.log("Document created successfully:", document.id);
      
      // Return basic response
      return NextResponse.json({
        message: 'Document uploaded successfully',
        document: {
          id: document.id,
          fileName: document.fileName,
          customerName: document.customerName,
          workflowStatus: document.workflowStatus,
        },
      }, { status: 201 });
      
    } catch (createError) {
      console.error("Document creation error:", createError);
      throw createError;
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
