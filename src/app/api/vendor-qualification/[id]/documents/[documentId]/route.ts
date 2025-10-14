import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET - Download specific document
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, documentId } = await context.params;

    const document = await prisma.vendorDocument.findFirst({
      where: {
        id: documentId,
        vendorQualificationId: id
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Decode base64 content
    const buffer = Buffer.from(document.fileContent, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.fileSize.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific document
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, documentId } = await context.params;

    // Check if qualification exists and user has permission
    const qualification = await prisma.vendorQualification.findUnique({
      where: { id }
    });

    if (!qualification) {
      return NextResponse.json(
        { error: 'Vendor qualification not found' },
        { status: 404 }
      );
    }

    if (qualification.submittedBy !== session.user.id && session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to delete this document' },
        { status: 403 }
      );
    }

    // Delete document
    await prisma.vendorDocument.delete({
      where: { id: documentId }
    });

    return NextResponse.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}



