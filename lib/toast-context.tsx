"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error";
type Toast = { id: number; message: string; type: ToastType };
type ToastContextValue = { toast: (message: string, type?: ToastType) => void };

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px", borderRadius: 12, pointerEvents: "auto",
              background: t.type === "success" ? "rgba(0,20,10,0.95)" : "rgba(20,0,0,0.95)",
              border: `1px solid ${t.type === "success" ? "rgba(0,255,136,0.35)" : "rgba(255,68,68,0.35)"}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              minWidth: 240, maxWidth: 360,
              animation: "slideInToast 0.2s ease",
            }}
          >
            {t.type === "success"
              ? <CheckCircle size={15} style={{ color: "#00ff88", flexShrink: 0 }} />
              : <AlertCircle size={15} style={{ color: "#ff6666", flexShrink: 0 }} />}
            <span style={{ flex: 1, color: "#f5f5f5", fontSize: 13, fontWeight: 500 }}>{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, flexShrink: 0 }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideInToast { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
