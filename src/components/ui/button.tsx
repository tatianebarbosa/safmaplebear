import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Base copy: botões mais compactos (altura menor) para voltar ao tamanho anterior dos filtros
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 no-touch-target",
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
        default: "h-8 px-3 text-sm",      /* ~32px */
        sm: "h-7 px-2.5 text-xs",         /* ~28px */
        lg: "h-9 px-3.5 text-sm",         /* ~36px */
        icon: "h-8 w-8 rounded-full p-0", /* Ícones circulares menores */
        "icon-sm": "h-7 w-7 rounded-full p-0",             /* Versão compacta para ícones */
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
