'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updatePayoutPercentage } from './actions';
import { Percent, CheckCircle } from 'lucide-react';

export function PayoutForm({ instructorId, currentPayout }: { instructorId: string, currentPayout: number }) {
  const [payout, setPayout] = useState(currentPayout ? currentPayout.toString() : '0');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    
    try {
      const result = await updatePayoutPercentage(instructorId, parseFloat(payout));
      if (result?.error) {
        alert(result.error);
      } else {
        setSuccessMessage('Payout percentage updated successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update payout percentage');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-sm">
      <div className="flex flex-col space-y-2">
        <label htmlFor="payout" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Instructor Revenue Share (%)
        </label>
        <div className="relative">
          <Input 
            id="payout"
            type="number" 
            min="0" 
            max="100" 
            step="0.01" 
            value={payout}
            onChange={(e) => {
              let val = parseFloat(e.target.value);
              if (val > 100) val = 100;
              if (val < 0) val = 0;
              setPayout(isNaN(val) ? '' : val.toString());
            }}
            className="pl-8"
            required
          />
          <Percent className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <p className="text-xs text-muted-foreground">
          Platform fee will be calculated as {payout ? (100 - parseFloat(payout)).toFixed(2) : 100}%.
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
        {successMessage && (
          <span className="text-sm text-success flex items-center gap-1 animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            {successMessage}
          </span>
        )}
      </div>
    </form>
  );
}
