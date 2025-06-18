import type { 
  AppointmentStatus, 
  AppointmentType, 
  Prisma, 
  SessionStatus, 
  appointments,
  clients,
  tattoo_artists,
  tattoo_designs,
  tattoo_sessions
} from "@prisma/client";

// Database model types
export type { 
  tattoo_artists as TattooArtist, 
  clients as Client, 
  tattoo_sessions as TattooSession, 
  appointments as Appointment, 
  tattoo_designs as TattooDesign
};

// Enum types
export type { SessionStatus, AppointmentStatus, AppointmentType };

// Extended types with relations
export type AppointmentWithClient = Prisma.appointmentsGetPayload<{
  include: { clients: true }
}>;

export type TattooSessionWithClient = Prisma.tattoo_sessionsGetPayload<{
  include: { clients: true; tattoo_artists: true }
}>;

export type ClientWithAppointments = Prisma.clientsGetPayload<{
  include: { appointments: true; tattoo_sessions: true }
}>;

export type TattooDesignWithArtist = Prisma.tattoo_designsGetPayload<{
  include: { tattoo_artists: true }
}>;

export type UserWithAccounts = Prisma.UserGetPayload<{
  include: { accounts: true; sessions: true }
}>;

// Gallery/Design types
export type GalleryItem = tattoo_designs;
// DesignWithArtist was a duplicate of TattooDesignWithArtist and has been removed.

// Re-export dashboard types
export type { DashboardStats } from './dashboard';

// API Response types
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = Record<string, unknown>> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page?: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// API Response types for admin endpoints
export interface AppointmentResponse extends appointments {
  client?: clients;
  artist?: tattoo_artists;
}

export interface ClientResponse extends clients {
  appointments?: appointments[];
  sessions?: tattoo_sessions[];
}

// Use ClientResponse instead of CustomerResponse for consistency

export interface TattooSessionResponse extends tattoo_sessions {
  client?: clients;
  artist?: tattoo_artists;
}

export interface RecentSessionDTO {
  id: string;
  appointmentDate: Date;
  status: SessionStatus;
  consentSigned: boolean;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  artist: {
    id: string;
    name: string;
    email: string;
    specialties: string[];
  };
}

// Search and filter types
export interface AppointmentFilters {
  status?: AppointmentStatus[];
  type?: AppointmentType[];
  dateFrom?: Date;
  dateTo?: Date;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClientFilters {
  search?: string;
  hasAppointments?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
  offset?: number;
}

export interface TattooSessionFilters {
  status?: SessionStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  clientId?: string;
  artistId?: string;
  page?: number;
  limit?: number;
}

// Form data types
export interface CreateAppointmentData {
  clientId?: string;
  customerId?: string; // Legacy compatibility
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  type: AppointmentType;
  description?: string;
  appointmentDate: Date;
  startDate?: Date | string; // Legacy compatibility
  notes?: string;
  estimatedDuration?: number;
  duration?: number; // Legacy compatibility
  artistId?: string;
  status?: AppointmentStatus;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  id: string;
  status?: AppointmentStatus;
  calBookingUid?: string;
  calEventTypeId?: number;
  calStatus?: string;
  calMeetingUrl?: string;
}

export interface CreateClientData {
  firstName: string;
  lastName: string;
  name?: string; // For legacy compatibility
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: Date | string;
  birthDate?: Date | string; // Legacy compatibility
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRel?: string;
  medicalConditions?: string;
  medicalConds?: string[]; // Schema field name
  allergies?: string[] | string;
  medications?: string;
  preferredArtist?: string;
  notes?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string;
}

export interface CreateTattooSessionData {
  clientId: string;
  artistId: string;
  appointmentDate: Date;
  duration?: number;
  description?: string;
  bodyPart?: string;
  size?: string;
  style?: string;
  totalCost?: number;
  depositAmount?: number;
  notes?: string;
}

export interface UpdateTattooSessionData extends Partial<CreateTattooSessionData> {
  id: string;
  status?: SessionStatus;
}

export interface CreateContactData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface UpdateContactData extends Partial<CreateContactData> {
  id: string;
  adminNotes?: string;
}

// Analytics types
export interface AnalyticsTimeframe {
  start: Date;
  end: Date;
  period: "day" | "week" | "month" | "quarter" | "year";
}

export interface AppointmentAnalytics {
  timeframe: AnalyticsTimeframe;
  totalAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  noShowAppointments: number;
  conversionRate: number;
  averageSessionValue: number;
  appointmentsByDay: Array<{ date: string; count: number }>;
  appointmentsByType: Array<{ type: string; count: number }>;
}

export interface RevenueAnalytics {
  timeframe: AnalyticsTimeframe;
  totalRevenue: number;
  averageOrderValue: number;
  revenueByDay: Array<{ date: string; revenue: number }>;
  revenueByService: Array<{ service: string; revenue: number }>;
  paymentMethodBreakdown: Array<{ method: string; count: number; revenue: number }>;
}

export interface ClientAnalytics {
  timeframe: AnalyticsTimeframe;
  totalClients: number;
  newClients: number;
  returningClients: number;
  clientsBySource: Array<{ source: string; count: number }>;
  clientLifetimeValue: number;
  topClients: Array<{ client: clients; totalSpent: number; sessionCount: number }>;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  category?: string;
}
