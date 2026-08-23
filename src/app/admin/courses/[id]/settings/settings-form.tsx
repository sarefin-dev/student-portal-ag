'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { updateCourseSettings } from './actions';
import Image from 'next/image';

export function CourseSettingsForm({ course }: { course: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url || '');

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
        <label className="text-sm font-medium">Description</label>
        <textarea name="description" defaultValue={course.description || ''} rows={4} className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm" />
      </div>

      {course.type === 'live_cohort' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
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
