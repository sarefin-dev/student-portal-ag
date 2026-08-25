'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { approvePendingVerification } from './actions';
import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

export function ApprovePaymentModal({ pendingId, shortfall }: { pendingId: string; shortfall: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [actionType, setActionType] = useState('forgive');
  const [dueDays, setDueDays] = useState('30');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData();
    formData.set('pendingId', pendingId);
    if (actionType === 'installment') {
      formData.set('createInstallment', 'true');
      formData.set('dueDays', dueDays);
    }
    
    try {
      await approvePendingVerification(formData);
      setOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    } finally {
      setIsPending(false);
    }
  };

  if (shortfall <= 0) {
    // If no shortfall, just standard submit without modal
    return (
      <form action={async (fd) => {
        setIsPending(true);
        await approvePendingVerification(fd);
        setIsPending(false);
      }}>
        <input type="hidden" name="pendingId" value={pendingId} />
        <Button variant="default" size="icon" className="bg-success hover:bg-success/90 text-success-foreground h-10 w-10" type="submit" disabled={isPending}>
          <Check className="h-5 w-5" />
          <span className="sr-only">Approve</span>
        </Button>
      </form>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="icon" className="bg-success hover:bg-success/90 text-success-foreground h-10 w-10" type="button" disabled={isPending}>
          <Check className="h-5 w-5" />
          <span className="sr-only">Approve</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Amount Mismatch Detected</DialogTitle>
            <DialogDescription>
              This payment is short by <strong>{shortfall} BDT</strong>. How do you want to handle the remaining balance?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <RadioGroup value={actionType} onValueChange={setActionType} className="space-y-4">
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="forgive" id="forgive" />
                <Label htmlFor="forgive" className="font-normal">
                  <strong className="block">Forgive remaining balance (Discount)</strong>
                  <span className="text-muted-foreground text-sm">Marks the order as completely paid. No future dues.</span>
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="installment" id="installment" />
                <Label htmlFor="installment" className="font-normal">
                  <strong className="block">Create a Due Installment</strong>
                  <span className="text-muted-foreground text-sm">Generates an automated reminder for the missing {shortfall} BDT.</span>
                </Label>
              </div>
            </RadioGroup>

            {actionType === 'installment' && (
              <div className="mt-4 ml-7 flex items-center gap-3">
                <Label htmlFor="dueDays">Due in</Label>
                <Input 
                  id="dueDays" 
                  type="number" 
                  min="1" 
                  value={dueDays} 
                  onChange={(e) => setDueDays(e.target.value)} 
                  className="w-20"
                />
                <span className="text-sm">days</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Approving...' : 'Approve Payment'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
