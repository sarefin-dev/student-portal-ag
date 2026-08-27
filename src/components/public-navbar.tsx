import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { createClient } from '@/lib/supabase/server';
import { BookOpen, FileText, CheckCircle2, LayoutDashboard, LogIn } from 'lucide-react';

export async function PublicNavbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let dashboardHref = '/dashboard';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'admin') dashboardHref = '/admin';
    else if (profile?.role === 'instructor') dashboardHref = '/instructor';
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo href="/" size="md" subtitle="Learning Platform" />

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Courses
            </Link>
            <Link href="/resources" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> eBooks & Resources
            </Link>
            <Link href="/verify" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Verify Certificate
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {user ? (
            <Link href={dashboardHref}>
              <Button size="sm" className="gap-2">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <LogIn className="w-4 h-4" /> Sign In
                </Button>
              </Link>
              <Link href="/login" className="hidden sm:block">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
