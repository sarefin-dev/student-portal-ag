'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { createCourse } from './actions';

export function CreateCourseDialog() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button size="icon" className="h-9 w-9">
                <Plus className="h-5 w-5" />
                <span className="sr-only">Create Course</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create Course</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>Set up the basics. You can add content later.</DialogDescription>
        </DialogHeader>

        <form action={createCourse} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Masterclass in React" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input id="slug" name="slug" required placeholder="e.g. react-masterclass" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Course Type</Label>
            <Select name="type" defaultValue="recorded" required>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select course type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recorded">Recorded Video</SelectItem>
                <SelectItem value="live_cohort">Live Cohort (Online)</SelectItem>
                <SelectItem value="in_person">In-Person (Classroom)</SelectItem>
                <SelectItem value="text_based">Text Based</SelectItem>
                <SelectItem value="mixed">Mixed Format</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">Create Draft</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
