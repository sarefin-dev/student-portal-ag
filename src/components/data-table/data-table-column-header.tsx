'use client';

import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  sortKey?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  sortKey,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The actual key used in the URL search query
  const key = sortKey || column.id;

  if (!column.getCanSort()) {
    return <div className={cn("text-sm font-medium", className)}>{title}</div>;
  }

  const currentSort = searchParams.get("sort");
  const currentOrder = searchParams.get("order");

  const isSortedAsc = currentSort === key && currentOrder === "asc";
  const isSortedDesc = currentSort === key && currentOrder === "desc";

  const toggleSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // If currently asc, go desc
    if (isSortedAsc) {
      params.set("sort", key);
      params.set("order", "desc");
    } 
    // If currently desc, remove sort entirely
    else if (isSortedDesc) {
      params.delete("sort");
      params.delete("order");
    } 
    // If not sorted by this, go asc
    else {
      params.set("sort", key);
      params.set("order", "asc");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={toggleSort}
      >
        <span>{title}</span>
        {isSortedDesc ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : isSortedAsc ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
