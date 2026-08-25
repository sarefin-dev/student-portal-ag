'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createService, deleteService } from './actions';

import { Plus, X, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ServiceManager({ initialServices }: { initialServices: any[] }) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Services</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="h-9 w-9" onClick={() => setIsCreating(!isCreating)}>
                {isCreating ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                <span className="sr-only">{isCreating ? 'Cancel' : 'Add New Service'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCreating ? 'Cancel' : 'Add New Service'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isCreating && (
        <form action={async (fd) => {
          await createService(fd);
          setIsCreating(false);
        }} className="space-y-4 bg-muted/50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input name="title" required className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" placeholder="e.g. 1-on-1 CV Review" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (Unique)</label>
              <input name="slug" required className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" placeholder="cv-review-basic" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Type</label>
              <select name="service_type" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background">
                <option value="cv_review">CV Review</option>
                <option value="architecture_review">Architecture Review</option>
                <option value="consulting_call">Consulting Call</option>
                <option value="mentorship">Mentorship</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Format</label>
              <select name="delivery_format" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background">
                <option value="async_written">Async Written (Offline)</option>
                <option value="live_call">Live Call (Zoom/Meet)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (Mins) [For Calls]</label>
              <input name="duration_minutes" type="number" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Turnaround (Days) [For Async]</label>
              <input name="turnaround_days" type="number" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea name="description" className="flex w-full rounded border px-3 py-2 text-sm bg-background" rows={3} />
          </div>
          <Button type="submit">Create Service</Button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialServices.map(service => (
          <div key={service.id} className="border rounded-lg p-4 bg-card text-card-foreground shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold">{service.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">Type: {service.service_type} | {service.delivery_format}</p>
              <p className="text-sm line-clamp-2">{service.description}</p>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-end">
              <TooltipProvider>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8" title="Delete Service">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Service</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Service?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete this service? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteService(service.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </TooltipProvider>
            </div>
          </div>
        ))}
        {initialServices.length === 0 && !isCreating && (
          <p className="text-sm text-muted-foreground">No services defined yet.</p>
        )}
      </div>
    </div>
  );
}
