import * as React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white" | "current";
}

/**
 * Componente de Spinner para indicar estado de carregamento.
 * Ideal para ser usado dentro de botes.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "primary",
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-6 w-6 border-3",
  };

  const colorClasses = {
    primary: "border-primary border-t-transparent",
    white: "border-white border-t-transparent",
    current: "border-current border-t-transparent",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface ButtonSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

/**
 * Wrapper para botes que exibe um spinner e desabilita o boto
 * quando isLoading  true.
 */
export const ButtonSpinner: React.FC<ButtonSpinnerProps> = ({
  isLoading,
  size = "md",
  children,
  ...props
}) => {
  const spinnerSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";
  
  // Determina a cor do spinner baseado no contexto do boto (simplificado)
  // Em botes de cor, o spinner deve ser branco/foreground
  const spinnerColor = "current"; // Usar 'current' para herdar a cor do texto do boto

  return (
    <div className="inline-flex items-center justify-center" {...props}>
      {isLoading ? (
        <Spinner size={spinnerSize} color={spinnerColor} />
      ) : (
        children
      )}
    </div>
  );
};
