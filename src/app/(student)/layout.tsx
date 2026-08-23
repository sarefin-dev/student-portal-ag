import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { LogOut, Menu } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function NavLinks() {
  return (
    <>
      <a href="/dashboard" className="rounded px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">My Courses</a>
      <a href="/dashboard/payments" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">My Payments</a>
      <a href="/dashboard/testimonials" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Testimonials</a>
      <a href="/dashboard/settings" className="rounded px-3 py-2 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:opacity-100">Settings</a>
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
    redirect("/login");
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
            <SheetContent side="left" className="w-[264px] p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
                <span className="font-semibold text-sidebar-primary">Student Portal</span>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sidebar-primary">Student Portal</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[264px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-col flex-shrink-0">
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <span className="font-semibold text-sidebar-primary">Student Portal</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-4 flex-1">
          <NavLinks />
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

      <main className="flex-1 bg-background p-4 md:p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
