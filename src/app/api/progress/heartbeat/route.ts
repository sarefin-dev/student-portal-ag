import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { blockId, positionSeconds, totalSeconds } = await req.json();

    if (!blockId || typeof positionSeconds !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const watchedPercent = totalSeconds > 0 ? (positionSeconds / totalSeconds) * 100 : 0;
    
    // Mark as completed if they watched 90%+ of the video
    const status = watchedPercent >= 90 ? 'completed' : 'in_progress';

    // Upsert the block_progress
    const { error } = await supabase
      .from('block_progress')
      .upsert({
        student_id: user.id,
        content_block_id: blockId,
        video_position_seconds: Math.floor(positionSeconds),
        video_watched_percent: watchedPercent,
        status: status,
        last_interacted_at: new Date().toISOString(),
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
      }, {
        onConflict: 'student_id, content_block_id'
      });

    if (error) {
      console.error('Heartbeat error:', error);
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
