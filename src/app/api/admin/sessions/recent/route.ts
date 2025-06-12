import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Skip authentication in development - add proper auth in production
const isDevelopment = process.env.NODE_ENV === 'development';

export async function GET() {
  try {
    // Skip auth check in development
    if (!isDevelopment) {
      // TODO: Add proper authentication check for production
      // const session = await getServerSession(authOptions);
      // if (!session || session.user.role !== 'admin') {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // }
    }

    // Fetch recent sessions with related data
    const recentSessions = await prisma.tattooSession.findMany({
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            specialties: true
          }
        }
      },
      orderBy: {
        appointmentDate: 'desc'
      },
      take: 20 // Limit to 20 most recent sessions
    });

    return NextResponse.json({
      data: recentSessions,
      total: recentSessions.length
    });

  } catch (error) {
    console.error('Recent sessions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent sessions' }, 
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}