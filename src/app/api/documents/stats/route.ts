import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET /api/documents/stats - Get document statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view document stats
    const userRole = session.user.role;
    if (!['ADMIN', 'EDITOR'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get basic counts
    const [
      totalDocuments,
      activeDocuments,
      archivedDocuments,
      deletedDocuments,
      recentDocuments,
    ] = await Promise.all([
      prisma.document.count(),
      prisma.document.count({ where: { status: 'ACTIVE' } }),
      prisma.document.count({ where: { status: 'ARCHIVED' } }),
      prisma.document.count({ where: { status: 'DELETED' } }),
      prisma.document.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Get file type breakdown
    const fileTypeStats = await prisma.document.groupBy({
      by: ['fileType'],
      where: { status: 'ACTIVE' },
      _count: {
        fileType: true,
      },
      orderBy: {
        _count: {
          fileType: 'desc',
        },
      },
    });

    const fileTypeBreakdown = fileTypeStats.reduce((acc, stat) => {
      acc[stat.fileType.toUpperCase()] = stat._count.fileType;
      return acc;
    }, {} as Record<string, number>);

    // Get top customers by document count
    const customerStats = await prisma.document.groupBy({
      by: ['customerName'],
      where: { status: 'ACTIVE' },
      _count: {
        customerName: true,
      },
      orderBy: {
        _count: {
          customerName: 'desc',
        },
      },
      take: 5,
    });

    const topCustomers = customerStats.map(stat => ({
      customerName: stat.customerName,
      documentCount: stat._count.customerName,
    }));

    // Get total storage used (in bytes)
    const storageStats = await prisma.document.aggregate({
      where: { status: 'ACTIVE' },
      _sum: {
        fileSize: true,
      },
    });

    const totalStorageBytes = storageStats._sum.fileSize || 0;
    const totalStorageMB = Math.round(totalStorageBytes / (1024 * 1024) * 100) / 100;

    // Get upload activity for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const uploadActivity = await prisma.document.groupBy({
      by: ['uploadedBy'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'ACTIVE',
      },
      _count: {
        uploadedBy: true,
      },
      orderBy: {
        _count: {
          uploadedBy: 'desc',
        },
      },
      take: 5,
    });

    // Get uploader details
    const uploaderIds = uploadActivity.map(activity => activity.uploadedBy);
    const uploaders = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const topUploaders = uploadActivity.map(activity => {
      const uploader = uploaders.find(u => u.id === activity.uploadedBy);
      return {
        uploader: uploader ? {
          id: uploader.id,
          name: `${uploader.firstName} ${uploader.lastName}`,
          email: uploader.email,
        } : null,
        uploadCount: activity._count.uploadedBy,
      };
    }).filter(item => item.uploader);

    return NextResponse.json({
      totalDocuments,
      activeDocuments,
      archivedDocuments,
      deletedDocuments,
      recentDocuments,
      fileTypeBreakdown,
      topCustomers,
      totalStorageMB,
      topUploaders,
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
