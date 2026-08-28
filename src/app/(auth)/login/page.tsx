import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const error = params.error as string | undefined;
  const message = params.message as string | undefined;
  const tab = (params.tab as string) || 'signin';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background py-12 px-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Logo href="/" size="lg" subtitle="Student Portal" className="mb-1" />
          <p className="text-sm text-muted-foreground">Access your courses, routine, and learning materials</p>
        </div>

        <Tabs defaultValue={tab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Error / Success banner — shown on both tabs */}
          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <TabsContent value="signin" className="mt-4">
            <div className="rounded-lg border p-6 shadow-sm bg-card min-h-[320px] flex flex-col justify-center">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline" tabIndex={-1}>
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="signin-password" name="password" type="password" required autoComplete="current-password" />
                </div>
                <Button formAction={login} className="w-full mt-4">
                  Log in
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <div className="rounded-lg border p-6 shadow-sm bg-card flex flex-col justify-center">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" required placeholder="John Doe" autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Number</Label>
                  <Input id="phone" name="phone" required placeholder="+8801700000000" autoComplete="tel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" required autoComplete="new-password" />
                  <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
                </div>
                <Button formAction={signup} className="w-full mt-4">
                  Create Account
                </Button>
              </form>

              <div className="mt-5 flex items-start gap-2.5 rounded-md bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>A confirmation email will be sent to your inbox. Please verify your email before logging in.</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
