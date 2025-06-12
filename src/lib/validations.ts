import { z } from "zod"

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

// Customer schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20, "Phone number too long").optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  address: z.string().max(500, "Address too long").optional(),
  emergencyContact: z.string().max(200, "Emergency contact info too long").optional(),
  medicalConditions: z.string().max(1000, "Medical conditions description too long").optional(),
  allergies: z.string().max(500, "Allergies description too long").optional(),
  notes: z.string().max(2000, "Notes too long").optional()
})

export const updateCustomerSchema = z.object({
  id: z.string().uuid("Invalid customer ID"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20, "Phone number too long").optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  address: z.string().max(500, "Address too long").optional(),
  emergencyContact: z.string().max(200, "Emergency contact info too long").optional(),
  medicalConditions: z.string().max(1000, "Medical conditions description too long").optional(),
  allergies: z.string().max(500, "Allergies description too long").optional(),
  notes: z.string().max(2000, "Notes too long").optional()
})

// Appointment schemas
export const createAppointmentSchema = z.object({
  clientId: z.string().uuid("Invalid client ID").optional(),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  firstName: z.string().min(1, "First name is required").max(100, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20, "Phone number too long").optional(),
  type: z.enum(["CONSULTATION", "TATTOO_SESSION", "TOUCH_UP", "REMOVAL"]),
  description: z.string().max(2000, "Description too long").optional(),
  appointmentDate: z.string().datetime("Invalid appointment date"),
  startDate: z.string().datetime("Invalid start date").optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
  estimatedDuration: z.number().min(1, "Duration must be positive").optional(),
  duration: z.number().min(1, "Duration must be positive").optional(),
  artistId: z.string().uuid("Invalid artist ID").optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional()
})

export const updateAppointmentSchema = z.object({
  id: z.string().uuid("Invalid appointment ID"),
  clientId: z.string().uuid("Invalid client ID").optional(),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  firstName: z.string().min(1, "First name is required").max(100, "First name too long").optional(),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().max(20, "Phone number too long").optional(),
  type: z.enum(["CONSULTATION", "TATTOO_SESSION", "TOUCH_UP", "REMOVAL"]).optional(),
  description: z.string().max(2000, "Description too long").optional(),
  appointmentDate: z.string().datetime("Invalid appointment date").optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
  estimatedDuration: z.number().min(1, "Duration must be positive").optional(),
  duration: z.number().min(1, "Duration must be positive").optional(),
  artistId: z.string().uuid("Invalid artist ID").optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional()
})

// Payment schemas
export const createPaymentSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["cash", "card", "transfer", "venmo", "zelle"]),
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  notes: z.string().max(500, "Notes too long").optional()
})

export const updatePaymentSchema = z.object({
  id: z.string().uuid("Invalid payment ID"),
  appointmentId: z.string().uuid("Invalid appointment ID").optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0").optional(),
  method: z.enum(["cash", "card", "transfer", "venmo", "zelle"]).optional(),
  status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
  notes: z.string().max(500, "Notes too long").optional()
})

// Gallery schemas
export const createGalleryItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  imageUrl: z.string().url("Invalid image URL"),
  style: z.string().max(100, "Style name too long").optional(),
  bodyPart: z.string().max(100, "Body part name too long").optional(),
  duration: z.number().min(0, "Duration must be positive").optional(),
  featured: z.boolean().default(false),
  tags: z.array(z.string().max(50, "Tag too long")).max(10, "Too many tags").optional()
})

export const updateGalleryItemSchema = z.object({
  id: z.string().uuid("Invalid gallery item ID"),
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  style: z.string().max(100, "Style name too long").optional(),
  bodyPart: z.string().max(100, "Body part name too long").optional(),
  duration: z.number().min(0, "Duration must be positive").optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string().max(50, "Tag too long")).max(10, "Too many tags").optional()
})

// Filter schemas
export const appointmentFilterSchema = z.object({
  status: z.array(z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  customerId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

export const customerFilterSchema = z.object({
  search: z.string().max(200).optional(),
  hasAppointments: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Dashboard analytics schemas
export const analyticsFilterSchema = z.object({
  period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// Response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
})

export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean()
  }),
  error: z.string().optional()
})

// Type exports
export type CreateCustomer = z.infer<typeof createCustomerSchema>
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>
export type CreateAppointment = z.infer<typeof createAppointmentSchema>
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>
export type CreatePayment = z.infer<typeof createPaymentSchema>
export type UpdatePayment = z.infer<typeof updatePaymentSchema>
export type CreateGalleryItem = z.infer<typeof createGalleryItemSchema>
export type UpdateGalleryItem = z.infer<typeof updateGalleryItemSchema>
export type AppointmentFilter = z.infer<typeof appointmentFilterSchema>
export type CustomerFilter = z.infer<typeof customerFilterSchema>
export type Login = z.infer<typeof loginSchema>
export type Signup = z.infer<typeof signupSchema>
export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>
export type ApiResponse<T = any> = { success: boolean; data?: T; error?: string; message?: string }
export type PaginatedResponse<T = any> = { success: boolean; data: T[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean }; error?: string }