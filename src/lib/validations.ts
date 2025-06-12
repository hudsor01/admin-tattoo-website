import { z } from "zod"

// Security-focused validation helpers
const sanitizeString = (str: string) => str.trim().replace(/[<>'"]/g, '');

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().max(1000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
}).refine((data) => {
  if (data.from && data.to) {
    return new Date(data.from) <= new Date(data.to);
  }
  return true;
}, "End date must be after start date")

// Enhanced security validation schemas
export const secureEmailSchema = z.string()
  .email("Invalid email address")
  .max(254, "Email too long") // RFC 5321 limit
  .toLowerCase()
  .refine(email => {
    // Block common attack patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<script/i,
      /onload=/i
    ];
    return !suspiciousPatterns.some(pattern => pattern.test(email));
  }, "Invalid email format")

export const securePasswordSchema = z.string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain uppercase, lowercase, number, and special character"
  )
  .refine(password => {
    // Common weak passwords
    const weakPasswords = ['password', '123456', 'qwerty', 'admin'];
    return !weakPasswords.some(weak => password.toLowerCase().includes(weak));
  }, "Password is too common")

export const secureNameSchema = z.string()
  .min(1, "Name is required")
  .max(100, "Name too long")
  .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters")
  .transform(sanitizeString)

export const securePhoneSchema = z.string()
  .max(20, "Phone number too long")
  .regex(/^[\+]?[1-9][\d\s\-\(\)\.]{7,18}$/, "Invalid phone number format")
  .optional()
  .or(z.literal(""))

// Customer schemas with enhanced security
export const createCustomerSchema = z.object({
  name: secureNameSchema,
  email: secureEmailSchema.optional().or(z.literal("")),
  phone: securePhoneSchema,
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .refine(date => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 120;
    }, "Invalid age")
    .optional(),
  address: z.string()
    .max(500, "Address too long")
    .transform(sanitizeString)
    .optional(),
  emergencyContact: z.string()
    .max(200, "Emergency contact info too long")
    .transform(sanitizeString)
    .optional(),
  medicalConditions: z.string()
    .max(1000, "Medical conditions description too long")
    .transform(sanitizeString)
    .optional(),
  allergies: z.string()
    .max(500, "Allergies description too long")
    .transform(sanitizeString)
    .optional(),
  notes: z.string()
    .max(2000, "Notes too long")
    .transform(sanitizeString)
    .optional()
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

// Auth schemas with enhanced security
export const loginSchema = z.object({
  email: secureEmailSchema,
  password: z.string().min(1, "Password is required").max(128, "Password too long")
})

export const signupSchema = z.object({
  name: secureNameSchema,
  email: secureEmailSchema,
  password: securePasswordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string()
    .max(255, "Filename too long")
    .regex(/^[a-zA-Z0-9._-]+$/, "Invalid filename characters"),
  mimetype: z.enum([
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ], { errorMap: () => ({ message: "Invalid file type" }) }),
  size: z.number()
    .max(10 * 1024 * 1024, "File too large (max 10MB)")
    .positive("Invalid file size")
})

// Analytics filter schema (was missing)
export const analyticsFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metrics: z.array(z.enum(['bookings', 'revenue', 'customers', 'retention'])).optional(),
  period: z.enum(['day', 'week', 'month', 'year']).default('month')
})

// API rate limiting schema
export const rateLimitSchema = z.object({
  ip: z.string().ip(),
  endpoint: z.string().max(200),
  timestamp: z.number().int().positive()
})

// Audit log schema
export const auditLogSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN']),
  resource: z.string().max(100),
  resourceId: z.string().uuid().optional(),
  ip: z.string().max(45), // IPv6 max length
  userAgent: z.string().max(500),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional()
})

// Response schemas with generic types
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional()
})

export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.unknown()),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean()
  }),
  error: z.string().optional()
})

// Type exports with proper generics
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
export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>
export type Login = z.infer<typeof loginSchema>
export type Signup = z.infer<typeof signupSchema>

// API response types with proper generics
export type ApiResponse<T = unknown> = { 
  success: boolean; 
  data?: T; 
  error?: string; 
  message?: string 
}

export type PaginatedResponse<T = unknown> = { 
  success: boolean; 
  data: T[]; 
  pagination: { 
    total: number; 
    limit: number; 
    offset: number; 
    hasMore: boolean 
  }; 
  error?: string 
}