'use client';

import { useState } from 'react';
import { createLiveSession, deleteLiveSession, createRoutine, bulkGenerateLiveSessions } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LocalTime } from '@/components/local-time';
import { Calendar, Plus, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export function LiveSessionsManager({ id, sessions, routines }: { id: string, sessions: any[], routines: any[] }) {
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(routines[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const filteredSessions = sessions.filter(s => s.routine_id === selectedRoutineId);
  const selectedRoutine = routines.find(r => r.id === selectedRoutineId);

  const handleCreateRoutine = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const res = await createRoutine(id, name);
    if (res.success) {
      toast.success('Routine created successfully');
    } else {
      toast.error(res.error || 'Failed to create routine');
    }
  };

  const handleBulkGenerate = async (formData: FormData) => {
    setIsGenerating(true);
    const startDateStr = formData.get('start_date') as string;
    const duration = parseInt(formData.get('duration') as string, 10);
    const totalClasses = parseInt(formData.get('total_classes') as string, 10);
    const meetingUrl = formData.get('meeting_url') as string;
    
    const daysOfWeek: number[] = [];
    ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].forEach((day, index) => {
      if (formData.get(day) === 'on') daysOfWeek.push(index);
    });

    const res = await bulkGenerateLiveSessions(
      id,
      selectedRoutineId,
      startDateStr,
      daysOfWeek,
      duration,
      totalClasses,
      meetingUrl
    );

    setIsGenerating(false);
    if (res.success) {
      toast.success('Classes generated successfully');
    } else {
      toast.error(res.error || 'Failed to generate classes');
    }
  };

  const handleScheduleSingle = async (formData: FormData) => {
    const localDatetime = formData.get('scheduled_at') as string;
    const dateObj = new Date(localDatetime);
    
    const res = await bulkGenerateLiveSessions(
      id,
      selectedRoutineId,
      dateObj.toISOString(),
      [dateObj.getDay()],
      parseInt(formData.get('duration') as string, 10),
      1,
      formData.get('meeting_url') as string
    );
    if (res.success) toast.success('Class added');
  };

  return (
    <div className="space-y-8 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-semibold">Live Sessions & Routines</h1>
          <p className="text-muted-foreground">Manage schedules and batches for this course.</p>
        </div>
        <Link href={`/admin/courses/${id}/builder`}>
          <Button variant="outline">Back to Course</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
        <div className="flex items-center gap-4 flex-1">
          <Label className="text-base font-semibold">Current Routine / Batch:</Label>
          <div className="w-[300px]">
            <Select value={selectedRoutineId} onValueChange={setSelectedRoutineId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a routine" />
              </SelectTrigger>
              <SelectContent>
                {routines.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Plus className="w-4 h-4 mr-2" /> New Routine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Routine (Batch)</DialogTitle>
              <DialogDescription>e.g. "Spring 2026 - Sunday/Wednesday"</DialogDescription>
            </DialogHeader>
            <form action={handleCreateRoutine} className="space-y-4">
              <div className="space-y-2">
                <Label>Routine Name</Label>
                <Input name="name" required />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!selectedRoutineId ? (
        <div className="text-center p-12 border rounded-lg">
          <p className="text-muted-foreground">Select or create a routine to manage sessions.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
              <Badge variant="outline">{filteredSessions.length} Classes</Badge>
            </div>
            
            <div className="space-y-4">
              {filteredSessions?.map((session: any) => (
                <Card key={session.id}>
                  <CardContent className="p-4 flex flex-col gap-4">
                    <div>
                      <h3 className="font-medium text-lg">{session.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        <LocalTime isoString={session.scheduled_at} /> &bull; {session.duration_minutes} min
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <a href={session.meeting_url} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline font-medium break-all">
                        {session.meeting_url}
                      </a>
                      <div className="flex gap-2 mt-2">
                        <Link href={`/admin/courses/${id}/live/${session.id}`}>
                          <Button variant="secondary" size="sm">Attendance</Button>
                        </Link>
                        <Button variant="destructive" size="sm" onClick={async () => {
                          await deleteLiveSession(id, session.id);
                        }}>Delete</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredSessions?.length === 0 && (
                <div className="text-center p-8 border rounded-lg bg-muted/30">
                  <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No sessions scheduled.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bulk Generate</CardTitle>
                <CardDescription>Auto-schedule multiple classes on specific days.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleBulkGenerate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Start Date & Time</Label>
                    <Input type="datetime-local" name="start_date" required />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Days of Week</Label>
                    <div className="flex flex-wrap gap-4">
                      {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox id={day} name={day} value="on" />
                          <label htmlFor={day} className="text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {day.slice(0, 3)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Meeting Link (Zoom/Meet)</Label>
                    <Input type="url" name="meeting_url" placeholder="https://zoom.us/..." required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (min)</Label>
                      <Input type="number" name="duration" defaultValue={60} min={15} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Classes</Label>
                      <Input type="number" name="total_classes" defaultValue={18} min={1} required />
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-4" disabled={isGenerating}>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Classes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
