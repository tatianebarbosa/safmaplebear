import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        active: "bg-success-bg text-success border border-success/20",
        inactive: "bg-muted text-muted-foreground border border-border",
        warning: "bg-warning-bg text-warning border border-warning/20",
        available: "bg-success-bg text-success border border-success/20",
        complete: "bg-warning-bg text-warning border border-warning/20",
        excess: "bg-destructive-bg text-destructive border border-destructive/20"
      },
    },
    defaultVariants: {
      variant: "inactive",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {}

const StatusBadge = ({ className, variant, ...props }: StatusBadgeProps) => {
  return (
    <span
      className={cn(statusBadgeVariants({ variant }), className)}
      {...props}
    />
  );
};

export { StatusBadge, statusBadgeVariants };