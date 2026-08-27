import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, MessageCircle } from 'lucide-react';

import { Logo } from '@/components/ui/logo';

export default function HelpPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-950 text-white">
        <Logo href="/" size="sm" subtitle="Help & Support" variant="dark" />
        <Link href="/dashboard">
          <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800">Back to Dashboard</Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/20">
        <div className="max-w-md w-full bg-card border rounded-lg p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold mb-2">Need Help?</h1>
            <p className="text-muted-foreground">
              We're here to assist you with any questions or issues you might have.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <a href="mailto:support@arefinlab.com" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <Mail className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">support@arefinlab.com</p>
              </div>
            </a>

            <a href="#" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <MessageCircle className="w-5 h-5 text-success" />
              <div className="text-left">
                <p className="font-medium">WhatsApp Support</p>
                <p className="text-sm text-muted-foreground">+880 1700-000000</p>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
