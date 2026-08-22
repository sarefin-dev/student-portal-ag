'use client';

import { createLiveSession, deleteLiveSession } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalTime } from '@/components/local-time';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

export function LiveSessionsManager({ id, sessions }: { id: string, sessions: any[] }) {
  
  const handleSchedule = async (formData: FormData) => {
    const localDatetime = formData.get('scheduled_at') as string;
    // <input type="datetime-local"> gives us YYYY-MM-DDTHH:mm
    // Constructing a new Date from it in the browser automatically attaches the browser's local timezone offset
    const dateObj = new Date(localDatetime);
    
    await createLiveSession(
      id,
      formData.get('title') as string,
      dateObj.toISOString(), // Send absolute UTC to server
      parseInt(formData.get('duration') as string, 10),
      formData.get('meeting_url') as string
    );
  };

  return (
    <div className="space-y-8 max-w-[720px] mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-3xl font-semibold">Live Sessions</h1>
        <Link href={`/admin/courses/${id}/builder`}>
          <Button variant="outline">Back to Course</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
          <div className="space-y-4">
            {sessions?.map((session: any) => (
              <Card key={session.id}>
                <CardContent className="p-4 flex flex-col gap-4">
                  <div>
                    <h3 className="font-medium text-lg">{session.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4" />
                      <LocalTime isoString={session.scheduled_at} /> • {session.duration_minutes} min
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
            {sessions?.length === 0 && (
              <div className="text-center p-8 border rounded-lg bg-muted/30">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <h3 className="text-lg font-medium mb-1">No live sessions</h3>
                <p className="text-sm text-muted-foreground">Schedule your first class using the form.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Schedule New Session</h2>
          <Card>
            <CardContent className="p-6">
              <form action={handleSchedule} className="space-y-4">
                <div className="space-y-2">
                  <Label>Session Title</Label>
                  <Input name="title" required placeholder="e.g. Q&A Week 1" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date & Time (Local)</Label>
                    <Input name="scheduled_at" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input name="duration" type="number" defaultValue="60" required min="15" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Meeting URL (Zoom/Meet)</Label>
                  <Input name="meeting_url" type="url" required placeholder="https://zoom.us/j/..." />
                </div>

                <Button type="submit" className="w-full">Schedule Session</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
