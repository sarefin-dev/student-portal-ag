'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createProduct, deleteProduct } from './actions';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ProductManager({ initialProducts }: { initialProducts: any[] }) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Products (SKUs)</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="h-9 w-9" onClick={() => setIsCreating(!isCreating)}>
                {isCreating ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                <span className="sr-only">{isCreating ? 'Cancel' : 'Create New SKU'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCreating ? 'Cancel' : 'Create New SKU'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isCreating && (
        <form action={async (fd) => {
          await createProduct(fd);
          setIsCreating(false);
        }} className="space-y-4 bg-muted/50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input name="title" required className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" placeholder="e.g. Complete React Masterclass" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (Unique URL)</label>
              <input name="slug" required className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" placeholder="react-masterclass" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kind</label>
              <select name="kind" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background">
                <option value="single">Single (1 Course or 1 Service)</option>
                <option value="bundle">Bundle (Multiple Items)</option>
                <option value="service">Service (Standalone)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pricing Model</label>
              <select name="pricing_model" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background">
                <option value="one_time">One-time Payment</option>
                <option value="installment">Installment Plan</option>
                <option value="free">Free (Lead Magnet)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (BDT)</label>
              <input name="price_amount" type="number" step="0.01" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" />
            </div>
          </div>
          <Button type="submit">Create SKU</Button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialProducts.map(product => (
          <div key={product.id} className="border rounded-lg p-4 bg-card text-card-foreground shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{product.title}</h3>
                <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase">{product.kind}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {product.pricing_model === 'free' ? 'Free' : `BDT ${product.price_amount}`}
              </p>
              
              <div className="flex gap-2 text-xs">
                {product.listed_on_site ? (
                  <span className="text-green-600 font-medium">● Public</span>
                ) : (
                  <span className="text-muted-foreground">○ Hidden</span>
                )}
                <span>• {product.enrollment_state}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between">
              <Link href={`/admin/products/${product.id}`} className="text-sm text-blue-600 hover:underline">
                Manage Details
              </Link>
              <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2" onClick={() => deleteProduct(product.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
        {initialProducts.length === 0 && !isCreating && (
          <p className="text-sm text-muted-foreground">No products defined yet. Create your first SKU above.</p>
        )}
      </div>
    </div>
  );
}
