import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { VersionType, VersionStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Await params
    const { id: processId } = await context.params;

    // Call external API
    const payload = {
      process_id: processId,
      collection_name: "fielditem_content",
      page_no: "1"
    };

    console.log('Calling external API with payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${process.env.AI_URL}/document_extraction/select_projection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log("RESPONSE: ", response)

    

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error("External API error body:", errText);
      return NextResponse.json(
        { error: `External API error: ${response.status}`, details: errText },
        { status: 500 }
      );
    }

    const responseText = await response.text();
    
    let v1Data;
    try {
      v1Data = JSON.parse(responseText);
      console.log('Parsed V1 Data:', JSON.stringify(v1Data, null, 2));
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON response from external API' }, { status: 500 });
    }
    
    console.log("v1Data: ", v1Data)

    // Store V1 in database
    const documentVersion = await prisma.documentVersion.create({
      data: {
        documentId: processId, // Now optional, stores external process ID
        versionType: VersionType.VERSION_1,
        versionNumber: 1,
        status: VersionStatus.GENERATED,
        jsonContent: v1Data,
        externalApiResponse: v1Data,
        externalApiRequestId: processId,
        createdBy: session.user.id,
      }
    });

    return NextResponse.json({
      message: 'V1 generated and stored successfully',
      version: documentVersion
    });

  } catch (error) {
    console.error('Error generating V1:', error);
    return NextResponse.json({ error: 'Failed to generate V1' }, { status: 500 });
  }
}
