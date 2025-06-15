import { authClient } from "./auth-client";

export const signinGoogle = async () => {
  const data = await authClient.signIn.social({
    provider: "google",
  });
  return data;
};