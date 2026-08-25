'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableFilter } from "@/components/data-table/data-table-filter";

export function LedgerTable({ data, currentPage, totalPages, initialSearch }: { data: any[], currentPage: number, totalPages: number, initialSearch: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalFilter, setGlobalFilter] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (globalFilter) {
      params.set("search", globalFilter);
    } else {
      params.delete("search");
    }
    router.push(`/admin/ledger?${params.toString()}`);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'trx_id',
      header: 'Trx ID', // Don't sort by trx_id usually
      cell: ({ row }) => <span className="font-mono font-medium">{row.getValue('trx_id')}</span>,
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => <span>Tk {row.getValue('amount')}</span>,
    },
    {
      accessorKey: 'method',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Method" />,
      cell: ({ row }) => <span className="capitalize">{row.getValue('method')}</span>,
    },
    {
      accessorKey: 'sender_msisdn',
      header: 'Sender Phone',
      cell: ({ row }) => row.getValue('sender_msisdn') || '-',
    },
    {
      accessorKey: 'orders',
      header: 'Student Email',
      cell: ({ row }) => {
        const order = row.original.orders;
        return order?.profiles?.email || '-';
      },
    },
    {
      id: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const kind = row.original.kind as string;
        const isRefund = kind === 'refund';
        const status = isRefund ? 'refunded' : 'completed';
        const color = isRefund ? 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30' : 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
        return <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{status}</span>;
      }
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleString(),
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const createPageUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    return `/admin/ledger?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full md:w-auto">
            <Input 
              placeholder="Search TrxID, phone, email..." 
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="secondary">Search</Button>
          </form>

          <DataTableFilter 
            filterKey="method"
            title="Method"
            options={[
              { label: 'bKash', value: 'bkash' },
              { label: 'Nagad', value: 'nagad' },
              { label: 'Manual', value: 'manual' },
            ]}
          />
        </div>
      </div>

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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2">
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
  );
}
