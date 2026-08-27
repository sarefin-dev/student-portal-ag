'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';
import { markLessonCompleteForCohort } from './actions';
import { toast } from 'sonner';

export function MarkCompleteButton({ courseId, lessonId, courseType }: { courseId: string, lessonId: string, courseType: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show this for live_cohort or in_person, or just live_cohort? The user specifically said "for workshop (live cohort)"
  if (courseType !== 'live_cohort') {
    return null;
  }

  const handleMarkComplete = async () => {
    if (!confirm('Are you sure you want to mark this lesson as completed for ALL currently enrolled students? This will give them a completion tick.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await markLessonCompleteForCohort(courseId, lessonId);
      toast.success("Lesson marked as complete for all students.");
    } catch (e: any) {
      toast.error(e.message || "Failed to mark lesson complete.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-7 text-xs text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
      onClick={handleMarkComplete}
      disabled={isSubmitting}
      title="Mark complete for all students"
    >
      <CheckSquare className="w-3 h-3 mr-1" />
      {isSubmitting ? "Marking..." : "Mark Complete for Cohort"}
    </Button>
  );
}
