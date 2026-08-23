'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export function StudentsTable({ data, currentPage, totalPages, initialSearch }: { data: any[], currentPage: number, totalPages: number, initialSearch: string }) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalFilter) {
      router.push(`/admin/students?search=${encodeURIComponent(globalFilter)}`);
    } else {
      router.push(`/admin/students`);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.getValue('full_name')}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'WhatsApp',
      cell: ({ row }) => row.getValue('phone') || '-',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const color = status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive';
        return <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{status}</span>;
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Joined Date',
      cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              placeholder="Search by name, email, or phone..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" variant="secondary">Search</Button>
          </form>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/students?page=${currentPage - 1}${initialSearch ? `&search=${encodeURIComponent(initialSearch)}` : ''}`)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/students?page=${currentPage + 1}${initialSearch ? `&search=${encodeURIComponent(initialSearch)}` : ''}`)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
