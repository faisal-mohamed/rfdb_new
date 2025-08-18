// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth-config';
// import { prisma } from '@/lib/prisma';

// // GET /api/documents/[id]/download - Download document file
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const session = await getServerSession(authOptions);
    
//     if (!session?.user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // Check if user has permission to download documents
//     const userRole = session.user.role;
//     if (!['ADMIN', 'EDITOR', 'APPROVER', 'VIEWER'].includes(userRole)) {
//       return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
//     }

//     const document = await prisma.document.findUnique({
//       where: { 
//         id: params.id,
//         status: 'ACTIVE' // Only allow downloading active documents
//       },
//     });

//     if (!document) {
//       return NextResponse.json({ error: 'Document not found' }, { status: 404 });
//     }

//     // Convert base64 to buffer
//     const fileBuffer = Buffer.from(document.fileContent, 'base64');

//     // Set appropriate headers for file download
//     const headers = new Headers();
//     headers.set('Content-Type', document.mimeType);
//     headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`);
//     headers.set('Content-Length', fileBuffer.length.toString());

//     return new NextResponse(fileBuffer, {
//       status: 200,
//       headers,
//     });
//   } catch (error) {
//     console.error('Error downloading document:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

// Ensure Node runtime since we use Buffer
export const runtime = 'nodejs'

// GET /api/documents/[id]/download - Download document file
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // <-- params is a Promise in Next 15
) {
  try {
    const { id } = await ctx.params

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    if (!['ADMIN', 'EDITOR', 'APPROVER', 'VIEWER'].includes(userRole as string)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // NOTE: findUnique cannot include non-unique fields; use findFirst for (id + status)
    const document = await prisma.document.findFirst({
      where: { id, status: 'ACTIVE' },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const fileBuffer = Buffer.from(document.fileContent, 'base64')

    const headers = new Headers()
    headers.set('Content-Type', document.mimeType || 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`)
    headers.set('Content-Length', fileBuffer.length.toString())

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
