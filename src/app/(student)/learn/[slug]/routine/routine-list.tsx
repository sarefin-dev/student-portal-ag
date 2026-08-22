'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Video } from 'lucide-react';
import { LocalTime } from '@/components/local-time';

type Session = {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string;
  recording_video_id: string | null;
};

type Attendance = {
  live_session_id: string;
  present: boolean;
};

export function RoutineList({ sessions, attendanceList }: { sessions: Session[], attendanceList: Attendance[] }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update 'now' every minute to accurately lock/unlock meetings
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/30">
        <Calendar className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">No Live Sessions</h3>
        <p className="text-muted-foreground text-sm">Your instructor has not scheduled any live classes yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const sessionDate = new Date(session.scheduled_at);
        const isPast = sessionDate < now;
        const att = attendanceList.find(a => a.live_session_id === session.id);

        return (
          <Card key={session.id} className={`${isPast ? 'opacity-60 bg-muted/50' : ''}`}>
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">{session.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <LocalTime isoString={session.scheduled_at} formatStr="EEEE, MMMM d, yyyy" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <LocalTime isoString={session.scheduled_at} formatStr="p" />
                    <span>({session.duration_minutes} min)</span>
                  </div>
                </div>
                {att && (
                  <div className="text-sm font-medium mt-2">
                    Attendance:{' '}
                    {att.present ? (
                      <span className="text-success bg-success/10 px-2 py-0.5 rounded">Present</span>
                    ) : (
                      <span className="text-destructive bg-destructive/10 px-2 py-0.5 rounded">Absent</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex shrink-0">
                {!isPast || !session.recording_video_id ? (
                  <a href={session.meeting_url} target="_blank" rel="noreferrer" className="w-full">
                    <Button className="w-full gap-2" variant={isPast ? "secondary" : "default"}>
                      <Video className="w-4 h-4" />
                      Join Meeting
                    </Button>
                  </a>
                ) : (
                  <Button variant="secondary" className="w-full gap-2" disabled>
                    <Video className="w-4 h-4" />
                    Watch Recording
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
