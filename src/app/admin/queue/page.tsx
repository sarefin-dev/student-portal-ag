import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { approvePendingVerification, rejectPendingVerification } from './actions';
import { ApprovePaymentModal } from './approve-modal';
import { Check, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default async function VerificationQueuePage() {
  const supabase = await createClient();

  // Fetch all pending verifications
  const { data: pending, error: pendingErr } = await supabase
    .from('pending_verifications')
    .select('*, orders(total_amount, profiles(email, full_name))')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (pendingErr) console.error("Queue Error:", pendingErr);

  // Fetch recent unmatched received transactions
  const { data: received } = await supabase
    .from('received_transactions')
    .select('*')
    .is('consumed_by_pending_verification_id', null)
    .order('received_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verification Queue</h1>
        <p className="text-muted-foreground">Manually review ambiguous or mismatched payment submissions.</p>
      </div>

      {!pending || pending.length === 0 ? (
        <div className="rounded border bg-card p-12 text-center text-muted-foreground">
          <Check className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">Queue is clear!</h3>
          <p>No pending verification requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Pending Requests</h2>
            {pending.map(p => (
              <div key={p.id} className="border rounded-lg p-4 bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{p.orders?.profiles?.full_name || 'Unknown Student'}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{p.orders?.profiles?.email}</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Claimed Sender: <span className="font-mono text-foreground">{p.submitted_sender_msisdn}</span></p>
                    <p>Claimed TrxID: <span className="font-mono text-foreground">{p.submitted_trx_id}</span></p>
                    <p>Expected Order Amount: Tk {p.orders?.total_amount}</p>
                    <p>Submitted: {new Date(p.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <TooltipProvider>
                    <ApprovePaymentModal 
                      pendingId={p.id} 
                      shortfall={Number(p.orders?.total_amount || 0) - Number(p.submitted_amount || 0)} 
                    />
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10">
                              <X className="h-5 w-5" />
                              <span className="sr-only">Reject</span>
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Reject Payment</TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject Verification?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to reject this verification? This will deny the payment.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <form action={rejectPendingVerification}>
                            <input type="hidden" name="pendingId" value={p.id} />
                            <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Confirm Rejection
                            </AlertDialogAction>
                          </form>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Unmatched Incoming SMS</h2>
            <div className="rounded border bg-muted/30 p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {!received || received.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent unmatched messages.</p>
              ) : (
                received.map(r => (
                  <div key={r.id} className="bg-card border rounded p-3 text-sm space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="font-mono">{r.parsed_trx_id}</span>
                      <span>Tk {r.parsed_amount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.provider} • From {r.sender_msisdn}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.received_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">These are recent SMS messages that did not auto-match any pending requests. Use these to verify manual bank transfers or typos.</p>
          </div>
        </div>
      )}
    </div>
  );
}
