import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAdminPassword, updateAIGateway } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { updateInstructorProfile } from "@/app/(student)/dashboard/settings/actions";
import { Sparkles } from "lucide-react";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, instructor_title, signature_url')
    .eq('id', user?.id)
    .single();

  const { data: aiSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'ai_gateway')
    .single();
    
  const currentGateway = aiSetting?.value || 'https://openrouter.ai/api/v1';

  const isInstructorOrAdmin = profile?.role === 'instructor' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin & Instructor Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account security and professional profile.</p>
      </div>

      {isAdmin && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-primary">AI Gateway Configuration</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Switch between Cloud AI providers. This affects the AI Quiz Generator, AI Chatbot, and Course Importer.
          </p>
          <form action={async (fd) => { "use server"; await updateAIGateway(fd); }} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="gatewayUrl">Gateway API URL</Label>
              <Input 
                id="gatewayUrl" 
                name="gatewayUrl" 
                placeholder="https://openrouter.ai/api/v1" 
                defaultValue={currentGateway} 
                required 
              />
              <p className="text-xs text-muted-foreground">
                Examples:<br/>
                • OpenRouter: <code>https://openrouter.ai/api/v1</code><br/>
                • AgentRouter: <code>https://agentrouter.org/v1</code>
              </p>
            </div>
            
            <Button type="submit" variant="default">Save AI Config</Button>
          </form>
        </div>
      )}

      {isInstructorOrAdmin && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Instructor Profile</h2>
          <p className="text-sm text-muted-foreground mb-4">
            These details will appear on the certificates of students who complete courses assigned to you.
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
        <form action={async (fd) => { "use server"; await updateAdminPassword(fd); }} className="space-y-4 max-w-sm">
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
