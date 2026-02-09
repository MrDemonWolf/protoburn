import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
<<<<<<< Updated upstream
  return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
=======
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted rounded-none animate-pulse", className)}
      {...props}
    />
  );
>>>>>>> Stashed changes
}

export { Skeleton };
