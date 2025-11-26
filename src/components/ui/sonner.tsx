import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ position, toastOptions, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={position ?? "bottom-right"}
      offset={18}
      className="toaster group"
      style={
        {
          // Keep small offsets on mobile.
          "--mobile-offset": "6px",
        } as CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        style: {
          // Force the toast to size to its content and cap long messages.
          width: "auto",
          minWidth: "0",
          maxWidth: "360px",
          display: "inline-flex",
          alignItems: "flex-start",
          padding: "12px 14px",
          borderRadius: "14px",
          color: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--card))",
          ...(toastOptions?.style ?? {}),
        },
        classNames: {
          toast:
            "group toast inline-flex w-full max-w-[360px] whitespace-pre-wrap break-words rounded-xl border border-border/70 bg-card text-foreground px-3.5 py-3 shadow-[var(--shadow-card)]",
          title: "text-sm font-semibold leading-tight text-foreground",
          description: "text-sm leading-snug text-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground h-8 rounded-md px-3 text-sm font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground h-8 rounded-md px-3 text-sm font-medium",
          closeButton: "group-[.toast]:text-muted-foreground hover:text-foreground",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
