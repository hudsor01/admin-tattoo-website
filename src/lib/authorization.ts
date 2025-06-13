/**
 * Centralized Role-Based Access Control (RBAC) System
 * 
 * This module provides a flexible, extensible authorization system
 * that replaces hardcoded admin checks with dynamic permission validation.
 */

// Define role hierarchy and permissions
export enum Role {
  USER = 'user',
  STAFF = 'staff',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // Customer management
  READ_CUSTOMERS = 'read_customers',
  CREATE_CUSTOMERS = 'create_customers',
  UPDATE_CUSTOMERS = 'update_customers',
  DELETE_CUSTOMERS = 'delete_customers',
  
  // Appointment management
  READ_APPOINTMENTS = 'read_appointments',
  CREATE_APPOINTMENTS = 'create_appointments',
  UPDATE_APPOINTMENTS = 'update_appointments',
  DELETE_APPOINTMENTS = 'delete_appointments',
  
  
  // Media management
  READ_MEDIA = 'read_media',
  UPLOAD_MEDIA = 'upload_media',
  UPDATE_MEDIA = 'update_media',
  DELETE_MEDIA = 'delete_media',
  
  // Payment management
  READ_PAYMENTS = 'read_payments',
  MANAGE_PAYMENTS = 'manage_payments',
  
  // Analytics and reporting
  READ_ANALYTICS = 'read_analytics',
  READ_DASHBOARD = 'read_dashboard',
  EXPORT_DATA = 'export_data',
  
  // System administration
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  SYSTEM_CONFIG = 'system_config',
  
  // Advanced permissions
  BULK_OPERATIONS = 'bulk_operations',
  AUDIT_LOGS = 'audit_logs',
  
  // Legacy compatibility
  ADMIN_ACCESS = 'admin_access'
}

// Define base permissions for each role
const BASE_STAFF_PERMISSIONS = [
  Permission.READ_CUSTOMERS,
  Permission.UPDATE_CUSTOMERS,
  Permission.READ_APPOINTMENTS,
  Permission.CREATE_APPOINTMENTS,
  Permission.UPDATE_APPOINTMENTS,
  Permission.READ_MEDIA,
  Permission.UPLOAD_MEDIA,
  Permission.READ_DASHBOARD,
  Permission.READ_PAYMENTS
];

const BASE_MANAGER_PERMISSIONS = [
  Permission.DELETE_CUSTOMERS,
  Permission.DELETE_APPOINTMENTS,
  Permission.UPDATE_MEDIA,
  Permission.DELETE_MEDIA,
  Permission.READ_ANALYTICS,
  Permission.EXPORT_DATA,
  Permission.BULK_OPERATIONS,
  Permission.MANAGE_PAYMENTS
];

const BASE_ADMIN_PERMISSIONS = [
  Permission.MANAGE_USERS,
  Permission.AUDIT_LOGS,
  Permission.ADMIN_ACCESS // Legacy compatibility
];

// Define role-permission mappings
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [],
  
  [Role.STAFF]: BASE_STAFF_PERMISSIONS,
  
  [Role.MANAGER]: [
    ...BASE_STAFF_PERMISSIONS,
    ...BASE_MANAGER_PERMISSIONS
  ],
  
  [Role.ADMIN]: [
    ...BASE_STAFF_PERMISSIONS,
    ...BASE_MANAGER_PERMISSIONS,
    ...BASE_ADMIN_PERMISSIONS
  ],
  
  [Role.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(Permission)
  ]
};

// Role hierarchy for inheritance
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 0,
  [Role.STAFF]: 1,
  [Role.MANAGER]: 2,
  [Role.ADMIN]: 3,
  [Role.SUPER_ADMIN]: 4
};

/**
 * User interface with flexible role support
 */
