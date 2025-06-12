import { createAuthClient } from "better-auth/react";

// Add UserWithRole interface to include 'role'
export interface UserWithRole {
    id: string;
    name: string;
    emailVerified: boolean;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
    role: string;
}

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001",
});

export const {
    signIn,
    signOut,
    signUp,
    useSession,
    getSession,
    $Infer
} = authClient;

// Create a useUser hook that's compatible with the auth provider
export function useUser() {
    const session = useSession();
    // Cast user as UserWithRole to ensure 'role' is available
    return {
        user: (session.data?.user as UserWithRole) || null,
        isLoading: session.isPending,
        error: session.error
    };
}

// Create useIsAdmin hook
export function useIsAdmin() {
    const { user } = useUser();
    // Now user is typed as UserWithRole | null, so 'role' is available
    return user?.role === 'admin';
}
