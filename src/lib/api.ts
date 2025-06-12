import { DashboardStats, RevenueData, TattooSession, Appointment, Client, TattooArtist, PopularDesign } from "@/types/tattoo"

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats')
  if (!response.ok) throw new Error('Failed to fetch dashboard stats')
  return response.json()
}

export async function fetchRevenueData(): Promise<RevenueData[]> {
  const response = await fetch('/api/dashboard/revenue')
  if (!response.ok) throw new Error('Failed to fetch revenue data')
  return response.json()
}

export async function fetchRecentSessions(): Promise<TattooSession[]> {
  const response = await fetch('/api/sessions?limit=10&sort=recent')
  if (!response.ok) throw new Error('Failed to fetch recent sessions')
  return response.json()
}

export async function fetchUpcomingAppointments(): Promise<Appointment[]> {
  const response = await fetch('/api/appointments?status=scheduled&limit=5')
  if (!response.ok) throw new Error('Failed to fetch upcoming appointments')
  return response.json()
}

export async function fetchClients(page = 1, limit = 10): Promise<{ clients: Client[], total: number }> {
  const response = await fetch(`/api/clients?page=${page}&limit=${limit}`)
  if (!response.ok) throw new Error('Failed to fetch clients')
  return response.json()
}

export async function fetchArtists(): Promise<TattooArtist[]> {
  const response = await fetch('/api/artists')
  if (!response.ok) throw new Error('Failed to fetch artists')
  return response.json()
}

export async function fetchPopularDesigns(): Promise<PopularDesign[]> {
  const response = await fetch('/api/designs/popular?limit=5')
  if (!response.ok) throw new Error('Failed to fetch popular designs')
  return response.json()
}
