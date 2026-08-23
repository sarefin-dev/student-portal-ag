import { Loader2 } from "lucide-react";

export default function StudentLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full text-muted-foreground">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading...</p>
      </div>
    </div>
  );
}
