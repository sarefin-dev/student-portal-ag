import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { LogOut, Menu } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function NavLinks() {
  return (
    <>
      <a href="/dashboard" className="rounded px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">My Courses</a>
      <a href="/dashboard/payments" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">My Payments</a>
      <a href="/dashboard/testimonials" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Testimonials</a>
      <a href="/courses" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100 mt-4">Course Catalog</a>
    </>
  );
}

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
    <div className="flex min-h-[100dvh] flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="w-5 h-5 text-sidebar-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[264px] p-0 flex flex-col bg-sidebar text-sidebar-foreground border-r-sidebar-border">
              <div className="flex h-14 items-center border-b border-sidebar-border px-4">
                <SheetTitle className="font-semibold text-sidebar-primary">Student Portal</SheetTitle>
              </div>
              <nav className="flex flex-col gap-1 p-4 flex-1">
                <NavLinks />
              </nav>
              <div className="p-4 border-t border-sidebar-border mt-auto">
                <form action={logout}>
                  <button type="submit" className="flex items-center w-full gap-2 rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100 text-destructive">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sidebar-primary">Student Portal</span>
        </div>
        <NotificationBell />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[264px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-col flex-shrink-0">
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <span className="font-semibold text-sidebar-primary">Student Portal</span>
          <NotificationBell />
        </div>
        <nav className="flex flex-col gap-1 p-4 flex-1">
          <NavLinks />
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

      <main className="flex-1 bg-background p-4 md:p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
