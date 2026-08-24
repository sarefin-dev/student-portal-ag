import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { InstructorSidebar } from "./instructor-sidebar";

export default async function InstructorLayout({
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "instructor") {
    return redirect("/");
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <InstructorSidebar logoutAction={logout} />
      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}
