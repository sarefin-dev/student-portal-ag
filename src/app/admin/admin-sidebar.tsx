"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Package,
  Tag,
  Users,
  UserPlus,
  ListChecks, DollarSign,
  FileSpreadsheet,
  MessageSquare,
  ScrollText,
  Settings,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";

const baseAdminNavGroups = [
  {
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Courses", href: "/admin/courses", icon: BookOpen },
      { label: "Resources", href: "/admin/resources", icon: FileText },
      { label: "Products (SKUs)", href: "/admin/products", icon: Package },
      { label: "Services", href: "/admin/services", icon: Briefcase },
      { label: "Coupons", href: "/admin/coupons", icon: Tag },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Leads (CRM)", href: "/admin/leads", icon: Users },
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Instructors/Staff Member", href: "/admin/instructors", icon: Users },
      { label: "Enrollments", href: "/admin/enrollments", icon: BookOpen },
      { label: "Verification Queue", href: "/admin/queue", icon: ListChecks },{ label: "Instructor Payouts", href: "/admin/payouts", icon: DollarSign },
      { label: "Ledger", href: "/admin/ledger", icon: FileSpreadsheet }, // Restricted
    ],
  },
  {
    title: "Settings & Logs",
    items: [
      { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquare },
      { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText }, // Restricted
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

const instructorNavGroups = [
  {
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Courses", href: "/admin/courses", icon: BookOpen },
      { label: "Resources", href: "/admin/resources", icon: FileText },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquare },
      { label: "Instructor Profile", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar({ logoutAction, role, isSuperAdmin }: { logoutAction: () => void; role?: string; isSuperAdmin?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Filter restricted items for non-superadmins
  const adminNavGroups = baseAdminNavGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!isSuperAdmin && (item.label === "Ledger" || item.label === "Audit Log")) {
        return false;
      }
      return true;
    })
  }));

  const navGroups = role === 'instructor' ? instructorNavGroups : adminNavGroups;

  const NavContent = () => (
    <>
      {navGroups.map((group, i) => (
        <div key={i} className="mb-1">
          {group.title && (
            <div
              className={cn(
                "mb-1 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider transition-all",
                collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
              )}
            >
              {group.title}
            </div>
          )}
          {group.items.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-1 text-sm font-medium transition-colors",
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
      ))}
      <div className="mt-2 border-t border-sidebar-border pt-2">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-md px-2 py-1 text-sm font-medium transition-colors text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Back to Site" : undefined}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Back to Site</span>}
        </Link>
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
            <SheetContent side="left" className="w-[264px] p-0 bg-sidebar text-sidebar-foreground border-sidebar-border overflow-y-auto">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
                <Logo href="/admin" size="sm" subtitle="Admin Portal" />
              </div>
              <nav className="flex flex-col p-2">
                <NavContent />
              </nav>
            </SheetContent>
          </Sheet>
          <Logo href="/admin" size="sm" subtitle="Admin Portal" />
        </div>
        <ThemeToggle />
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-shrink-0 transition-all duration-300",
          collapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
          <Logo href="/admin" size="sm" subtitle="Admin Portal" collapsed={collapsed} />
          <div className={cn("flex items-center gap-1", collapsed && "mx-auto flex-col")}>
            {!collapsed && <ThemeToggle />}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <nav className="flex flex-col flex-1 overflow-y-auto p-2 scrollbar-thin">
          <NavContent />
        </nav>
        
        <div className="p-2 border-t border-sidebar-border">
          <form action={logoutAction}>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                collapsed && "justify-center px-0"
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
