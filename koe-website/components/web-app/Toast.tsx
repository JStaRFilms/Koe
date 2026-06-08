"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  title: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  toast: (title: string, message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((title: string, message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-[420px] pointer-events-none px-4 md:px-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const typeStyles = {
    success: {
      border: "border-2 border-[var(--color-amber)]",
      shadow: "shadow-[4px_4px_0px_var(--color-amber)]",
      icon: <CheckCircle2 className="w-5 h-5 text-[var(--color-amber)] shrink-0" />,
    },
    error: {
      border: "border-2 border-[var(--color-crimson)]",
      shadow: "shadow-[4px_4px_0px_var(--color-crimson)]",
      icon: <AlertTriangle className="w-5 h-5 text-[var(--color-crimson)] shrink-0" />,
    },
    warning: {
      border: "border-2 border-[var(--color-amber)]",
      shadow: "shadow-[4px_4px_0px_rgba(217,56,30,0.5)]",
      icon: <AlertTriangle className="w-5 h-5 text-[var(--color-amber)] shrink-0" />,
    },
    info: {
      border: "border-2 border-[var(--color-zinc)]",
      shadow: "shadow-[4px_4px_0px_var(--color-zinc)]",
      icon: <Info className="w-5 h-5 text-[var(--color-bone)] shrink-0" />,
    },
  };

  const style = typeStyles[toast.type];

  return (
    <div
      className={`pointer-events-auto w-full bg-[var(--color-void)] text-[var(--color-bone)] p-4 normal-case flex items-start gap-3 toast-animate ${style.border} ${style.shadow}`}
      role="alert"
    >
      {style.icon}
      <div className="flex-grow min-w-0">
        <p className="font-deco font-bold text-sm leading-tight text-[var(--color-bone)] mb-1">{toast.title}</p>
        <p className="text-xs text-[var(--color-muted)] leading-relaxed font-mono whitespace-pre-wrap">{toast.message}</p>
      </div>
      <button
        type="button"
        className="text-[var(--color-muted)] hover:text-[var(--color-bone)] transition-colors shrink-0 p-0.5 cursor-pointer"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
