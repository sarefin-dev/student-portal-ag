import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4 font-semibold text-primary">Admin Portal</header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
