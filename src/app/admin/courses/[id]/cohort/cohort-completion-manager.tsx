'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, GraduationCap, Clock, Award, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { forceCompleteCohortEnrollment, toggleInstructorControlledCompletion } from './actions';

type Enrollment = {
  id: string;
  status: string;
  completion_percent: number;
  completed_at: string | null;
  enrolled_at: string;
  profiles: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
  certificate: { student_id: string; issued_at: string; verify_code: string } | null;
};

type Props = {
  courseId: string;
  courseTitle: string;
  instructorControlled: boolean;
  enrollments: Enrollment[];
};

export function CohortCompletionManager({ courseId, courseTitle, instructorControlled, enrollments }: Props) {
  const [isPending, startTransition] = useTransition();
  const [controlled, setControlled] = useState(instructorControlled);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(enrollments.filter((e) => e.completed_at).map((e) => e.id))
  );

  const completed = enrollments.filter((e) => completedIds.has(e.id));
  const pending = enrollments.filter((e) => !completedIds.has(e.id));

  function handleToggle(value: boolean) {
    setControlled(value);
    startTransition(async () => {
      const res = await toggleInstructorControlledCompletion(courseId, value);
      if (!res.success) {
        setControlled(!value);
        toast.error(res.error ?? 'Failed to update setting');
      } else {
        toast.success(value ? 'Cohort completion is now instructor-controlled' : 'Cohort switched to self-paced completion');
      }
    });
  }

  function handleComplete(enrollmentId: string, studentName: string) {
    startTransition(async () => {
      const res = await forceCompleteCohortEnrollment(enrollmentId, courseId);
      if (!res.success) {
        toast.error(res.error ?? 'Failed to mark completion');
      } else {
        setCompletedIds((prev) => new Set([...prev, enrollmentId]));
        toast.success(`${studentName} marked as complete — certificate issued`);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cohort Completion</h1>
        <p className="text-muted-foreground mt-1">{courseTitle}</p>
      </div>

      {/* Instructor-controlled toggle */}
      <div className="flex items-start gap-4 rounded-lg border bg-card p-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="instructor-controlled" className="text-sm font-medium">
            Instructor-controlled completion
          </Label>
          <p className="text-xs text-muted-foreground">
            When ON, students cannot self-complete via content progress. Only you can mark them as complete and issue certificates. Recommended for live cohorts where content is added progressively.
          </p>
        </div>
        <Switch
          id="instructor-controlled"
          checked={controlled}
          onCheckedChange={handleToggle}
          disabled={isPending}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Users className="h-4 w-4" />Enrolled</div>
          <p className="text-2xl font-bold">{enrollments.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Clock className="h-4 w-4" />In Progress</div>
          <p className="text-2xl font-bold">{pending.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Award className="h-4 w-4 text-green-500" />Completed</div>
          <p className="text-2xl font-bold text-green-600">{completed.length}</p>
        </div>
      </div>

      {/* Student table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Certificate</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No students enrolled yet.
                </TableCell>
              </TableRow>
            )}
            {enrollments.map((enr) => {
              const isCompleted = completedIds.has(enr.id);
              const hasCert = !!enr.certificate || isCompleted;
              return (
                <TableRow key={enr.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{enr.profiles?.full_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{enr.profiles?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(enr.enrolled_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${enr.completion_percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{enr.completion_percent}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {hasCert ? (
                      <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                        <Award className="h-3 w-3" /> Issued
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Not issued</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isCompleted ? (
                      <div className="flex items-center justify-end gap-1.5 text-green-600 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" /> Completed
                      </div>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1.5" disabled={isPending}>
                            <GraduationCap className="h-3.5 w-3.5" />
                            Mark Complete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mark {enr.profiles?.full_name} as complete?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will set their enrollment to 100% complete and automatically issue a certificate of completion. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleComplete(enr.id, enr.profiles?.full_name ?? 'Student')}
                            >
                              Yes, mark complete & issue certificate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
