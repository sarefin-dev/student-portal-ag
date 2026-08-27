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
  ListChecks,
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

const instructorNavGroups = [
  {
    items: [
      { label: "Overview", href: "/instructor", icon: LayoutDashboard },
      { label: "Courses", href: "/instructor/courses", icon: BookOpen },
      { label: "Resources", href: "/instructor/resources", icon: FileText },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Testimonials", href: "/instructor/testimonials", icon: MessageSquare },
      { label: "Instructor Profile", href: "/instructor/settings", icon: Settings },
    ],
  },
];

export function InstructorSidebar({ logoutAction }: { logoutAction: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const NavContent = () => (
    <>
      {instructorNavGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="mb-4">
          {!collapsed && group.title && (
            <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
          )}
          {group.items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/instructor' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors mb-0.5",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" 
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
      <div className="mt-auto border-t border-sidebar-border pt-2">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
                <Logo href="/instructor" size="sm" subtitle="Instructor Portal" />
              </div>
              <nav className="flex flex-col p-2">
                <NavContent />
              </nav>
            </SheetContent>
          </Sheet>
          <Logo href="/instructor" size="sm" subtitle="Instructor Portal" />
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
          <Logo href="/instructor" size="sm" subtitle="Instructor Portal" collapsed={collapsed} />
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
