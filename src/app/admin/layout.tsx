import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function AdminNavLinks() {
  return (
    <>
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
      
      <div className="mt-4 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settings & Logs</div>
      <a href="/admin/testimonials" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Testimonials</a>
      <a href="/admin/audit-log" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Audit Log</a>
      <a href="/admin/settings" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Admin Settings</a>

      <a href="/" className="mt-8 rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">← Back to Site</a>
    </>
  );
}

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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return redirect("/");
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden flex h-14 items-center justify-between border-b px-4 bg-sidebar w-full absolute top-0 z-10">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[264px] p-0 bg-sidebar text-sidebar-foreground border-sidebar-border overflow-y-auto">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
                <span className="font-semibold text-sidebar-primary">Admin Portal</span>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                <AdminNavLinks />
              </nav>
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sidebar-primary">Admin Portal</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[264px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-col flex-shrink-0">
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <span className="font-semibold text-sidebar-primary">Admin Portal</span>
          <ThemeToggle />
        </div>
        <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
          <AdminNavLinks />
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <form action={logout}>
            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}
