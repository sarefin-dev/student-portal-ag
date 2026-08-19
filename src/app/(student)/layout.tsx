import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4 font-semibold text-primary">Student Dashboard</header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
