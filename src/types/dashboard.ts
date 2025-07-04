import type { SessionStatus } from "./database";

export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  newClients: number;
  clientGrowth: number;
  activeBookings: number;
  bookingGrowth: number;
  completionRate: number;
  completionGrowth: number;
  // Additional properties used by section-cards
  revenue: number;
  revenueChange: string;
  totalClients: number;
  clientsChange: string;
  monthlyAppointments: number;
  appointmentsChange: string;
  averageRating: number;
  ratingChange: string;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  sessions: number;
}

export interface RecentSession {
  id: string;
  clientName: string;
  artistName: string;
  type: string;
  duration: number;
  amount: number;
  date: string;
  status: SessionStatus;
}

export interface RecentClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinDate: string;
  totalSessions: number;
  totalSpent: number;
  lastSession?: string;
}

export interface AppointmentData {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
}

export interface DashboardData {
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  recentSessions: RecentSession[];
  recentClients: RecentClient[];
  appointments: AppointmentData[];
}

export interface AppointmentStats {
  totalAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  completionRate: number;
  appointmentsChange: string;
  confirmedChange: string;
  completedChange: string;
  completionRateChange: string;
}

export interface SpecificChartDataPoint {
  date: string; // e.g., "Jan 01"
  value1: number; // e.g., Revenue
  value2: number; // e.g., Scaled appointments or another metric
}
