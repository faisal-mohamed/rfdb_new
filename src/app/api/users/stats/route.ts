import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// GET /api/users/stats - Get user statistics (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [
      totalUsers,
      roleStats
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      })
    ]);

    // Format role stats
    const roleBreakdown = roleStats.reduce((acc, stat) => {
      acc[stat.role] = stat._count.role;
      return acc;
    }, {} as Record<string, number>);

    // Ensure all roles are represented
    const allRoles = ['ADMIN', 'EDITOR', 'APPROVER', 'VIEWER'];
    allRoles.forEach(role => {
      if (!roleBreakdown[role]) {
        roleBreakdown[role] = 0;
      }
    });

    return NextResponse.json({
      totalUsers,
      roleBreakdown
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
