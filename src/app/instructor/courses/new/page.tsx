import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCourse } from '../actions';

export default function NewCoursePage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Course</h1>
        <p className="text-muted-foreground">Set up the basics. You can add content later.</p>
      </div>

      <form action={createCourse} className="space-y-4 rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Course Title</Label>
          <Input id="title" name="title" required placeholder="e.g. Masterclass in React" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input id="slug" name="slug" required placeholder="e.g. react-masterclass" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Course Type</Label>
          <select 
            id="type" 
            name="type" 
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="recorded">Recorded Video</option>
            <option value="live_cohort">Live Cohort (Online)</option>
            <option value="in_person">In-Person (Classroom)</option>
            <option value="text_based">Text Based</option>
            <option value="mixed">Mixed Format</option>
          </select>
        </div>

        <Button type="submit" className="w-full">Create Draft</Button>
      </form>
    </div>
  );
}
