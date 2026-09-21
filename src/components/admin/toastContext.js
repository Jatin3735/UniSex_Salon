import { createContext, useContext } from "react";

/**
 * Toast context. Kept in a plain .js file (not .jsx) so the
 * react-refresh/only-export-components lint rule stays happy — a .jsx module
 * may only export components.
 */
export const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
