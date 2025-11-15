import { cn } from "@/lib/utils";
import React from "react";

interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

export const Footer = ({ className, ...props }: FooterProps) => {
  return (
    <footer
      className={cn(
        "border-t bg-background p-4 text-center text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <p className="mb-2 md:mb-0">
          &copy; 2025 Maplebear SAF. Todos os direitos reservados.
        </p>
        <div className="space-x-4">
          <a href="#" className="hover:text-primary transition-colors">
            Termos de Serviço
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Política de Privacidade
          </a>
        </div>
      </div>
    </footer>
  );
};
