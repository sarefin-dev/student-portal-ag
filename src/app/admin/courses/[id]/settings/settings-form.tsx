'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { updateCourseSettings } from './actions';
import Image from 'next/image';

export function CourseSettingsForm({ 
  course, 
  instructors, 
  assignedInstructorId 
}: { 
  course: any, 
  instructors: any[], 
  assignedInstructorId: string 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url || '');
  const [currentType, setCurrentType] = useState(course.type || 'recorded');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const supabase = createClient();
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${course.id}-${Date.now()}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('public_media')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('public_media')
        .getPublicUrl(filePath);

      setThumbnailUrl(publicUrlData.publicUrl);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form action={updateCourseSettings} className="space-y-4">
      <input type="hidden" name="courseId" value={course.id} />
      <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />

      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <input name="title" defaultValue={course.title} required className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Lead Instructor (Certificate Signer)</label>
        <select 
          name="instructorId" 
          defaultValue={assignedInstructorId} 
          className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">-- No Lead Instructor (ArefinLab Team) --</option>
          {instructors?.map(inst => (
            <option key={inst.id} value={inst.id}>{inst.full_name} ({inst.email})</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">The assigned instructor's name will appear on student certificates.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Course Type</label>
        <Select name="type" value={currentType} onValueChange={setCurrentType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select course type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recorded">Recorded Video</SelectItem>
            <SelectItem value="live_cohort">Live Cohort (Online)</SelectItem>
            <SelectItem value="in_person">In-Person (Classroom)</SelectItem>
            <SelectItem value="text_based">Text Based</SelectItem>
            <SelectItem value="mixed">Mixed Format</SelectItem>
            <SelectItem value="ebook">E-Book</SelectItem>
            <SelectItem value="digital_download">Digital Download</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea name="description" defaultValue={course.description || ''} rows={4} className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Course Outcomes (One per line)</label>
        <textarea 
          name="outcomes" 
          defaultValue={course.outcomes?.join('\n') || ''} 
          rows={4} 
          className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm" 
          placeholder="Understand the fundamentals of React..."
        />
      </div>

      <div className="space-y-2 bg-muted/50 p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">AI Certificate Summary</label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={async (e) => {
              const btn = e.currentTarget;
              const form = btn.closest('form');
              if (!form) return;
              
              const title = (form.elements.namedItem('title') as HTMLInputElement).value;
              const outcomes = (form.elements.namedItem('outcomes') as HTMLTextAreaElement).value;
              
              if (!title || !outcomes) {
                alert('Title and Outcomes are required to generate a summary.');
                return;
              }

              btn.disabled = true;
              const oldText = btn.innerText;
              btn.innerText = 'Generating...';
              
              try {
                const { generateAiSummary } = await import('./actions');
                const res = await generateAiSummary(title, outcomes);
                if (res.summary) {
                  (form.elements.namedItem('ai_summary') as HTMLTextAreaElement).value = res.summary;
                } else {
                  alert(res.error || 'Failed to generate');
                }
              } finally {
                btn.disabled = false;
                btn.innerText = oldText;
              }
            }}
          >
            Auto-Generate with AI
          </Button>
        </div>
        <textarea 
          name="ai_summary" 
          defaultValue={course.ai_summary || ''} 
          rows={2} 
          className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm" 
          placeholder="e.g. Covering advanced topics such as React Server Components..."
        />
        <p className="text-xs text-muted-foreground">This 1-sentence summary is printed on the student's PDF certificate.</p>
      </div>

      {['live_cohort', 'in_person'].includes(currentType) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cohort Duration (e.g. 4 Weeks)</label>
            <input 
              type="text" 
              name="duration" 
              defaultValue={course.duration || ''} 
              placeholder="e.g. 4 Weeks, 3 Days, 2 Months"
              className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm mb-4" 
            />
            <label className="text-sm font-medium">Cohort Start Date (Optional)</label>
            <input 
              type="datetime-local" 
              name="start_date" 
              defaultValue={course.start_date ? new Date(course.start_date).toISOString().slice(0,16) : ''} 
              className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Enrollment Cutoff Date (Optional)</label>
            <input 
              type="datetime-local" 
              name="enrollment_cutoff_date" 
              defaultValue={course.enrollment_cutoff_date ? new Date(course.enrollment_cutoff_date).toISOString().slice(0,16) : ''} 
              className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" 
            />
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t">
        <label className="text-sm font-medium block">Course Thumbnail</label>
        
        {thumbnailUrl && (
          <div className="relative w-[320px] h-[180px] rounded border overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailUrl} alt="Thumbnail preview" className="object-cover w-full h-full" />
          </div>
        )}

        <div>
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            onChange={handleUpload}
            disabled={isUploading}
            className="flex w-full max-w-sm rounded border bg-background px-3 py-2 text-sm"
          />
          {isUploading && <p className="text-xs text-muted-foreground mt-2">Uploading image...</p>}
        </div>
      </div>

      <div className="pt-6">
        <Button type="submit" disabled={isUploading} className="w-full">Save Changes</Button>
      </div>
    </form>
  );
}






