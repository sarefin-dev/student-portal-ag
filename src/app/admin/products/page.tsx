import { createClient } from '@/lib/supabase/server';
import { ProductManager } from './product-manager';
import { redirect } from 'next/navigation';

export default async function AdminProductsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Product Catalog (SKUs)</h1>
        <p className="text-muted-foreground mt-2">
          This is what the marketing site sells. Create single courses, bundles, and services here, then map them to the actual LMS content.
        </p>
      </div>

      <ProductManager initialProducts={products || []} />
    </div>
  );
}
