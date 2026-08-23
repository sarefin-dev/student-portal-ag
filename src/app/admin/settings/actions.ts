"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAdminPassword(formData: FormData) {
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  
  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Double check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/settings");
}
