'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { manualEnroll } from './manual-actions';
import { UserPlus, Check, ChevronsUpDown, Table as TableIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function ManualEnrollDialog({ courses }: { courses: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [courseTableOpen, setCourseTableOpen] = useState(false);
  const [mainDialogOpen, setMainDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData(form);
    formData.set("courseId", selectedCourseId);
    const res = await manualEnroll(formData);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Successfully enrolled student!");
      form.reset();
      setSelectedCourseId('');
      setMainDialogOpen(false);
    } else {
      toast.error(res.error);
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <Dialog open={mainDialogOpen} onOpenChange={setMainDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Manual Enrollment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Enroll on Behalf
          </DialogTitle>
          <DialogDescription>Grant immediate course access without requiring payment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Student Email</Label>
            <Input name="email" type="email" required placeholder="student@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Course</Label>
            <div className="flex gap-2">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedCourseId
                      ? <span className="truncate">{selectedCourse?.title}</span>
                      : "Search popular courses..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search popular courses..." />
                    <CommandList>
                      <CommandEmpty>No course found.</CommandEmpty>
                      <CommandGroup>
                        {courses.slice(0, 10).map((course) => (
                          <CommandItem
                            key={course.id}
                            value={course.title}
                            onSelect={() => {
                              setSelectedCourseId(course.id);
                              setPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCourseId === course.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{course.title}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Dialog open={courseTableOpen} onOpenChange={setCourseTableOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="icon" type="button" className="shrink-0" title="Browse full catalog">
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Browse Course Catalog</DialogTitle>
                    <DialogDescription>Select any course to manually enroll this student.</DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>
                              <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                                {course.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{course.price_amount} {course.currency}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant={selectedCourseId === course.id ? "default" : "outline"}
                                type="button"
                                onClick={() => {
                                  setSelectedCourseId(course.id);
                                  setCourseTableOpen(false);
                                }}
                              >
                                {selectedCourseId === course.id ? 'Selected' : 'Select'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
