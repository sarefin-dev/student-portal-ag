import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background py-12 px-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-primary">Student Portal</h1>
          <p className="text-muted-foreground">Access your courses and materials</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="mt-4">
            <div className="rounded-lg border p-6 shadow-sm bg-card min-h-[440px] flex flex-col justify-center">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" name="password" type="password" required />
                </div>
                <Button formAction={login} className="w-full mt-4">
                  Log in
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <div className="rounded-lg border p-6 shadow-sm bg-card min-h-[440px] flex flex-col justify-center">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" required placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Number</Label>
                  <Input id="phone" name="phone" required placeholder="+8801700000000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" required />
                </div>
                <Button formAction={signup} className="w-full mt-4">
                  Create Account
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
