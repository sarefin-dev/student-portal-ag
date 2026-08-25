'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateQuestionsWithAI } from './ai-actions';
import { toast } from 'sonner';

export function AiGeneratorDialog({ courseId, assessmentId }: { courseId: string, assessmentId: string }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const topic = formData.get('topic') as string;
    const count = parseInt(formData.get('count') as string, 10);
    
    const res = await generateQuestionsWithAI(courseId, assessmentId, topic, count);
    
    setIsSubmitting(false);
    
    if (res.success) {
      toast.success("Questions successfully generated!");
      setOpen(false);
    } else {
      toast.error(res.error || "Failed to generate questions");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Generate Quiz Questions
          </DialogTitle>
          <DialogDescription>
            Enter a topic or paste a block of text, and the AI will generate multiple choice questions automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Topic or Source Text</Label>
            <Input name="topic" placeholder="e.g., React Server Components" required disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label>Number of Questions</Label>
            <Input type="number" name="count" defaultValue={5} min={1} max={20} required disabled={isSubmitting} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating & Saving...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
