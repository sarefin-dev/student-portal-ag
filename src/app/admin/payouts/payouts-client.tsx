'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generatePayoutsAction, markAsPaidAction } from './actions';
import { DollarSign, CheckCircle2, RotateCw } from 'lucide-react';
import { SubmitButton } from '@/components/ui/submit-button';

export function PayoutsClient({ payouts }: { payouts: any[] }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generatePayoutsAction();
      if (res.error) alert(res.error);
      else alert(`Generated ${res.count} new payouts.`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleGenerate} disabled={isGenerating}>
          <RotateCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          Calculate New Payouts
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instructor</TableHead>
              <TableHead>Period End</TableHead>
              <TableHead>Amount (BDT)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Preferred Method</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No payouts found. Click Calculate to generate pending payouts.
                </TableCell>
              </TableRow>
            )}
            {payouts.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.profiles?.full_name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">{p.profiles?.email}</div>
                </TableCell>
                <TableCell>{new Date(p.period_end).toLocaleDateString()}</TableCell>
                <TableCell className="font-bold text-primary">৳{p.amount}</TableCell>
                <TableCell>
                  {p.status === 'paid' ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 capitalize">
                      {p.status}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 capitalize">
                      {p.status}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="capitalize text-sm font-medium">{p.profiles?.payout_method || 'None'}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.profiles?.payout_method === 'bkash' && p.profiles.payout_bkash}
                    {p.profiles?.payout_method === 'nagad' && p.profiles.payout_nagad}
                    {p.profiles?.payout_method === 'bank' && p.profiles.payout_bank}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {p.status === 'pending' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <DollarSign className="w-4 h-4 mr-1" /> Mark Paid
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Mark Payout as Paid</DialogTitle>
                        </DialogHeader>
                        <form action={async (fd) => {
                            const res = await markAsPaidAction(fd);
                            if (res.error) alert(res.error);
                          }} className="space-y-4 pt-4">
                          <input type="hidden" name="payout_id" value={p.id} />
                          
                          <div className="space-y-2">
                            <Label>Payment Method Used</Label>
                            <Select name="method" defaultValue={p.profiles?.payout_method || 'manual'}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bkash">bKash</SelectItem>
                                <SelectItem value="nagad">Nagad</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="manual">Cash / Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Transaction ID / Reference (Optional)</Label>
                            <Input name="trx_id" placeholder="e.g. 9X2B... or Bank Ref" />
                          </div>

                          <SubmitButton className="w-full">Confirm Payment</SubmitButton>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
