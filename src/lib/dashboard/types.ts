export interface DashboardStatsResponse {
  appointments: {
    total: number;
    upcoming: number;
    completed: number;
    inPeriod: number;
    change: number;
  };
  customers: {
    total: number;
    newInPeriod: number;
    change: number;
  };
  revenue: {
    total: number;
    inPeriod: number;
    change: number;
    paymentsCount: number;
  };
  period: {
    label: string;
    startDate: string;
    endDate: string;
  };
}

export type DashboardPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface WeeklyappointmentsData {
  day: string;
  date: string;
  appointments: number;
}

export interface ServiceDistributionData {
  name: string;
  value: number;
  percentage: number;
}

// Chart data types
export interface AdminRevenueData {
  month: string;
  revenue: number;
  appointments: number;
}

export interface AdminServiceData {
  name: string;
  value: number;
  sessions: number;
  color: string;
}

export interface AdminTimeSlotData {
  time: string;
  appointments: number;
}

export interface AdminDayData {
  day: string;
  appointments: number;
}

export interface AdminRevenueChartProps {
  timeRange: string | 'week' | 'month' | 'year' | 'today';
}
