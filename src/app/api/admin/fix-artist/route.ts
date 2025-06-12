import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    // First, find Fernando's ID
    const fernando = await prisma.tattooArtist.findFirst({
      where: { name: 'Fernando Govea' }
    })

    if (!fernando) {
      // Create Fernando if he doesn't exist
      const newFernando = await prisma.tattooArtist.create({
        data: {
          name: 'Fernando Govea',
          email: 'fernando@ink37tattoos.com',
          phone: '+1-555-0123',
          specialties: ['Traditional', 'Realism', 'Script', 'Blackwork'],
          hourlyRate: 150,
          isActive: true,
          portfolio: [],
          bio: 'Master tattoo artist and owner of Ink 37 Tattoos'
        }
      })

      // Update all sessions and appointments to Fernando
      await Promise.all([
        prisma.tattooSession.updateMany({
          where: {},
          data: { artistId: newFernando.id }
        }),
        prisma.appointment.updateMany({
          where: {},
          data: { artistId: newFernando.id }
        })
      ])

      // Delete any other artists
      await prisma.tattooArtist.deleteMany({
        where: {
          id: { not: newFernando.id }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Created Fernando Govea and assigned all work to him',
        artist: newFernando
      })
    }

    // Fernando exists, update all sessions, appointments, and designs to him
    await Promise.all([
      prisma.tattooSession.updateMany({
        where: {},
        data: { artistId: fernando.id }
      }),
      prisma.appointment.updateMany({
        where: {},
        data: { artistId: fernando.id }
      }),
      prisma.tattooDesign.updateMany({
        where: {},
        data: { artistId: fernando.id }
      })
    ])

    // Delete any other artists
    const deletedArtists = await prisma.tattooArtist.deleteMany({
      where: {
        id: { not: fernando.id }
      }
    })

    // Verify the fix
    const [artistCount, sessionCount, appointmentCount] = await Promise.all([
      prisma.tattooArtist.count(),
      prisma.tattooSession.count({ where: { artistId: fernando.id } }),
      prisma.appointment.count({ where: { artistId: fernando.id } })
    ])

    return NextResponse.json({
      success: true,
      message: 'Fixed! All sessions and appointments now belong to Fernando Govea',
      deletedOtherArtists: deletedArtists.count,
      fernando: {
        ...fernando,
        totalSessions: sessionCount,
        totalAppointments: appointmentCount
      },
      totalArtists: artistCount
    })
  } catch (error) {
    console.error('Fix artist error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}