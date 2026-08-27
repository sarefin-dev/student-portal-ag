'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Search, Award } from 'lucide-react';

export default function VerifyLookupPage() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 md:p-8 bg-muted/20">
      <Card className="max-w-lg w-full border shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-primary/10 p-3.5 rounded-full w-fit mb-3">
            <ShieldCheck className="h-9 w-9 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Certificate Verification</CardTitle>
          <CardDescription>
            Validate the authenticity of official ArefinLab course completion certificates and digital credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="cert-code" className="text-sm font-medium text-foreground">
                Enter Verification Code / Certificate ID
              </label>
              <div className="relative">
                <Input
                  id="cert-code"
                  type="text"
                  placeholder="e.g. AL-2026-XXXXX or Verification Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11 uppercase font-mono tracking-wider text-base pr-10"
                  required
                />
                <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5" />
              </div>
              <p className="text-xs text-muted-foreground">
                The verification code can be found at the bottom of the issued certificate or in your student portal dashboard.
              </p>
            </div>

            <Button type="submit" className="w-full h-11 text-base gap-2 font-medium" disabled={!code.trim()}>
              <Award className="w-4 h-4" /> Verify Certificate
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t text-xs text-muted-foreground space-y-2 text-center">
            <p className="font-semibold text-foreground/80">Why verify with ArefinLab?</p>
            <p>
              Every ArefinLab certificate is recorded on a tamper-proof digital ledger with immutable verification codes, guaranteeing credential legitimacy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
