import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
          ArefinLab Student Portal
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Welcome to the new learning experience. Access your courses, track your progress, and join live sessions all in one place.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
