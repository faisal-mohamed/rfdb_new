import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getSimplePermissions } from '@/lib/simplePermissions';
import FormData from 'form-data';

// POST /api/knowledge-base/upload - Upload Knowledge Base file to external API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to upload knowledge base files' },
        { status: 403 }
      );
    }

    // Parse multipart/form-data
    const formData = await request.formData();
    const category = formData.get('category') as string;
    const file = formData.get('file') as File | null;

    // Validate inputs
    if (!category || !category.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file type (Word documents only)
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExtensions = ['.doc', '.docx'];

    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Please upload a Word document (.doc or .docx)',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Prepare FormData for external API using form-data package
    const externalFormData = new FormData();
    externalFormData.append('category', category.trim());
    externalFormData.append('file', fileBuffer, {
      filename: file.name,
      contentType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Call external API
    const aiUrl = process.env.AI_URL;
    if (!aiUrl) {
      console.error('AI_URL environment variable is not set');
      return NextResponse.json(
        { error: 'External API configuration error' },
        { status: 500 }
      );
    }

    const externalApiUrl = `${aiUrl}/knowledge_base/upload_file`;

    console.log('Calling external API:', externalApiUrl);
    console.log('Category:', category.trim());
    console.log('File name:', file.name);
    console.log('File size:', file.size, 'bytes');

    const response = await fetch(externalApiUrl, {
      method: 'POST',
      body: externalFormData as any,
      headers: externalFormData.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('External API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      return NextResponse.json(
        {
          error: `External API error: ${response.status}`,
          details: errorText || response.statusText,
        },
        { status: response.status || 500 }
      );
    }

    const result = await response.json().catch(() => ({}));

    console.log('External API success:', result);

    return NextResponse.json({
      success: true,
      message: 'Knowledge base file uploaded successfully',
      category: category.trim(),
      fileName: file.name,
      result,
    });
  } catch (error) {
    console.error('Error uploading knowledge base file:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload knowledge base file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

