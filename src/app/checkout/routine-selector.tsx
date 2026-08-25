'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function RoutineSelector({ routines }: { routines: any[] }) {
  if (!routines || routines.length === 0) return null;

  return (
    <div className="space-y-2 mt-4 pt-4 border-t">
      <Label>Select Batch / Routine <span className="text-destructive">*</span></Label>
      <Select name="routineId" required defaultValue={routines[0].id}>
        <SelectTrigger>
          <SelectValue placeholder="Select a batch" />
        </SelectTrigger>
        <SelectContent>
          {routines.map(r => (
            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">You must pick a schedule for live classes.</p>
    </div>
  );
}
