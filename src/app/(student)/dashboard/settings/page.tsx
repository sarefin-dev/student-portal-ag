import { updatePassword, updateInstructorProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, instructor_title, signature_url')
    .eq('id', user?.id)
    .single();

  const isInstructorOrAdmin = profile?.role === 'instructor' || profile?.role === 'admin';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and security.</p>
      </div>

      {isInstructorOrAdmin && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Instructor Profile</h2>
          <p className="text-sm text-muted-foreground mb-4">
            These details will appear on the certificates of students who complete your courses.
          </p>
          <form action={updateInstructorProfile} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="instructor_title">Professional Title</Label>
              <Input 
                id="instructor_title" 
                name="instructor_title" 
                placeholder="e.g. Senior Cloud Architect" 
                defaultValue={profile?.instructor_title || ''} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signature_image">Digital Signature (PNG/JPG)</Label>
              {profile?.signature_url && (
                <div className="mb-2 p-2 border rounded bg-muted/30">
                  <img src={profile.signature_url} alt="Current Signature" className="h-12 object-contain" />
                </div>
              )}
              <Input id="signature_image" name="signature_image" type="file" accept="image/png, image/jpeg" />
            </div>

            <Button type="submit">Save Profile</Button>
          </form>
        </div>
      )}

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form action={updatePassword} className="space-y-4 max-w-sm">
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
