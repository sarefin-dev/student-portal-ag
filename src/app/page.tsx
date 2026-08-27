import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PublicNavbar } from "@/components/public-navbar";
import { PublicFooter } from "@/components/public-footer";
import { Logo } from "@/components/ui/logo";
import { BookOpen, Sparkles, ShieldCheck, ArrowRight, Video, FileText } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      redirect("/admin");
    } else if (profile?.role === "instructor") {
      redirect("/instructor");
    } else {
      redirect("/dashboard");
    }
  }

  // Fetch featured courses
  const { data: featuredCourses } = await supabase
    .from("courses")
    .select("id, title, slug, price_amount, currency, type, thumbnail_url")
    .eq("status", "published")
    .limit(3);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-28 border-b bg-gradient-to-b from-background via-muted/20 to-background">
          <div className="max-w-[1100px] mx-auto px-4 md:px-8 flex flex-col items-center text-center space-y-8">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/40 text-xs font-medium text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Advanced Cohorts & Self-Paced Learning
            </div>

            <div className="flex flex-col items-center gap-4">
              <Logo size="xl" subtitle="Student Portal" showSubtitle={false} className="mb-2 scale-110" />
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl">
                Master Modern Skills with <span className="text-primary">ArefinLab</span>
              </h1>
            </div>

            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Interactive live cohort learning, hands-on lesson roadmaps, verified blockchain certificates, and AI-powered tutor assistance.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/courses">
                <Button size="lg" className="gap-2 px-8 shadow-md">
                  <BookOpen className="w-4 h-4" /> Explore Courses <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/resources">
                <Button variant="outline" size="lg" className="gap-2 px-6">
                  <FileText className="w-4 h-4" /> Free eBooks & Resources
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Courses Section */}
        {featuredCourses && featuredCourses.length > 0 && (
          <section className="py-16 max-w-[1200px] mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Featured Programs</h2>
                <p className="text-muted-foreground text-sm">Join ongoing cohorts and master in-demand industry skills</p>
              </div>
              <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
                View all courses →
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`} className="group">
                  <div className="border rounded-xl overflow-hidden bg-card transition-all hover:shadow-md h-full flex flex-col">
                    <div className="aspect-video bg-muted relative overflow-hidden flex items-center justify-center">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Video className="w-12 h-12 text-muted-foreground/40" />
                      )}
                      <span className="absolute top-3 right-3 bg-background/90 backdrop-blur text-xs font-semibold px-2.5 py-1 rounded-full uppercase">
                        {course.type?.replace('_', ' ') || 'Cohort'}
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                      <div className="mt-4 pt-3 border-t flex items-center justify-between">
                        <span className="font-semibold text-base">{course.price_amount ? `${course.price_amount} ${course.currency}` : 'Free'}</span>
                        <span className="text-xs text-primary font-medium flex items-center gap-1">Details <ArrowRight className="w-3.5 h-3.5" /></span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