export interface AuthorizedUser {
  id: string;
  email: string;
  role?: Role | string; // Support both enum and string for migration - optional for auth migration
  emailVerified?: boolean;
  permissions?: Permission[]; // Override permissions if needed
  name?: string; // Better Auth includes name
  image?: string | null; // Better Auth includes image
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Better Auth user type (what the auth system actually returns)
 */
export interface BetterAuthUser {
  id: string;
  name: string;
  emailVerified: boolean;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  role?: string; // May not be present initially
}

/**
 * Authorization context for validation
 */
export interface AuthorizationContext {
  user: AuthorizedUser;
  resource?: string;
  action?: string;
  conditions?: Record<string, unknown>;
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: AuthorizedUser, 
  permission: Permission
): boolean {
  // Check custom permissions first
  if (user.permissions?.includes(permission)) {
    return true;
  }
  
  // Handle missing role - default to user role
  if (!user.role) {
    // If no role is set, only allow if explicitly granted permission
    return user.permissions?.includes(permission) || false;
  }
  
  // Get user role (support legacy string roles)
  const userRole = typeof user.role === 'string' 
    ? user.role as Role 
    : user.role;
    
  // Check if role exists in our system
  if (!Object.values(Role).includes(userRole as Role)) {
    // For unknown roles, default to legacy admin check
    return userRole === 'admin' && permission === Permission.ADMIN_ACCESS;
  }
  
  const rolePermissions = ROLE_PERMISSIONS[userRole as Role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  user: AuthorizedUser, 
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  user: AuthorizedUser, 
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user has a specific role or higher
 */
export function hasRole(user: AuthorizedUser, requiredRole: Role): boolean {
  const userRole = typeof user.role === 'string' 
    ? user.role as Role 
    : user.role;
    
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  
  return userLevel >= requiredLevel;
}

/**
 * Legacy admin check for backward compatibility
 */
export function isAdmin(user: AuthorizedUser): boolean {
  return hasPermission(user, Permission.ADMIN_ACCESS) || 
         hasRole(user, Role.ADMIN) ||
         user.role === 'admin'; // Legacy string check
}

/**
 * Convert Better Auth user to AuthorizedUser with safe defaults
 */
export function toBetterAuthUser(user: BetterAuthUser): AuthorizedUser {
  return {
    ...user,
    role: user.role || Role.USER, // Default to USER role if none specified
  };
}

/**
 * Enhanced admin check with email verification
 */
export function isVerifiedAdmin(user: AuthorizedUser): boolean {
  return isAdmin(user) && (user.emailVerified ?? false);
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessDashboard(user: AuthorizedUser): boolean {
  return hasPermission(user, Permission.READ_DASHBOARD) || isAdmin(user);
}

/**
 * Check if user can perform resource operations
 */
export function canManageResource(
  user: AuthorizedUser, 
  resource: string, 
  action: 'read' | 'create' | 'update' | 'delete'
): boolean {
  const permissionMap: Record<string, Record<string, Permission>> = {
    customers: {
      read: Permission.READ_CUSTOMERS,
      create: Permission.CREATE_CUSTOMERS,
      update: Permission.UPDATE_CUSTOMERS,
      delete: Permission.DELETE_CUSTOMERS
    },
    appointments: {
      read: Permission.READ_APPOINTMENTS,
      create: Permission.CREATE_APPOINTMENTS,
      update: Permission.UPDATE_APPOINTMENTS,
      delete: Permission.DELETE_APPOINTMENTS
    },
    media: {
      read: Permission.READ_MEDIA,
      create: Permission.UPLOAD_MEDIA,
      update: Permission.UPDATE_MEDIA,
      delete: Permission.DELETE_MEDIA
    }
  };
  
  const resourcePermissions = permissionMap[resource.toLowerCase()];
  if (!resourcePermissions) {
    // Fallback to admin check for unknown resources
    return isAdmin(user);
  }
  
  const requiredPermission = resourcePermissions[action];
  return requiredPermission ? hasPermission(user, requiredPermission) : false;
}

/**
 * Middleware helper for API route authorization
 */
export function requirePermissions(
  permissions: Permission[],
  options: {
    requireAll?: boolean;
    requireEmailVerification?: boolean;
  } = {}
) {
  return (user: AuthorizedUser): { authorized: boolean; error?: string } => {
    // Check email verification if required
    if (options.requireEmailVerification && !user.emailVerified) {
      return { 
        authorized: false, 
        error: 'Email verification required' 
      };
    }
    
    // Check permissions
    const hasRequiredPermissions = options.requireAll 
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);
      
    if (!hasRequiredPermissions) {
      return { 
        authorized: false, 
        error: 'Insufficient permissions' 
      };
    }
    
    return { authorized: true };
  };
}

/**
 * Legacy compatibility function for existing admin checks
 */
export function requireAdmin(
  options: { requireEmailVerification?: boolean } = {}
) {
  return requirePermissions([Permission.ADMIN_ACCESS], options);
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: AuthorizedUser): Permission[] {
  // Start with custom permissions
  const permissions = new Set(user.permissions || []);
  
  // Add role-based permissions
  const userRole = typeof user.role === 'string' 
    ? user.role as Role 
    : user.role;
    
  if (Object.values(Role).includes(userRole as Role)) {
    const rolePermissions = ROLE_PERMISSIONS[userRole as Role] || [];
    rolePermissions.forEach(permission => permissions.add(permission));
  }
  
  return Array.from(permissions);
}

/**
 * Resource-based authorization with context
 */
export function authorize(
  context: AuthorizationContext,
  permission: Permission
): boolean {
  const hasBasicPermission = hasPermission(context.user, permission);
  
  // Add contextual checks here if needed
  // For example, users might only access their own data
  if (context.conditions) {
    // Implement custom authorization logic based on conditions
    // This could check ownership, organization membership, etc.
  }
  
  return hasBasicPermission;
}

// Export types and constants for use in other modules
export { ROLE_PERMISSIONS, ROLE_HIERARCHY };

// Helper function to validate role string
export function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role);
}

// Migration helper for converting legacy roles
export function migrateLegacyRole(legacyRole: string): Role {
  switch (legacyRole.toLowerCase()) {
    case 'admin':
      return Role.ADMIN;
    case 'user':
      return Role.USER;
    case 'staff':
      return Role.STAFF;
    case 'manager':
      return Role.MANAGER;
    default:
      return Role.USER; // Default fallback
  }
}