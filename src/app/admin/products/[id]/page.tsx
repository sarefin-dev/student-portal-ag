import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProduct } from './actions';
import { ProductItemManager } from './product-item-manager';

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product) notFound();

  // Fetch product items
  const { data: productItems } = await supabase
    .from('product_items')
    .select('*')
    .eq('product_id', id);

  // Fetch available resources to link
  const { data: courses } = await supabase.from('courses').select('id, title').eq('status', 'active');
  const { data: services } = await supabase.from('services').select('id, title').is('deleted_at', null);

  // Map titles to the raw items
  const mappedItems = (productItems || []).map(item => {
    if (item.item_type === 'course') {
      const course = courses?.find(c => c.id === item.item_id);
      return { ...item, title: course?.title || 'Unknown Course' };
    }
    if (item.item_type === 'service') {
      const service = services?.find(s => s.id === item.item_id);
      return { ...item, title: service?.title || 'Unknown Service' };
    }
    return { ...item, title: 'Unknown Item' };
  });

  return (
    <div className="space-y-6">
      <div className="flex h-14 items-center border-b pb-4 mb-6">
        <Link href="/admin/products" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          &larr; Back to Products
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Product: {product.title}</h1>
          <p className="text-muted-foreground">Type: {product.kind} | Status: {product.status}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">General Information</h2>
          <form action={updateProduct} className="space-y-4">
            <input type="hidden" name="id" value={product.id} />
            
            <div className="space-y-2">
              <Label>Title</Label>
              <Input name="title" defaultValue={product.title || ''} required />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input name="slug" defaultValue={product.slug || ''} required />
            </div>

            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input name="tagline" defaultValue={product.tagline || ''} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea 
                name="description" 
                defaultValue={product.description || ''} 
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Selling Price (BDT)</Label>
                <Input name="price_amount" type="number" step="0.01" defaultValue={product.price_amount || ''} required />
              </div>
              <div className="space-y-2">
                <Label>Compare At (Strike-through)</Label>
                <Input name="compare_at_amount" type="number" step="0.01" defaultValue={product.compare_at_amount || ''} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select name="status" defaultValue={product.status || 'draft'} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <select name="listed_on_site" defaultValue={product.listed_on_site ? 'true' : 'false'} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="true">Listed on Site</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <ProductItemManager 
            product={product} 
            items={mappedItems} 
            availableCourses={courses || []} 
            availableServices={services || []} 
          />
        </div>
      </div>
    </div>
  );
}
