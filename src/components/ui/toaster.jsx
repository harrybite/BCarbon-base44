import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        onOpenChange,
        variant,
        ...props
      }) {
        const bgClass =
          variant === "destructive" ? "bg-red-500 text-white" : "bg-green-500 text-white";
        return (
          <Toast
            key={id}
            {...props}
            className={`${bgClass} p-4 rounded shadow-lg`}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose onClick={() => onOpenChange(false)} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}