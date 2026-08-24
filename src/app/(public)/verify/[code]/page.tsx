import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CheckCircle, XCircle, Award, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*, profiles(full_name), courses(title)')
    .eq('verify_code', code)
    .single();

  if (error || !cert) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-muted/20 p-4">
        <Card className="max-w-md w-full text-center py-8">
          <CardContent className="flex flex-col items-center">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Invalid Certificate</h1>
            <p className="text-muted-foreground">
              We could not find a certificate matching the code <strong>{code}</strong>. Please ensure the URL is correct.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-muted/20 p-4">
      <Card className="max-w-xl w-full border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">Verified Authentic</CardTitle>
          <CardDescription>This certificate was officially issued by ArefinLab.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-background border">
              <Award className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Course Completed</p>
                <p className="text-lg font-semibold">{cert.courses?.title}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-background border">
              <User className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issued To</p>
                <p className="text-lg font-semibold">{cert.profiles?.full_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-background border">
              <Calendar className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Issue</p>
                <p className="text-lg font-semibold">{new Date(cert.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground font-mono">
                Verification Code: {cert.verify_code}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
