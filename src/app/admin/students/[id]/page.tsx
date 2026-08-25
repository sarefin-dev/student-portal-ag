import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect, notFound } from 'next/navigation';
import { env } from '@/env';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ArrowLeft, User, BookOpen, CreditCard, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const supabaseAdmin = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Fetch student profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!profile) return notFound();

  // Fetch enrollments (courses)
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('*, courses(title)')
    .eq('student_id', id)
    .order('created_at', { ascending: false });

  // Fetch payments (ledger)
  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('*, orders!inner(id, student_id)')
    .eq('orders.student_id', id)
    .order('created_at', { ascending: false });

  // Fetch certificates
  const { data: certificates } = await supabaseAdmin
    .from('certificates')
    .select('id, course_id')
    .eq('student_id', id);
  const certMap = new Map(certificates?.map((c: any) => [c.course_id, c.id]) || []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/students"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
          <p className="text-muted-foreground">Detailed view of student activity and records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Full Name</div>
              <div className="font-medium text-lg">{profile.full_name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div>{profile.email || <span className="text-muted-foreground italic">N/A</span>}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phone (WhatsApp)</div>
              <div>{profile.phone || <span className="text-muted-foreground italic">N/A</span>}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant={profile.status === 'suspended' ? 'destructive' : 'default'} className="mt-1">
                {profile.status === 'suspended' ? 'Suspended' : 'Active'}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Joined</div>
              <div>{format(new Date(profile.created_at), 'PPP')}</div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Course Enrollments</CardTitle>
              <CardDescription>Courses this student has access to.</CardDescription>
            </CardHeader>
            <CardContent>
              {!enrollments?.length ? (
                <p className="text-sm text-muted-foreground">No course enrollments found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Certificate</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enr: any) => (
                      <TableRow key={enr.id}>
                        <TableCell className="font-medium">{enr.courses?.title || 'Unknown Course'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${enr.completion_percent || 0}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{enr.completion_percent || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {enr.completion_percent === 100 && certMap.has(enr.course_id) ? (
                            <Button variant="outline" size="sm" className="h-8 gap-1" asChild>
                              <a href={`/api/certificates/${certMap.get(enr.course_id)}/download`} target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3" />
                                PDF
                              </a>
                            </Button>
                          ) : enr.completion_percent === 100 ? (
                            <span className="text-xs text-muted-foreground italic">Generating...</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="outline">{enr.source}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={enr.status === 'banned' ? 'destructive' : 'default'}>
                            {enr.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(enr.created_at), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Payments / Ledger */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment Ledger</CardTitle>
              <CardDescription>Financial transactions for this student.</CardDescription>
            </CardHeader>
            <CardContent>
              {!payments?.length ? (
                <p className="text-sm text-muted-foreground">No payments recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trx ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((pay: any) => (
                      <TableRow key={pay.id}>
                        <TableCell className="font-medium">{pay.trx_id || 'N/A'}</TableCell>
                        <TableCell>৳ {pay.amount.toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{pay.method.replace('_', ' ')}</TableCell>
                        <TableCell className="text-sm">{format(new Date(pay.created_at), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
