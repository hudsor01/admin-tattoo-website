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
 * Safely get role level without object injection risk
 */
function getRoleLevel(role: Role): number {
  switch (role) {
    case Role.USER: return 0;
    case Role.STAFF: return 1;
    case Role.MANAGER: return 2;
    case Role.ADMIN: return 3;
    case Role.SUPER_ADMIN: return 4;
    default: return -1;
  }
}

/**
 * Safely get role permissions without object injection risk
 */
function getRolePermissions(role: Role): Permission[] {
  switch (role) {
    case Role.USER: 
      return [];
    case Role.STAFF: 
      return BASE_STAFF_PERMISSIONS;
    case Role.MANAGER: 
      return [...BASE_STAFF_PERMISSIONS, ...BASE_MANAGER_PERMISSIONS];
    case Role.ADMIN: 
      return [...BASE_STAFF_PERMISSIONS, ...BASE_MANAGER_PERMISSIONS, ...BASE_ADMIN_PERMISSIONS];
    case Role.SUPER_ADMIN: 
      return Object.values(Permission);
    default: 
      return [];
  }
}

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
  user: AuthorizedUser | null | undefined, 
  permission: Permission
): boolean {
  // Handle null/undefined user
  if (!user) {
    return false;
  }
  
  // Check custom permissions first
  if (user.permissions?.includes(permission)) {
    return true;
  }
  
  // Handle missing role - default to user role
  if (!user.role) {
    // If no role is set, only allow if explicitly granted permission
    return user.permissions?.includes(permission) || false;
  }
  
  // Safely validate and get user role
  const userRole = validateUserRole(user.role);
  if (!userRole) {
    // For invalid roles, fall back to legacy admin check
    const roleString = typeof user.role === 'string' ? user.role : String(user.role);
    return roleString === 'admin' && permission === Permission.ADMIN_ACCESS;
  }
  
  const rolePermissions = getRolePermissions(userRole);
  return rolePermissions.includes(permission);
}

/**
 * Safely validate a user role
 */
function validateUserRole(role: Role | string | undefined): Role | null {
  if (!role) return null;
  
  const roleString = typeof role === 'string' ? role : String(role);
  
  // Check if it's a valid enum value
  if (Object.values(Role).includes(roleString as Role)) {
    return roleString as Role;
  }
  
  return null;
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
  const userRole = validateUserRole(user.role);
  if (!userRole) return false;
    
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(requiredRole);
  
  return userLevel >= requiredLevel;
}

/**
 * Legacy admin check for backward compatibility
 */
export function isAdmin(user: AuthorizedUser | null | undefined): boolean {
  if (!user) {
    return false;
  }
  
  return hasPermission(user, Permission.ADMIN_ACCESS) || 
         hasRole(user, Role.ADMIN) ||
         user.role === 'admin'; // Legacy string check - email verification removed for security
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
 * 
 * @param user - The user to check authorization for
 * @returns true if user has dashboard access
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
  const resourceLower = resource.toLowerCase();
  
  // Safe permission lookup without object injection
  function getPermissionForResource(res: string, act: string): Permission | null {
    if (res === 'customers') {
      switch (act) {
        case 'read': return Permission.READ_CUSTOMERS;
        case 'create': return Permission.CREATE_CUSTOMERS;
        case 'update': return Permission.UPDATE_CUSTOMERS;
        case 'delete': return Permission.DELETE_CUSTOMERS;
        default: return null;
      }
    }
    
    if (res === 'appointments') {
      switch (act) {
        case 'read': return Permission.READ_APPOINTMENTS;
        case 'create': return Permission.CREATE_APPOINTMENTS;
        case 'update': return Permission.UPDATE_APPOINTMENTS;
        case 'delete': return Permission.DELETE_APPOINTMENTS;
        default: return null;
      }
    }
    
    if (res === 'media') {
      switch (act) {
        case 'read': return Permission.READ_MEDIA;
        case 'create': return Permission.UPLOAD_MEDIA;
        case 'update': return Permission.UPDATE_MEDIA;
        case 'delete': return Permission.DELETE_MEDIA;
        default: return null;
      }
    }
    
    return null;
  }
  
  const requiredPermission = getPermissionForResource(resourceLower, action);
  if (!requiredPermission) {
    // Fallback to admin check for unknown resources
    return isAdmin(user);
  }
  
  return hasPermission(user, requiredPermission);
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
  
  // Add role-based permissions safely
  const userRole = validateUserRole(user.role);
  if (userRole) {
    const rolePermissions = getRolePermissions(userRole);
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
