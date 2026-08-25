'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { addProductItem, removeProductItem } from './actions';

export function ProductItemManager({ product, items, availableCourses, availableServices }: { product: any, items: any[], availableCourses: any[], availableServices: any[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState('course');

  const options = selectedType === 'course' ? availableCourses : availableServices;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Product Contents</h2>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Add Item</>}
        </Button>
      </div>

      {isAdding && (
        <form action={addProductItem} className="p-4 border rounded-md bg-muted/50 space-y-4" onSubmit={() => setIsAdding(false)}>
          <input type="hidden" name="productId" value={product.id} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Type</label>
              <select 
                name="itemType" 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="course">Course</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select {selectedType === 'course' ? 'Course' : 'Service'}</label>
              <select name="itemId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="">-- Select --</option>
                {options.map((opt: any) => (
                  <option key={opt.id} value={opt.id}>{opt.title}</option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" className="w-full">Add to Product</Button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center p-8 border border-dashed rounded-md">
          No items attached. Add a course or service to this product.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary mr-2">
                  {item.item_type}
                </span>
                <span className="font-medium">{item.title}</span>
              </div>
              <form action={removeProductItem}>
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="itemId" value={item.id} />
                <Button variant="ghost" size="icon" type="submit" className="h-8 w-8 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
