import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",  /* 44px - Touch-friendly */
        sm: "h-9 rounded-md px-3",   /* 36px - Minimum touch */
        lg: "h-12 rounded-md px-8",  /* 48px - Large touch */
        icon: "h-11 w-11",           /* 44x44px - Touch-friendly */
        "icon-sm": "h-9 w-9",       /* 36x36px - Small icon */
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const spinnerSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";
    const spinnerColor = variant === "default" || variant === "destructive" || variant === "secondary" ? "white" : "current";

    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        disabled={props.disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Spinner size={spinnerSize} color={spinnerColor} />
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

import { Spinner } from "./spinner";

export { Button, buttonVariants };
