import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { StudentSidebar } from "./student-sidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <StudentSidebar logoutAction={logout} />
      
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 bg-background">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
