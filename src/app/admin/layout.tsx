import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { LogOut } from "lucide-react";

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

  // Assuming profiles table has role='admin'
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:w-[264px] md:flex-shrink-0 flex flex-col">
        <div className="flex h-[64px] items-center border-b border-sidebar-border px-4">
          <span className="font-semibold text-sidebar-primary">Admin Portal</span>
        </div>
        <nav className="flex flex-col gap-1 p-4 flex-1">
          <a href="/admin" className="rounded px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Overview</a>
          <a href="/admin/courses" className="rounded px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Courses</a>
          <a href="/admin/resources" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Resources</a>
          <a href="/admin/bundles" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Bundles</a>
          <a href="/admin/coupons" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Coupons & Promos</a>
          
          <div className="mt-4 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operations</div>
          <a href="/admin/enrollments" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Global Enrollments</a>
          <a href="/admin/enroll-manual" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Manual Enroll</a>
          <a href="/admin/queue" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Verification Queue</a>
          <a href="/admin/ledger" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Ledger</a>
          
          <div className="mt-4 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content & Logs</div>
          <a href="/admin/testimonials" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Testimonials</a>
          <a href="/admin/audit-log" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Audit Log</a>

          <a href="/" className="mt-8 rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">← Back to Site</a>
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
