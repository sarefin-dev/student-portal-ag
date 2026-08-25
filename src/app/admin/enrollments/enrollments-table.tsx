'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { setEnrollmentStatus, setAccountStatus } from './actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableFilter } from "@/components/data-table/data-table-filter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BookX, BookOpen, UserX, UserCheck } from 'lucide-react';

export function EnrollmentsTable({ data, currentPage, totalPages, initialSearch }: { data: any[], currentPage: number, totalPages: number, initialSearch: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalFilter, setGlobalFilter] = useState(initialSearch);

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
      id: 'account_status',
      header: ({ column }: any) => <DataTableColumnHeader column={column} title="Account Status" />,
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
          <div className="text-right space-x-2 flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={async () => {
                      await setEnrollmentStatus(enr.student_id, enr.course_id, enr.status === 'active' ? 'banned' : 'active');
                    }}
                  >
                    {enr.status === 'active' ? <BookX className="h-4 w-4" /> : <BookOpen className="h-4 w-4 text-success" />}
                    <span className="sr-only">{enr.status === 'active' ? 'Ban from Course' : 'Unban from Course'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{enr.status === 'active' ? 'Ban from Course' : 'Unban from Course'}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={enr.profiles.status === 'active' ? 'destructive' : 'secondary'} 
                    size="icon"
                    className="h-8 w-8"
                    onClick={async () => {
                      await setAccountStatus(enr.student_id, enr.profiles.status === 'active' ? 'suspended' : 'active');
                    }}
                  >
                    {enr.profiles.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    <span className="sr-only">{enr.profiles.status === 'active' ? 'Suspend Account' : 'Unsuspend Account'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{enr.profiles.status === 'active' ? 'Suspend Account' : 'Unsuspend Account'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      }
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (globalFilter) {
      params.set("search", globalFilter);
    } else {
      params.delete("search");
    }
    router.push(`/admin/enrollments?${params.toString()}`);
  };

  const createPageUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    return `/admin/enrollments?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 flex-1 max-w-sm">
          <Input 
            placeholder="Search students, emails, or courses..." 
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full"
          />
          <Button type="submit" variant="secondary" className="sr-only md:not-sr-only">Search</Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <DataTableFilter 
            filterKey="status"
            title="Account Status"
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
            ]}
          />
        </div>
      </div>

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
