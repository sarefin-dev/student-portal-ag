'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { importModuleFromText, importSubmoduleFromText } from './import-actions';
import { toast } from 'sonner';

export function AiImportModuleDialog({ courseId, moduleId, moduleTitle }: { courseId: string, moduleId: string, moduleTitle: string }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const syllabus = formData.get('syllabus') as string;
    
    const res = await importModuleFromText(courseId, syllabus);
    
    setIsSubmitting(false);
    
    if (res.success) {
      toast.success("Module content successfully imported!");
      setOpen(false);
    } else {
      toast.error(res.error || "Failed to import module");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary">
          <Sparkles className="w-3 h-3" /> AI Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> AI Generate: {moduleTitle}
          </DialogTitle>
          <DialogDescription>
            Paste a text description or a bulleted list of topics for this module. AI will automatically create the submodules and lessons for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Textarea 
            name="syllabus" 
            placeholder={`e.g. 
- Introduction to the framework
- Basic Routing
- Advanced State Management`}
            className="min-h-[200px] font-mono text-sm"
            required
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Generate Submodules & Lessons"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AiImportSubmoduleDialog({ courseId, moduleId, submoduleTitle }: { courseId: string, moduleId: string, submoduleTitle: string }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const syllabus = formData.get('syllabus') as string;
    
    const res = await importSubmoduleFromText(courseId, moduleId, syllabus);
    
    setIsSubmitting(false);
    
    if (res.success) {
      toast.success("Lessons successfully imported!");
      setOpen(false);
    } else {
      toast.error(res.error || "Failed to import lessons");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-primary text-xs px-2">
          <Sparkles className="w-3 h-3" /> AI Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> AI Generate: {submoduleTitle}
          </DialogTitle>
          <DialogDescription>
            Paste the specific lessons or concepts you want to teach in this submodule. AI will convert them into discrete lessons.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Textarea 
            name="syllabus" 
            placeholder={`e.g. 
- Video: Setting up the environment
- Text: Configuration variables explained
- Quiz: Test your setup knowledge`}
            className="min-h-[150px] font-mono text-sm"
            required
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Generate Lessons"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
