'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { importCourseFromText } from './import-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function AiImportDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const syllabus = formData.get('syllabus') as string;
    
    const res = await importCourseFromText(syllabus);
    
    setIsSubmitting(false);
    
    if (res.success) {
      toast.success("Course successfully imported!");
      setOpen(false);
      router.push(`/admin/courses/${res.courseId}/builder`);
    } else {
      toast.error(res.error || "Failed to import course");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Import Course from Text
          </DialogTitle>
          <DialogDescription>
            Paste your course syllabus here. The AI will parse modules, submodules, lessons, and routines instantly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea 
            name="syllabus" 
            placeholder="# Course Title\n\n## Module 1\n### Submodule 1\n#### Lesson: Intro\nVideo: https://...\nText: ..." 
            className="min-h-[400px] font-mono text-sm"
            required
            disabled={isSubmitting}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Parsing Syllabus & Generating Database Records...
              </>
            ) : (
              "Generate Course"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
