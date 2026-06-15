import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/proxy-image?path=...
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Optional: Add authentication check if images should be private
        // if (!session?.user) {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { searchParams } = new URL(request.url);
        const imagePath = searchParams.get('path');

        if (!imagePath) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        const aiUrl = process.env.AI_URL;
        if (!aiUrl) {
            console.error('AI_URL environment variable is not set');
            return NextResponse.json(
                { error: 'External API configuration error' },
                { status: 500 }
            );
        }

        // Clean up path: remove leading ./ or /
        const cleanPath = imagePath.replace(/^[\.\/]+/, '');
        const externalImageUrl = `${aiUrl}/${cleanPath}`;

        // console.log('Proxying image from:', externalImageUrl);

        const response = await fetch(externalImageUrl);

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.statusText}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error proxying image:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
