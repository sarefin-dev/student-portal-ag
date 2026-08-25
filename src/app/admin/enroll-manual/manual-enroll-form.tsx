'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { manualEnroll } from './actions';
import { UserPlus, Check, ChevronsUpDown, Table as TableIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function ManualEnrollForm({ courses }: { courses: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert("Please select a course");
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("courseId", selectedCourseId);
    const res = await manualEnroll(formData);
    setIsSubmitting(false);
    if (res.success) {
      alert("Successfully enrolled student!");
      e.currentTarget.reset();
      setSelectedCourseId('');
    } else {
      alert(res.error);
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> Enroll on Behalf
        </CardTitle>
        <CardDescription>Grant immediate course access without requiring payment.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Student Email</Label>
            <Input name="email" type="email" required placeholder="student@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Course</Label>
            <div className="flex gap-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">{selectedCourse ? selectedCourse.title : "Select a course..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search courses..." />
                    <CommandList>
                      <CommandEmpty>No course found.</CommandEmpty>
                      <CommandGroup heading="Popular Courses">
                        {courses.map((course) => (
                          <CommandItem
                            key={course.id}
                            value={course.title}
                            onSelect={() => {
                              setSelectedCourseId(course.id === selectedCourseId ? "" : course.id);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                selectedCourseId === course.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {course.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Browse courses in table" type="button">
                    <TableIcon className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Browse Courses</DialogTitle>
                    <DialogDescription>Find and select the course you want to enroll the student in.</DialogDescription>
                  </DialogHeader>
                  <div className="border rounded-md mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>
                              <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                                {course.status || 'draft'}
                              </Badge>
                            </TableCell>
                            <TableCell>{course.price > 0 ? `$${course.price}` : 'Free'}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="secondary" 
                                size="sm"
                                type="button"
                                onClick={() => {
                                  setSelectedCourseId(course.id);
                                  setDialogOpen(false);
                                }}
                              >
                                Select
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
          <Button type="submit" className="w-full" disabled={isSubmitting || !selectedCourseId}>
            {isSubmitting ? 'Enrolling...' : 'Grant Access'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
