import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

// Create the auth client with admin plugin
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://admin.ink37tattoos.com/api/auth",
  plugins: [adminClient()],
});

// Export types from client with proper inference of additional fields
export type ClientSession = typeof authClient.$Infer.Session;
export type ClientUser = typeof authClient.$Infer.Session.user;
