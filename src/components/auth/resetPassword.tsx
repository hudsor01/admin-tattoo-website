"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const resetToken = searchParams.get("token");
    if (resetToken) {
      setToken(resetToken);
    } else {
      setError("Password reset token is missing or invalid.");
      toast.error("Password reset token is missing or invalid.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Use constant-time comparison to prevent timing attacks
    function constantTimeEquals(a: string, b: string): boolean {
      if (a.length !== b.length) return false;
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }
      return result === 0;
    }

    if (!constantTimeEquals(password, confirmPassword)) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    if (!token) {
      setError(
        "Cannot reset password without a valid token. Please request a new reset link.",
      );
      toast.error(
        "Cannot reset password without a valid token. Please request a new reset link.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authClient.resetPassword({
        token,
        newPassword: password,
      });

      if (res.error) {
        const errorMessage = res.error.message || "An error occurred during password reset.";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        toast.success("Password has been reset successfully. Please sign in.");
        router.push("/login");
      }
    } catch (err: unknown) {
      let displayMessage = "An unexpected error occurred. Please try again.";
      if (err instanceof Error) {
        displayMessage = err.message;
      } else if (typeof err === 'string') {
        displayMessage = err;
      }
      setError(displayMessage);
      toast.error(displayMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Enter new password and confirm it to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  placeholder="New Password"
                  disabled={!token || isSubmitting}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  disabled={!token || isSubmitting}
                />
              </div>
            </div>
            {error ? <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert> : null}
            <Button
              className="w-full mt-4"
              type="submit"
              disabled={!token || isSubmitting}
            >
              {isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
