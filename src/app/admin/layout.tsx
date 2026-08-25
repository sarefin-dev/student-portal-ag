import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_superadmin")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "instructor") {
    return redirect("/");
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <AdminSidebar role={profile.role} isSuperAdmin={profile.is_superadmin} logoutAction={logout} />
      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}
