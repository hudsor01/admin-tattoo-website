import type { AuthSession, AuthUser, EnhancedUser } from "@/lib/auth";
import type { ClientSession, ClientUser } from "@/lib/auth-client";
import { z } from "zod";

// Server-side types (from auth instance)
export type Session = AuthSession;
export type User = AuthUser;

// Client-side types (from authClient instance)  
export type { ClientSession, ClientUser };

// Re-export enhanced user type
export type { EnhancedUser };

// Admin user type (user with admin role)
export interface AdminUser extends User {
  role: 'admin';
}

// Auth request validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const newPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  token: z.string().min(1, "Reset token is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Inferred types from schemas
export type LoginRequest = z.infer<typeof loginSchema>;
export type SignUpRequest = z.infer<typeof signUpSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type NewPasswordRequest = z.infer<typeof newPasswordSchema>;

// Auth error types
export interface AuthError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, string>;
}

// Auth response types
export interface AuthResponse<T = unknown> {
  data?: T;
  error?: AuthError;
  success: boolean;
}

// Permission types for RBAC
export type Permission = 
  | 'dashboard:view'
  | 'analytics:view'
  | 'customers:view'
  | 'customers:create'
  | 'customers:update'  
  | 'customers:delete'
  | 'appointments:view'
  | 'appointments:create'
  | 'appointments:update'
  | 'appointments:delete'
  | 'media:view'
  | 'media:upload'
  | 'media:delete'
  | 'media:sync'
  | 'admin:access'
  | 'admin:settings'
  | 'admin:users';

export type Role = 'user' | 'admin';

// Permission mapping by role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user: [
    'dashboard:view',
    'customers:view',
    'appointments:view',
    'media:view',
  ],
  admin: [
    'dashboard:view',
    'analytics:view',
    'customers:view',
    'customers:create',
    'customers:update',
    'customers:delete',
    'appointments:view',
    'appointments:create',
    'appointments:update',
    'appointments:delete',
    'media:view',
    'media:upload',
    'media:delete',
    'media:sync',
    'admin:access',
    'admin:settings',
    'admin:users',
  ],
};

// Auth context type for React components
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  canManageResource: (resource: string, action: string) => boolean;
}

// Admin action types for Better Auth admin plugin
export interface AdminUserData {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface AdminUserFilters {
  role?: Role;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface AdminUserUpdate {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
  banned?: boolean;
  banReason?: string;
  banExpires?: Date;
}

// Session management types
export interface SessionInfo {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivity?: Date;
}

// Security audit types
export interface SecurityAuditEvent {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, string>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Rate limiting types
export interface RateLimitInfo {
  remaining: number;
  reset: Date;
  limit: number;
  retryAfter?: number;
}

// Two-factor authentication types (for future enhancement)
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  backupCode?: string;
}
