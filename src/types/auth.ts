import type { User, Session } from "better-auth/types";

// Extended user type with custom fields
export interface AppUser extends User {
  role: "admin" | "user";
  phone?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: Date;
}

// Organization member with role
export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: "owner" | "manager" | "artist" | "receptionist";
  createdAt: Date;
  user: AppUser;
}

// Organization type
export interface Organization {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  createdAt: Date;
  metadata?: string;
  members?: OrganizationMember[];
}

// Enhanced session with organization context
export interface AppSession extends Session {
  user: AppUser;
  activeOrganizationId?: string;
}

// Permission types for type safety
export type StudioPermission = 
  | "booking:read" 
  | "booking:create" 
  | "booking:update" 
  | "booking:delete"
  | "customer:read" 
  | "customer:create" 
  | "customer:update" 
  | "customer:delete"
  | "payment:read" 
  | "payment:create" 
  | "payment:update"
  | "analytics:read"
  | "gallery:read" 
  | "gallery:create" 
  | "gallery:update" 
  | "gallery:delete"
  | "appointment:read" 
  | "appointment:own"
  | "*";

export type StudioRole = "owner" | "manager" | "artist" | "receptionist";

// Role permission mapping
export const ROLE_PERMISSIONS: Record<StudioRole, StudioPermission[]> = {
  owner: ["*"],
  manager: [
    "booking:*" as StudioPermission, 
    "customer:*" as StudioPermission, 
    "payment:*" as StudioPermission,
    "analytics:read",
    "gallery:*" as StudioPermission
  ],
  artist: [
    "booking:read", 
    "booking:update", 
    "customer:read", 
    "gallery:*" as StudioPermission,
    "appointment:own"
  ],
  receptionist: [
    "booking:*" as StudioPermission, 
    "customer:*" as StudioPermission, 
    "payment:read",
    "appointment:read"
  ]
};

// Auth context types
export interface AuthContextType {
  user: AppUser | null;
  session: AppSession | null;
  isLoading: boolean;
  isSignedIn: boolean;
  activeOrganization: Organization | null;
  organizations: Organization[];
  permissions: StudioPermission[];
  hasPermission: (permission: StudioPermission) => boolean;
}

// Admin action types
export interface AdminUserData {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "user";
}

export interface AdminUserFilters {
  role?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

// Organization action types
export interface CreateOrganizationData {
  name: string;
  description?: string;
  slug?: string;
}

export interface InviteMemberData {
  email: string;
  role: StudioRole;
  organizationId: string;
}

export interface UpdateMemberRoleData {
  userId: string;
  organizationId: string;
  role: StudioRole;
}