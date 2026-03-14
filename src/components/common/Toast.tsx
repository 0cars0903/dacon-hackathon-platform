"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const typeStyles: Record<string, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

function ToastItem({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all",
        typeStyles[toast.type || "info"]
      )}
    >
      {toast.message}
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    message: string,
    type: ToastMessage["type"] = "info"
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, dismissToast };
}
