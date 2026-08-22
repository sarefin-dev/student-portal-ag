import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { LocalTime } from '@/components/local-time';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch real counts
  const [
    { count: studentCount },
    { count: courseCount },
    { count: pendingVerifications },
    { data: recentOrders },
    { data: pendingQueue }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'active'),
    supabase.from('pending_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('total_amount').eq('status', 'completed').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('pending_verifications').select('*, orders(total_amount, profiles(full_name))').eq('status', 'pending').order('submitted_at', { ascending: false }).limit(5)
  ]);

  const monthlyRevenue = recentOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Overview</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">30-Day Revenue</p>
              <h3 className="text-2xl font-bold">৳ {monthlyRevenue.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              <h3 className="text-2xl font-bold">{studentCount || 0}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Courses</p>
              <h3 className="text-2xl font-bold">{courseCount || 0}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${pendingVerifications ? 'bg-warning/10' : 'bg-muted'}`}>
              <AlertCircle className={`w-6 h-6 ${pendingVerifications ? 'text-warning' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Verifications</p>
              <h3 className="text-2xl font-bold">{pendingVerifications || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Verification Queue</CardTitle>
            <Link href="/admin/queue" className="text-sm text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {pendingQueue && pendingQueue.length > 0 ? (
              <div className="space-y-4 mt-4">
                {pendingQueue.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold">{item.method.toUpperCase()} - {item.submitted_trx_id}</p>
                      <p className="text-xs text-muted-foreground">From: {item.orders?.profiles?.full_name || 'Student'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">৳ {item.submitted_amount}</p>
                      <p className="text-xs text-muted-foreground"><LocalTime isoString={item.submitted_at} /></p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Queue is empty. All caught up!
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 mt-4">
            <Link href="/admin/enroll-manual" className="block w-full p-3 rounded bg-muted/50 hover:bg-muted font-medium transition-colors">
              + Manually Enroll Student
            </Link>
            <Link href="/admin/coupons" className="block w-full p-3 rounded bg-muted/50 hover:bg-muted font-medium transition-colors">
              + Create Promo Code
            </Link>
            <Link href="/admin/testimonials" className="block w-full p-3 rounded bg-muted/50 hover:bg-muted font-medium transition-colors">
              Review Testimonials
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
