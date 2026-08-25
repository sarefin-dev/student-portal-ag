'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Edit2, Check, X } from 'lucide-react';
import { updateModule } from './actions';

export function ModuleHeader({ module, courseId, guestInstructors }: { module: any, courseId: string, guestInstructors: any[] }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <form action={updateModule} className="flex items-center gap-2 flex-wrap" onSubmit={() => setIsEditing(false)}>
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="moduleId" value={module.id} />
        <span className="text-lg font-bold shrink-0">Module {module.position}:</span>
        <Input name="title" defaultValue={module.title} className="h-8 w-48 font-bold" required />
        <select 
          name="guestInstructorId" 
          defaultValue={module.guest_instructor_id || ''} 
          className="h-8 rounded-md border border-input bg-background px-2 text-sm max-w-[150px]"
        >
          <option value="">No Guest</option>
          {guestInstructors?.map((instructor: any) => (
            <option key={instructor.id} value={instructor.id}>
              {instructor.full_name}
            </option>
          ))}
        </select>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-success" type="submit">
          <Check className="h-4 w-4" />
          <span className="sr-only">Save Module</span>
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" type="button" onClick={() => setIsEditing(false)}>
          <X className="h-4 w-4" />
          <span className="sr-only">Cancel</span>
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h3 className="text-lg font-bold">Module {module.position}: {module.title}</h3>
      {module.guest_instructor_id && (
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <User className="w-3 h-3" />
          Guest: {module.profiles?.full_name || 'Unknown'}
        </Badge>
      )}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-2" 
        onClick={() => setIsEditing(true)}
      >
        <Edit2 className="h-3 w-3" />
        <span className="sr-only">Edit Module</span>
      </Button>
    </div>
  );
}
