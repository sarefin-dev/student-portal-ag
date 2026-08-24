'use client';

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DataTableFilterProps {
  filterKey: string;
  title: string;
  options: { label: string; value: string }[];
}

export function DataTableFilter({ filterKey, title, options }: DataTableFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentValue = searchParams.get(filterKey) || "all";

  const onFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // reset to page 1 on filter
    
    if (value === "all") {
      params.delete(filterKey);
    } else {
      params.set(filterKey, value);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-2">
      <Select value={currentValue} onValueChange={onFilterChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder={title} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {title}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentValue !== "all" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground"
          onClick={() => onFilterChange("all")}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
