import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function CourseLoading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] w-full text-muted-foreground">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading course content...</p>
      </div>
    </div>
  );
}
