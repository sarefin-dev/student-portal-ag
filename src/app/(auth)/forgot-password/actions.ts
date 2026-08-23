"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function resetPassword(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  
  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  
  // Get origin for the redirect URL
  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Tell Supabase to send a reset email that links back to our callback route.
  // The callback route will exchange the code for a session and redirect to /dashboard/settings
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard/settings`,
  });

  if (error) {
    // We shouldn't leak whether the email exists, but we can log it.
    console.error("Password reset error:", error);
    // Return success anyway to prevent email enumeration attacks,
    // unless it's a rate limit error.
    if (error.status === 429) {
      return { error: "Too many requests. Please try again later." };
    }
  }

  return { success: true, email };
}
