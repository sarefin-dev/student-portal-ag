import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Mail, HelpCircle, ShieldCheck } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/20 py-12 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <Logo href="/" size="md" subtitle="Skill Development & Research" />
            <p className="text-sm text-muted-foreground max-w-sm">
              Empowering learners with cutting-edge cohort learning, structured curriculum, and verified certifications.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/courses" className="hover:text-foreground transition-colors">Courses & Cohorts</Link></li>
              <li><Link href="/resources" className="hover:text-foreground transition-colors">Digital Resources</Link></li>
              <li><Link href="/verify" className="hover:text-foreground transition-colors">Verify Certificate</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/help" className="hover:text-foreground transition-colors flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Help Center</Link></li>
              <li><a href="mailto:support@arefinlab.com" className="hover:text-foreground transition-colors flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> support@arefinlab.com</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ArefinLab. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Powered by ArefinLab Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
