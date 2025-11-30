import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold leading-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-white hover:bg-destructive/90",
        outline: "text-foreground",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning: "border-transparent bg-warning text-white hover:bg-warning/90",
        info: "border-transparent bg-accent text-accent-foreground hover:bg-accent/80",
        muted: "border-transparent bg-muted text-foreground hover:bg-muted/80",
      },
      size: {
        xs: "px-1.5 py-[1px] text-[10px] leading-none",
        sm: "px-3 py-1 text-[12px] leading-tight",
        md: "px-3.5 py-1.5 text-sm leading-tight",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  const computedSize = size ?? (variant === "destructive" ? "sm" : "md");
  const forceWhite =
    typeof className === "string" &&
    /(^|\s)bg-(destructive|primary)(-bg|-dark)?(?=\s|$)/.test(className);
  return (
    <div
      className={cn(
        badgeVariants({ variant, size: computedSize }),
        className,
        forceWhite && "!text-white"
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
