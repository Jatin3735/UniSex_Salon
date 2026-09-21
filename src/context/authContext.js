import { createContext, useContext } from "react";

/**
 * Lives in a .js file on purpose. `react-refresh/only-export-components` is
 * an error here, and it forbids a .jsx module that exports a component from
 * also exporting a context or a hook. Splitting the context out keeps both
 * this file and AuthProvider.jsx lint-clean.
 */
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
