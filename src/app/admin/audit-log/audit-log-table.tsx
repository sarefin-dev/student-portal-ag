'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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

export function AuditLogTable({ data }: { data: any[] }) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const columns = [
    {
      accessorKey: "created_at",
      header: "Timestamp",
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
      header: "Action",
      cell: ({ row }: any) => {
        const action = row.getValue("action") as string;
        const color = action === 'INSERT' ? 'bg-success/10 text-success' : action === 'DELETE' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning';
        return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{action}</span>;
      }
    },
    {
      accessorKey: "entity_type",
      header: "Entity",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium capitalize">{row.getValue("entity_type")}</div>
          <div className="text-xs text-muted-foreground font-mono">{row.original.entity_id.substring(0,8)}...</div>
        </div>
      )
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }: any) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4 mr-2" /> View Changes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="capitalize">{row.original.action} {row.original.entity_type}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-2 text-xs font-bold text-muted-foreground mb-2 pb-2 border-b">
                <div>Field</div>
                <div>Before</div>
                <div>After</div>
              </div>
              <JsonDiffViewer before={row.original.before} after={row.original.after} />
            </div>
          </DialogContent>
        </Dialog>
      )
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
