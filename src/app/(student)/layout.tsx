import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { LogOut } from "lucide-react";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:w-[264px] md:flex-shrink-0 flex flex-col">
        <div className="flex h-[64px] items-center border-b border-sidebar-border px-4">
          <span className="font-semibold text-sidebar-primary">Student Portal</span>
        </div>
        <nav className="flex flex-col gap-1 p-4 flex-1">
          <a href="/dashboard" className="rounded px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">My Courses</a>
          <a href="/dashboard/payments" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">My Payments</a>
          <a href="/courses" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Course Catalog</a>
        </nav>
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <form action={logout}>
            <button type="submit" className="flex items-center w-full gap-2 rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100 text-destructive">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-background p-6">
        {children}
      </main>
    </div>
  );
}
