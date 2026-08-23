"use client";

import { useActionState } from "react";
import { resetPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPassword, null);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background py-12 px-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-primary">Reset Password</h1>
          <p className="text-muted-foreground">Enter your email to receive a password reset link.</p>
        </div>

        <div className="rounded-lg border p-6 shadow-sm bg-card flex flex-col justify-center">
          {state?.success ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-muted-foreground text-sm">
                We have sent a password reset link to <br/>
                <span className="font-medium text-foreground">{state.email}</span>
              </p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/login">Return to Login</Link>
              </Button>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" name="email" type="email" required placeholder="name@example.com" />
              </div>
              
              {state?.error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {state.error}
                </div>
              )}

              <Button type="submit" className="w-full mt-4" disabled={pending}>
                {pending ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <div className="text-center mt-4 text-sm">
                <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  &larr; Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
