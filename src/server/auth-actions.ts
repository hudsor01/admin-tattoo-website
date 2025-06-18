"use server";

import { type AuthUser, auth } from "@/lib/auth";
import { headers } from "next/headers";

export const getSessionAction = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return session;
};

export const signOutAction = async () => {
    try {
        await auth.api.signOut({
            headers: await headers(),
        });
        return { success: true };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Sign out failed."
        };
    }
};

export const validateAdminAction = async () => {
    const session = await getSessionAction();
    if (!session?.user) return false;
    
    // Use RBAC system for admin validation
    const { isAdmin, canAccessDashboard } = await import("@/lib/authorization");
    const user = session.user as AuthUser;
    
    // Convert to AuthorizedUser format and check permissions
    const authorizedUser = {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        emailVerified: user.emailVerified || false,
        name: user.name,
        image: user.image
    };
    
    return isAdmin(authorizedUser) || canAccessDashboard(authorizedUser);
};

export const signIn = async (email: string, password: string) => {
    try {
        await auth.api.signInEmail({
            body: {
                email,
                password,
            }
        });

        return {
            success: true,
            message: "Signed in successfully."
        };
    } catch (error) {
        const e = error as Error;

        return {
            success: false,
            message: e.message || "An unknown error occurred."
        };
    }
};
