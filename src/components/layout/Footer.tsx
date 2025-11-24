import { cn } from "@/lib/utils";
import React from "react";

interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

export const Footer = ({ className, ...props }: FooterProps) => {
  return (
    <footer
      className={cn(
        "bg-background text-muted-foreground border-t-2 border-border/60 px-6 sm:px-12 py-10 sm:py-12 mt-12",
        className
      )}
      {...props}
    >
      <div className="w-full text-center text-xs sm:text-sm text-muted-foreground">
        <p>&copy; 2025 Maple Bear SAF. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};
