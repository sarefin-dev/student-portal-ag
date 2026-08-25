'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateLeadStatus, deleteLead, createLead } from './actions';
import { Plus, X, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableFilter } from "@/components/data-table/data-table-filter";

import { CsvUploadButton } from './csv-upload-button';

export function LeadsTable({ data, currentPage, totalPages, initialSearch }: { data: any[], currentPage: number, totalPages: number, initialSearch: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalFilter, setGlobalFilter] = useState(initialSearch);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (globalFilter) {
      params.set("search", globalFilter);
    } else {
      params.delete("search");
    }
    router.push(`/admin/leads?${params.toString()}`);
  };

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `/admin/leads?${params.toString()}`;
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      setIsUpdating(leadId);
      await updateLeadStatus(leadId, newStatus);
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    } finally {
      setIsUpdating(null);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'contact',
      header: 'Contact Info',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.email && <div><a href={`mailto:${row.original.email}`} className="text-primary hover:underline">{row.original.email}</a></div>}
          {row.original.phone && <div><a href={`tel:${row.original.phone}`} className="text-primary hover:underline">{row.original.phone}</a></div>}
        </div>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
    },
    {
      accessorKey: 'interested_in',
      header: 'Interest',
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const leadId = row.original.id;
        return (
          <Select 
            disabled={isUpdating === leadId}
            value={status}
            onValueChange={(val) => handleStatusChange(leadId, val)}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="bad">Bad / Junk</SelectItem>
            </SelectContent>
          </Select>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const leadId = row.original.id;
        return (
          <TooltipProvider>
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Delete Lead</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this lead? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteLead(leadId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TooltipProvider>
        );
      }
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Leads</h2>
        <div className="flex items-center gap-2">
          <CsvUploadButton />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" className="h-9 w-9" onClick={() => setIsCreating(!isCreating)}>
                  {isCreating ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  <span className="sr-only">{isCreating ? 'Cancel' : 'Add New Lead'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isCreating ? 'Cancel' : 'Add New Lead'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {isCreating && (
        <form action={async (fd) => {
          await createLead(fd);
          setIsCreating(false);
        }} className="space-y-4 bg-muted/50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <input name="name" required className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <input name="phone" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input name="email" type="email" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Interest</label>
              <input name="interested_in" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" placeholder="e.g. Next.js Course" />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <input name="notes" className="flex h-10 w-full rounded border px-3 py-2 text-sm bg-background" placeholder="Optional notes..." />
            </div>
          </div>
          <Button type="submit">Create Lead</Button>
        </form>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full md:w-auto">
              <Input 
                placeholder="Search name, email, or phone..." 
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full"
              />
              <Button type="submit" variant="secondary">Search</Button>
            </form>
            
            <DataTableFilter 
              filterKey="status"
              title="Status"
              options={[
                { label: 'New', value: 'new' },
                { label: 'Contacted', value: 'contacted' },
                { label: 'Qualified', value: 'qualified' },
                { label: 'Converted', value: 'converted' },
                { label: 'Lost', value: 'lost' },
                { label: 'Bad', value: 'bad' },
              ]}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No leads found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </div>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage <= 1}
                  onClick={() => router.push(createPageUrl(currentPage - 1))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => router.push(createPageUrl(currentPage + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
