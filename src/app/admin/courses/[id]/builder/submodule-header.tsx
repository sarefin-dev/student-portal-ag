'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Check, X } from 'lucide-react';
import { updateSubmodule } from './actions';

export function SubmoduleHeader({ submodule, courseId }: { submodule: any, courseId: string }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <form action={updateSubmodule} className="flex items-center gap-2 flex-wrap" onSubmit={() => setIsEditing(false)}>
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="submoduleId" value={submodule.id} />
        <span className="font-semibold text-primary shrink-0">Submodule {submodule.position}:</span>
        <Input name="title" defaultValue={submodule.title} className="h-7 w-40 text-sm font-semibold" required />
        <Button size="icon" variant="ghost" className="h-7 w-7 text-success" type="submit">
          <Check className="h-4 w-4" />
          <span className="sr-only">Save Submodule</span>
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" type="button" onClick={() => setIsEditing(false)}>
          <X className="h-4 w-4" />
          <span className="sr-only">Cancel</span>
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h4 className="font-semibold text-primary">Submodule {submodule.position}: {submodule.title}</h4>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" 
        onClick={() => setIsEditing(true)}
      >
        <Edit2 className="h-3 w-3" />
        <span className="sr-only">Edit Submodule</span>
      </Button>
    </div>
  );
}
