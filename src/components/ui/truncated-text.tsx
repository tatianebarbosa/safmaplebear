import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string;
  maxWidth?: string;
  className?: string;
  showTooltip?: boolean;
  lines?: number;
}

/**
 * Componente de texto truncado com tooltip automático
 * Resolve problemas de overflow em cards e componentes
 */
export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxWidth,
  className,
  showTooltip = true,
  lines = 1,
}) => {
  const truncateClass = lines === 1 ? "truncate" : `line-clamp-${lines}`;
  const style = maxWidth ? { maxWidth } : undefined;

  if (!showTooltip) {
    return (
      <span
        className={cn(truncateClass, className)}
        style={style}
        title={text}
      >
        {text}
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(truncateClass, "cursor-help", className)}
            style={style}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface TruncatedEmailProps {
  email: string;
  className?: string;
}

/**
 * Componente especializado para emails
 * Trunca mantendo visível o domínio
 */
export const TruncatedEmail: React.FC<TruncatedEmailProps> = ({
  email,
  className,
}) => {
  const [localPart, domain] = email.split("@");
  
  if (!domain) {
    return <TruncatedText text={email} className={className} />;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 cursor-help", className)}>
            <span className="truncate max-w-[120px]">{localPart}</span>
            <span className="text-muted-foreground">@</span>
            <span className="flex-shrink-0">{domain}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-sm">{email}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
