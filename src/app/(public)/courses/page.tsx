import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getActiveCourses } from '@/db/queries/courses';
import { Button } from '@/components/ui/button';

export const revalidate = 60; // ISR every 60s

export default async function CoursesCatalogPage() {
  const supabase = await createClient();
  const courses = await getActiveCourses(supabase);

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Course Catalog</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Browse our selection of live cohorts, recorded, and text-based courses.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-xl font-medium text-muted-foreground">Check back soon for new courses.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
              <div className="aspect-video w-full bg-muted">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary">
                    <span className="text-sm font-medium text-secondary-foreground">No Thumbnail</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                      {course.type.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      {course.compare_at_price && course.compare_at_price > course.price_amount && (
                        <span className="text-sm text-muted-foreground line-through">
                          {course.currency} {course.compare_at_price}
                        </span>
                      )}
                      <span className="font-bold text-lg">
                        {course.currency} {course.price_amount}
                      </span>
                    </div>
                  </div>
                <h3 className="mb-2 text-xl font-bold leading-tight">{course.title}</h3>
                <p className="mb-6 flex-1 text-sm text-muted-foreground line-clamp-3">
                  {course.description || 'No description provided.'}
                </p>
                <Link href={`/courses/${course.slug}`} className="w-full">
                  <Button className="w-full">View Details</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
