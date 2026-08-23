import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAdminPassword } from "./actions";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your administrator account security.</p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form action={updateAdminPassword} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input id="new_password" name="new_password" type="password" required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input id="confirm_password" name="confirm_password" type="password" required minLength={6} />
          </div>
          <Button type="submit">Update Password</Button>
        </form>
      </div>
    </div>
  );
}
