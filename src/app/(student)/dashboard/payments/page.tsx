import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default async function MyPaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, courses(title)), payments(*)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payments</h1>
        <p className="text-muted-foreground">View your order history, receipts, and payment status.</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="rounded border bg-card p-12 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">No payments yet</h3>
          <p>You haven't made any purchases.</p>
          <Button asChild className="mt-4">
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="rounded border bg-card overflow-hidden">
              <div className="bg-muted/50 p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">{order.id.split('-')[0]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-semibold">Tk {order.total_amount}</p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-success/10 text-success' :
                    order.status === 'pending' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Items</h4>
                  <ul className="text-sm space-y-1">
                    {order.order_items.map((item: any) => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.courses?.title || 'Unknown Item'}</span>
                        <span>Tk {item.unit_price_amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {order.payments && order.payments.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Transactions</h4>
                    <div className="space-y-2">
                      {order.payments.map((payment: any) => (
                        <div key={payment.id} className="text-xs flex justify-between bg-muted/30 p-2 rounded">
                          <span>{payment.method} • <span className="font-mono">{payment.trx_id}</span></span>
                          <span className="text-success font-medium">Tk {payment.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {order.status === 'pending' && (
                  <div className="pt-4 border-t flex justify-end">
                    <Button asChild size="sm">
                      <Link href={`/checkout?orderId=${order.id}&step=method`}>Complete Payment</Link>
                    </Button>
                  </div>
                )}
                
                {order.status === 'completed' && (
                  <div className="pt-4 border-t flex justify-end">
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/orders/${order.id}/receipt`} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        Download Receipt
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
