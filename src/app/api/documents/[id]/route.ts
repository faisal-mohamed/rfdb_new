import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET /api/documents/[id] - Get single document with full content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view documents
    const userRole = session.user.role;
    if (!['ADMIN', 'EDITOR'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
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

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/documents/[id] - Update document metadata (not file content)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to edit documents
    const userRole = session.user.role;
    if (!['ADMIN', 'EDITOR'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { customerName, description, tags, status } = body;

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        ...(customerName && { customerName }),
        ...(description !== undefined && { description }),
        ...(tags && { tags }),
        ...(status && { status }),
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
    const { fileContent: _, ...documentResponse } = updatedDocument;

    return NextResponse.json({
      message: 'Document updated successfully',
      document: documentResponse,
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/documents/[id] - Delete document (soft delete by default)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete documents (only ADMIN)
    const userRole = session.user.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (permanent) {
      // Permanent deletion
      await prisma.document.delete({
        where: { id: params.id },
      });
      
      return NextResponse.json({
        message: 'Document permanently deleted',
      });
    } else {
      // Soft delete
      await prisma.document.update({
        where: { id: params.id },
        data: { status: 'DELETED' },
      });
      
      return NextResponse.json({
        message: 'Document moved to trash',
      });
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
