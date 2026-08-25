import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <Select name="type" defaultValue="recorded" required>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select course type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recorded">Recorded Video</SelectItem>
              <SelectItem value="live_cohort">Live Cohort (Online)</SelectItem>
              <SelectItem value="in_person">In-Person (Classroom)</SelectItem>
              <SelectItem value="text_based">Text Based</SelectItem>
              <SelectItem value="mixed">Mixed Format</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full">Create Draft</Button>
      </form>
    </div>
  );
}
