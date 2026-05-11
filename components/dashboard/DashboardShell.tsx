"use client";

import { ToastProvider } from "@/lib/toast-context";
import type { ReactNode } from "react";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
