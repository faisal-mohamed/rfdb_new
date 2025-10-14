import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// POST - Upload document to vendor qualification
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
    const qualification = await prisma.vendorQualification.findUnique({
      where: { id }
    });

    if (!qualification) {
      return NextResponse.json(
        { error: 'Vendor qualification not found' },
        { status: 404 }
      );
    }

    if (qualification.submittedBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to upload documents' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { documentType, fileName, fileContent, fileSize, mimeType } = body;

    // Validate required fields
    if (!documentType || !fileName || !fileContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if document with same type already exists (for single-file types)
    const existingDoc = await prisma.vendorDocument.findFirst({
      where: {
        vendorQualificationId: id,
        documentType
      }
    });

    if (existingDoc) {
      // Update existing document
      const document = await prisma.vendorDocument.update({
        where: { id: existingDoc.id },
        data: {
          fileName,
          fileContent,
          fileSize,
          mimeType,
          uploadedAt: new Date()
        }
      });

      return NextResponse.json({
        message: 'Document updated successfully',
        document: {
          id: document.id,
          documentType: document.documentType,
          fileName: document.fileName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          uploadedAt: document.uploadedAt
        }
      });
    } else {
      // Create new document
      const document = await prisma.vendorDocument.create({
        data: {
          vendorQualificationId: id,
          documentType,
          fileName,
          fileContent,
          fileSize,
          mimeType
        }
      });

      return NextResponse.json({
        message: 'Document uploaded successfully',
        document: {
          id: document.id,
          documentType: document.documentType,
          fileName: document.fileName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          uploadedAt: document.uploadedAt
        }
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// GET - List all documents for a qualification
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

    const documents = await prisma.vendorDocument.findMany({
      where: { vendorQualificationId: id },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true
        // Exclude fileContent for listing
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return NextResponse.json({ documents });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}



