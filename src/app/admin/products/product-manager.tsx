'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createProduct, deleteProduct } from './actions';
import Link from 'next/link';
import { Plus, X, Settings, Trash2 } from 'lucide-react';
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
        }} className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="font-bold text-lg mb-4">New SKU</h3>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Internal Title</label>
              <input name="title" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-background" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input name="slug" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-background" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kind</label>
              <select name="kind" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-background">
                <option value="single">Single Course</option>
                <option value="bundle">Bundle</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pricing Model</label>
              <select name="pricing_model" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-background">
                <option value="one_time">One-time Payment</option>
                <option value="free">Free</option>
                <option value="installment">Installments</option>
              </select>
            </div>
          </div>
          <Button type="submit">Create SKU</Button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialProducts.map((product) => (
          <div key={product.id} className="bg-card border rounded-lg p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg leading-tight">{product.title}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {product.kind}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {product.pricing_model === 'free' ? 'Free' : `${product.price_amount} BDT`}
                <br/>Status: <span className="capitalize">{product.status}</span>
              </p>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-end gap-2 items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/admin/products/${product.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <span className="sr-only">Manage Details</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Manage Details</TooltipContent>
                </Tooltip>

                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Product</span>
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Delete Product</TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete this product? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button variant="destructive" onClick={() => deleteProduct(product.id)}>
                        Delete Product
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TooltipProvider>
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
