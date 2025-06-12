import type { AppointmentStatus, SessionStatus } from '@prisma/client';

export type FilterOption<T> = T | "ALL";

export type AppointmentStatusFilter = FilterOption<AppointmentStatus>;
export type SessionStatusFilter = FilterOption<SessionStatus>;

export const parseAppointmentStatusFilter = (filter: string): AppointmentStatusFilter => {
  if (filter === "ALL") return "ALL";
  return isValidAppointmentStatus(filter) ? filter as AppointmentStatus : "ALL";
};

export const parseSessionStatusFilter = (filter: string): SessionStatusFilter => {
  if (filter === "ALL") return "ALL";
  return isValidSessionStatus(filter) ? filter as SessionStatus : "ALL";
};

function isValidAppointmentStatus(status: string): status is AppointmentStatus {
  return ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status);
}

function isValidSessionStatus(status: string): status is SessionStatus {
  return ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status);
}

export type FilterParams = {
  appointmentStatus?: AppointmentStatusFilter;
  sessionStatus?: SessionStatusFilter;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  search?: string;
  clientId?: string;
  artistId?: string;
};