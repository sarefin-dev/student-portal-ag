'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { setEnrollmentStatus, setAccountStatus } from './actions';

export function EnrollmentsTable({ data }: { data: any[] }) {
  const [globalFilter, setGlobalFilter] = useState('');

  const columns: ColumnDef<any>[] = [
    {
      header: 'Student',
      accessorFn: row => `${row.profiles.full_name} ${row.profiles.email}`,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.profiles.full_name}</div>
          <div className="text-muted-foreground">{row.original.profiles.email}</div>
        </div>
      )
    },
    {
      header: 'Account Status',
      accessorFn: row => row.profiles.status,
      cell: ({ row }) => {
        const status = row.original.profiles.status;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {status}
          </span>
        );
      }
    },
    {
      header: 'Course',
      accessorFn: row => row.courses.title,
      cell: ({ row }) => row.original.courses.title
    },
    {
      header: 'Progress',
      accessorKey: 'completion_percent',
      cell: ({ row }) => `${row.getValue('completion_percent')}%`
    },
    {
      header: 'Enrollment Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {status}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const enr = row.original;
        return (
          <div className="text-right space-x-2">
            <Button variant="outline" size="sm" onClick={async () => {
              await setEnrollmentStatus(enr.student_id, enr.course_id, enr.status === 'active' ? 'banned' : 'active');
            }}>
              {enr.status === 'active' ? 'Ban from Course' : 'Unban from Course'}
            </Button>
            <Button variant={enr.profiles.status === 'active' ? 'destructive' : 'secondary'} size="sm" onClick={async () => {
              await setAccountStatus(enr.student_id, enr.profiles.status === 'active' ? 'suspended' : 'active');
            }}>
              {enr.profiles.status === 'active' ? 'Suspend Account' : 'Unsuspend Account'}
            </Button>
          </div>
        );
      }
    }
  ];

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search students, emails, or courses..."
        value={globalFilter ?? ''}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-2">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
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
                  <div className="flex flex-col items-center justify-center space-y-2 opacity-50">
                    <span>No enrollments found.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
