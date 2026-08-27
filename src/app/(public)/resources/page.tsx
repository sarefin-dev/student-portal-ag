import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import Link from 'next/link';

export default async function ResourcesCatalogPage() {
  const supabase = await createClient();

  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .is('deleted_at', null)
    .eq('is_course_only', false)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-12">
      <div className="space-y-4 mb-12">
        <h1 className="text-4xl font-semibold tracking-tight">Digital Resources</h1>
        <p className="text-xl text-muted-foreground">Download guides, ebooks, and cheat sheets.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources?.map(resource => (
          <Card key={resource.id} className="flex flex-col">
            <div className="aspect-video bg-muted flex items-center justify-center border-b">
              {resource.thumbnail_url ? (
                <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-16 h-16 text-muted-foreground opacity-50" />
              )}
            </div>
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold bg-muted px-2 py-1 rounded capitalize">{resource.type}</span>
                {resource.is_free ? (
                  <span className="text-xs font-semibold bg-success/10 text-success px-2 py-1 rounded">Free</span>
                ) : (
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                    {resource.price_amount} {resource.currency}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-xl mb-2">{resource.title}</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">{resource.description}</p>
              
              <Link href={resource.is_free ? `/api/resources/${resource.id}/download` : `/checkout?resource=${resource.id}`} className="w-full">
                <Button className="w-full" variant={resource.is_free ? 'outline' : 'default'}>
                  <Download className="w-4 h-4 mr-2" />
                  {resource.is_free ? 'Download Now' : 'Purchase Access'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}

        {(!resources || resources.length === 0) && (
          <div className="col-span-full text-center py-20 border rounded-xl bg-muted/20">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">No resources available</h2>
            <p className="text-muted-foreground">Check back later for new digital products.</p>
          </div>
        )}
      </div>
    </div>
  );
}
