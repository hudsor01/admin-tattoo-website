export interface TattooArtist {
  id: string
  name: string
  email: string
  phone: string
  specialties: string[]
  hourlyRate: number
  isActive: boolean
  portfolio: string[]
  bio: string
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: Date
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  allergies: string[]
  medicalConditions: string[]
  preferredArtist?: string
  createdAt: Date
  updatedAt: Date
}

export interface TattooSession {
  id: string
  clientId: string
  artistId: string
  appointmentDate: Date
  duration: number // minutes
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show"
  design: {
    description: string
    placement: string
    size: string
    style: string
    referenceImages: string[]
  }
  pricing: {
    hourlyRate: number
    estimatedHours: number
    depositAmount: number
    totalCost: number
    paidAmount: number
  }
  notes: string
  aftercareProvided: boolean
  consentFormSigned: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TattooDesign {
  id: string
  title: string
  description: string
  style: string
  tags: string[]
  imageUrl: string
  artistId: string
  isPublic: boolean
  estimatedHours: number
  popularity: number
  createdAt: Date
  updatedAt: Date
}

export interface Appointment {
  id: string
  clientId: string
  artistId: string
  scheduledDate: Date
  duration: number
  status: "scheduled" | "confirmed" | "in-progress" | "completed" | "cancelled"
  type: "consultation" | "tattoo-session" | "touch-up" | "removal"
  notes: string
  reminderSent: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  totalClients: number
  totalArtists: number
  monthlyRevenue: number
  appointmentsToday: number
  completedSessions: number
  upcomingAppointments: number
  revenueGrowth: number
  clientGrowth: number
}

export interface RevenueData {
  month: string
  revenue: number
  sessions: number
  avgSessionValue: number
}

export interface PopularDesign {
  id: string
  title: string
  imageUrl: string
  requestCount: number
  artist: string
}