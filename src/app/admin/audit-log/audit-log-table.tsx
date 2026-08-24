'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LocalTime } from '@/components/local-time';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableFilter } from "@/components/data-table/data-table-filter";

function JsonDiffViewer({ before, after }: { before: any, after: any }) {
  // A simple nice rendering of JSON diff
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  
  return (
    <div className="space-y-2 text-sm font-mono mt-4">
      {Array.from(keys).map(key => {
        const b = before ? before[key] : undefined;
        const a = after ? after[key] : undefined;
        
        if (b === a) return null; // Only show differences
        
        return (
          <div key={key} className="grid grid-cols-3 gap-2 border-b pb-2">
            <div className="font-semibold text-muted-foreground">{key}</div>
            <div className="text-destructive break-all bg-destructive/10 px-1 rounded">{b !== undefined ? JSON.stringify(b) : 'null'}</div>
            <div className="text-success break-all bg-success/10 px-1 rounded">{a !== undefined ? JSON.stringify(a) : 'null'}</div>
          </div>
        );
      })}
    </div>
  );
}

export function AuditLogTable({ data, currentPage, totalPages }: { data: any[], currentPage: number, totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const columns = [
    {
      accessorKey: "created_at",
      header: ({ column }: any) => <DataTableColumnHeader column={column} title="Timestamp" />,
      cell: ({ row }: any) => <LocalTime isoString={row.getValue("created_at")} />
    },
    {
      accessorKey: "actor",
      header: "Actor",
      cell: ({ row }: any) => {
        const actor = row.original.profiles;
        return actor ? (
          <div>
            <div className="font-medium">{actor.full_name}</div>
            <div className="text-xs text-muted-foreground">{actor.email}</div>
          </div>
        ) : (
          <span className="text-muted-foreground italic">System</span>
        );
      }
    },
    {
      accessorKey: "action",
      header: ({ column }: any) => <DataTableColumnHeader column={column} title="Action" />,
      cell: ({ row }: any) => {
        const action = row.getValue("action") as string;
        const color = action === 'INSERT' ? 'bg-success/10 text-success' : action === 'DELETE' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning';
        return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{action}</span>;
      }
    },
    {
      accessorKey: "entity_type",
      header: ({ column }: any) => <DataTableColumnHeader column={column} title="Entity" />,
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium capitalize">{row.getValue("entity_type")}</div>
          <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{row.original.entity_id}</div>
        </div>
      )
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Eye className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="capitalize">
                {row.getValue("action")} {row.getValue("entity_type")}
              </DialogTitle>
            </DialogHeader>
            <JsonDiffViewer before={row.original.old_data} after={row.original.new_data} />
          </DialogContent>
        </Dialog>
      )
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
    return `/admin/audit-log?${params.toString()}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <CardTitle>System Audit Log</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <DataTableFilter 
            filterKey="action"
            title="Action"
            options={[
              { label: 'INSERT', value: 'INSERT' },
              { label: 'UPDATE', value: 'UPDATE' },
              { label: 'DELETE', value: 'DELETE' },
            ]}
          />
          <DataTableFilter 
            filterKey="entity_type"
            title="Entity Type"
            options={[
              { label: 'Courses', value: 'courses' },
              { label: 'Enrollments', value: 'enrollments' },
              { label: 'Payments', value: 'payments' },
              { label: 'Profiles', value: 'profiles' },
            ]}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No logs found.
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
      </CardContent>
    </Card>
  );
}
