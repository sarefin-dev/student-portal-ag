"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CreditCard,
  MessageSquare,
  Settings,
  Compass,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { label: "My Courses", href: "/dashboard", icon: BookOpen },
  { label: "My Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Testimonials", href: "/dashboard/testimonials", icon: MessageSquare },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Course Catalog", href: "/courses", icon: Compass },
];

export function StudentSidebar({ logoutAction }: { logoutAction: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const NavContent = () => (
    <>
      <div className="mb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors mb-0.5",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </>
  );

  return (
    <>
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
              <nav className="flex flex-col gap-1 p-4 flex-1 h-[calc(100vh-8rem)]">
                <NavContent />
              </nav>
              <div className="p-4 border-t border-sidebar-border">
                <form action={logoutAction}>
                  <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
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
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 z-20 shrink-0",
          collapsed ? "w-[60px]" : "w-[264px]"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && <span className="font-semibold text-sidebar-primary truncate">Student Portal</span>}
          <div className={cn("flex items-center gap-1", collapsed && "mx-auto")}>
            {!collapsed && <ThemeToggle />}
            {!collapsed && <NotificationBell />}
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-4 flex-1">
          <NavContent />
        </nav>

        <div className="p-4 border-t border-sidebar-border flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("text-sidebar-foreground/50 hover:text-sidebar-foreground", collapsed && "mx-auto px-2")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
          </Button>

          <form action={logoutAction}>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-md py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                collapsed ? "justify-center px-0" : "px-3"
              )}
              title={collapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
