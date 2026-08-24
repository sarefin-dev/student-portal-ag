'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import { toggleStaffStatus, createStaff } from './actions';
import { Ban, CheckCircle, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableFilter } from "@/components/data-table/data-table-filter";

export function InstructorsTable({ data, currentPage, totalPages, initialSearch, currentUserId }: { data: any[], currentPage: number, totalPages: number, initialSearch: string, currentUserId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalFilter, setGlobalFilter] = useState(initialSearch);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (globalFilter) {
      params.set("search", globalFilter);
    } else {
      params.delete("search");
    }
    router.push(`/admin/instructors?${params.toString()}`);
  };

  const handleToggleStatus = async (staffId: string, currentStatus: string) => {
    try {
      setIsUpdating(staffId);
      await toggleStaffStatus(staffId, currentStatus);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to update status");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const formData = new FormData(e.currentTarget);
      const result = await createStaff(formData);
      if (result && result.error) {
        alert(result.error);
      } else {
        setIsDialogOpen(false);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to create staff member");
    } finally {
      setIsCreating(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <Link href={`/admin/instructors/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.getValue('full_name')}
        </Link>
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        const color = role === 'admin' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-primary/10 text-primary';
        return <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{role}</span>;
      }
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => {
        const email = row.getValue('email') as string;
        return <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>;
      }
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const color = status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive';
        return <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{status}</span>;
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const staffId = row.original.id;
        const isSuspended = status === 'suspended';
        const isSelf = staffId === currentUserId;
        
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(staffId, status)}
            disabled={isUpdating === staffId || isSelf}
            className={isSuspended ? 'text-success hover:text-success' : 'text-destructive hover:text-destructive'}
          >
            {isSuspended ? <CheckCircle className="w-4 h-4 mr-1" /> : <Ban className="w-4 h-4 mr-1" />}
            {isSuspended ? 'Reactivate' : 'Suspend'}
          </Button>
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
    <Card>
      <CardHeader className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full md:w-auto">
            <Input 
              placeholder="Search name or email..." 
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="secondary">Search</Button>
          </form>
          
          <DataTableFilter 
            filterKey="role"
            title="Role"
            options={[
              { label: 'Instructor', value: 'instructor' },
              { label: 'Admin', value: 'admin' },
            ]}
          />
          <DataTableFilter 
            filterKey="status"
            title="Status"
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
            ]}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button size="icon"><Plus className="w-4 h-4" /></Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Staff Member</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select id="role" name="role" className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? 'Creating...' : 'Create Staff Member'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
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
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No staff members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage <= 1}
              onClick={() => router.push(`/admin/instructors?page=${currentPage - 1}${globalFilter ? `&search=${globalFilter}` : ''}`)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => router.push(`/admin/instructors?page=${currentPage + 1}${globalFilter ? `&search=${globalFilter}` : ''}`)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
