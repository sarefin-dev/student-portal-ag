'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createBundle, deleteBundle } from './actions';
import { Package, Trash2, Calendar, Link as LinkIcon } from 'lucide-react';
import { LocalTime } from '@/components/local-time';

export function BundleManager({ bundles, courses }: { bundles: any[], courses: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedCourses.length === 0) {
      alert("Please select at least one course for the bundle.");
      return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const compareAtPriceRaw = formData.get('compare_at_price');
    
    const res = await createBundle(
      formData.get('title') as string,
      formData.get('description') as string,
      parseFloat(formData.get('price_amount') as string),
      compareAtPriceRaw ? parseFloat(compareAtPriceRaw as string) : null,
      (formData.get('available_from') as string) ? new Date(formData.get('available_from') as string).toISOString() : null,
      (formData.get('available_until') as string) ? new Date(formData.get('available_until') as string).toISOString() : null,
      selectedCourses
    );
    
    setIsSubmitting(false);
    if (res.success) {
      e.currentTarget.reset();
      setSelectedCourses([]);
    } else {
      alert(res.error);
    }
  };

  const toggleCourse = (id: string) => {
    if (selectedCourses.includes(id)) {
      setSelectedCourses(prev => prev.filter(c => c !== id));
    } else {
      setSelectedCourses(prev => [...prev, id]);
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-4">
        {bundles.map(bundle => (
          <Card key={bundle.id}>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{bundle.title}</h3>
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                    {bundle.price_amount} {bundle.currency}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{bundle.description}</p>
                
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {bundle.available_from && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Starts: <LocalTime isoString={bundle.available_from} />
                    </div>
                  )}
                  {bundle.available_until && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Ends: <LocalTime isoString={bundle.available_until} />
                    </div>
                  )}
                </div>

                <div className="bg-muted/30 p-2 rounded-md">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Included Courses:</p>
                  <ul className="list-disc pl-4 text-sm">
                    {bundle.bundle_items.map((item: any) => (
                      <li key={item.id}>{item.courses.title}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/bundles`);
                  alert("Link copied!");
                }}>
                  <LinkIcon className="w-4 h-4 mr-2" /> Share Link
                </Button>
                <Button variant="destructive" size="sm" onClick={async () => {
                  if (confirm("Are you sure?")) await deleteBundle(bundle.id);
                }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {bundles.length === 0 && (
          <div className="text-center p-12 border rounded-lg bg-muted/30">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Bundles</h3>
            <p className="text-muted-foreground">Group multiple courses together for a discounted price.</p>
          </div>
        )}
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Create Bundle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input name="title" required placeholder="e.g. Full Stack Masterclass" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" placeholder="Short description..." className="resize-none h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Selling Price (BDT)</Label>
                  <Input name="price_amount" type="number" step="0.01" min="1" required placeholder="e.g. 5000" />
                </div>
                <div className="space-y-2">
                  <Label>Original Price (Strike)</Label>
                  <Input name="compare_at_price" type="number" step="0.01" placeholder="Optional" />
                </div>
              </div>
              
              <div className="space-y-2 border p-3 rounded-md bg-muted/30 max-h-48 overflow-y-auto">
                <Label className="mb-2 block">Select Courses</Label>
                {courses.map(course => (
                  <div key={course.id} className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      id={`course-${course.id}`}
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => toggleCourse(course.id)}
                    />
                    <Label htmlFor={`course-${course.id}`} className="font-normal cursor-pointer text-sm">
                      {course.title}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Available From (Optional)</Label>
                <Input name="available_from" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label>Available Until (Optional)</Label>
                <Input name="available_until" type="datetime-local" />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Bundle'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
