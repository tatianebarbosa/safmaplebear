import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface FeedbackToastProps {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Loader2,
};

const colorMap = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
  loading: "text-primary",
};

export const useFeedbackToast = () => {
  const { toast } = useToast();

  const showToast = ({ 
    type, 
    title, 
    description, 
    duration = 5000 
  }: FeedbackToastProps) => {
    const Icon = iconMap[type];
    const colorClass = colorMap[type];

    toast({
      title: (
        <div className="flex items-center gap-2">
          <Icon 
            className={`h-5 w-5 ${colorClass} ${type === 'loading' ? 'animate-spin' : ''}`} 
          />
          <span>{title}</span>
        </div>
      ) as any,
      description,
      duration: type === 'loading' ? Infinity : duration,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };

  const success = (title: string, description?: string) => {
    showToast({ type: 'success', title, description });
  };

  const error = (title: string, description?: string) => {
    showToast({ type: 'error', title, description });
  };

  const warning = (title: string, description?: string) => {
    showToast({ type: 'warning', title, description });
  };

  const info = (title: string, description?: string) => {
    showToast({ type: 'info', title, description });
  };

  const loading = (title: string, description?: string) => {
    showToast({ type: 'loading', title, description });
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    toast: showToast,
  };
};
