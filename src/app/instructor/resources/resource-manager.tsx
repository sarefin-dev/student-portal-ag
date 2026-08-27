'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createResource, deleteResource } from './actions';
import { FileText, Download, Trash2, Link as LinkIcon, Edit, File as FileIcon } from 'lucide-react';
import { toast } from 'sonner';

export function ResourceManager({ resources }: { resources: any[] }) {
  const [isFree, setIsFree] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createResource(formData);
    setIsUploading(false);
    if (res.success) {
      toast.success('Resource uploaded successfully!');
      e.currentTarget.reset();
      setIsFree(false);
    } else {
      toast.error(res.error || 'Failed to upload resource');
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-4">
        {resources.map(resource => (
          <Card key={resource.id}>
            <CardContent className="p-4 flex gap-4 items-start">
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{resource.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-muted px-2 py-1 rounded capitalize">{resource.type}</span>
                    {resource.is_free ? (
                      <span className="text-xs font-semibold bg-success/10 text-success px-2 py-1 rounded">Free</span>
                    ) : (
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                        {resource.price_amount} {resource.currency}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {resource.download_limit ? `Max ${resource.download_limit} downloads` : 'Unlimited downloads'}
                  </div>
                  {resource.watermark_enabled && (
                    <div className="flex items-center gap-1 text-primary">
                      <FileIcon className="w-3 h-3" />
                      Watermarked PDF
                    </div>
                  )}
                </div>
                <div className="pt-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    // Copy direct checkout/download link
                    navigator.clipboard.writeText(`${window.location.origin}/resources`);
                    alert("Link copied!");
                  }}>
                    <LinkIcon className="w-4 h-4 mr-2" /> Share Link
                  </Button>
                  <Button variant="destructive" size="sm" onClick={async () => {
                    if (confirm("Are you sure?")) {
                      await deleteResource(resource.id);
                    }
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {resources.length === 0 && (
          <div className="text-center p-12 border rounded-lg bg-muted/30">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Resources</h3>
            <p className="text-muted-foreground">Upload your first digital product.</p>
          </div>
        )}
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Upload Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input name="title" required placeholder="e.g. System Design Guide" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" placeholder="Short description..." className="resize-none h-20" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select name="type" className="w-full p-2 border rounded-md bg-background text-sm" required>
                  <option value="article">Article (PDF)</option>
                  <option value="ebook">eBook (PDF)</option>
                  <option value="infographic">Infographic</option>
                  <option value="presentation">Presentation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2 border p-3 rounded-md bg-muted/30">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="is_free" 
                    id="is_free" 
                    value="true"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)} 
                  />
                  <Label htmlFor="is_free">This resource is Free</Label>
                </div>
                  {!isFree && (
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Selling Price (BDT)</Label>
                        <Input name="price_amount" type="number" step="0.01" min="1" required={!isFree} placeholder="e.g. 500" />
                      </div>
                      <div className="space-y-2">
                        <Label>Original Price (Strike)</Label>
                        <Input name="compare_at_price" type="number" step="0.01" placeholder="Optional" />
                      </div>
                    </div>
                  )}
              </div>
              <div className="space-y-2">
                <Label>PDF File</Label>
                <Input name="file" type="file" required accept=".pdf" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="watermark_enabled" id="watermark_enabled" value="true" defaultChecked />
                  <Label htmlFor="watermark_enabled">Enable PDF Watermarking</Label>
                </div>
                <p className="text-xs text-muted-foreground">Automatically stamps the buyer's email onto the PDF.</p>
              </div>
              <div className="space-y-2">
                <Label>Download Limit (Optional)</Label>
                <Input name="download_limit" type="number" placeholder="e.g. 5 (Leave empty for unlimited)" />
              </div>
              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Resource'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
