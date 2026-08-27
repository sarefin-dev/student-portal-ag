"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateStudentProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();

  if (!fullName) {
    return { error: "Full name is required." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      address: address || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { error: error.message };
  }

  // Update user metadata in auth
  await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      phone: phone || null,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
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

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/settings");
}

export async function updateInstructorProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const instructorTitle = formData.get("instructor_title") as string;
  const signatureImage = formData.get("signature_image") as File | null;
  
  const updates: any = {};
  if (instructorTitle !== undefined) {
    updates.instructor_title = instructorTitle;
  }

  // Handle signature upload bypassing RLS with service role key if needed, or if RLS allows it (we didn't allow instructors in RLS for storage directly yet, so we will use the admin supabase client to upload securely).
  // Wait, I will use a separate admin client just to be safe, since storage RLS is restricted to is_admin().
  if (signatureImage && signatureImage.size > 0) {
    const fileExt = signatureImage.name.split('.').pop();
    const filePath = `signatures/${user.id}-${Date.now()}.${fileExt}`;
    
    // We use service role to bypass storage RLS
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: uploadData, error: uploadError } = await adminSupabase
      .storage
      .from('public_media')
      .upload(filePath, signatureImage, { contentType: signatureImage.type, upsert: true });

    if (uploadError) {
      console.error("Upload error", uploadError);
      throw new Error("Failed to upload signature");
    }

    const { data: publicUrlData } = adminSupabase.storage.from('public_media').getPublicUrl(filePath);
    updates.signature_url = publicUrlData.publicUrl;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/settings");
}
