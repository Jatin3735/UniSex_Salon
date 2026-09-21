import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthContext } from "./authContext.js";
import * as authApi from "../api/auth.js";
import { getToken, setToken } from "../api/client.js";
import { readJSON, removeKey, writeJSON } from "../lib/safeStorage.js";

const USER_KEY = "salonx.user";

/**
 * Holds the signed-in user in React state.
 *
 * The old Navbar read localStorage during render, so it only appeared to work
 * because every page rendered its own <Navbar> and route changes remounted
 * it. Now that the navbar is hoisted into a shared layout, that staleness
 * would be a real bug — hence a proper provider.
 */
export default function AuthProvider({ children }) {
  // Cached so a reload doesn't flash a logged-out navbar before /me returns.
  const [user, setUser] = useState(() => readJSON(USER_KEY, null));
  const [ready, setReady] = useState(() => !getToken());

  const persist = useCallback((nextUser, token) => {
    if (token !== undefined) setToken(token);
    setUser(nextUser);
    if (nextUser) writeJSON(USER_KEY, nextUser);
    else removeKey(USER_KEY);
  }, []);

  // Revalidate the cached user against the server on boot: a token can be
  // expired, revoked, or belong to a deleted account.
  useEffect(() => {
    if (!getToken()) return undefined;

    const controller = new AbortController();

    (async () => {
      try {
        const { user: fresh } = await authApi.fetchMe({ signal: controller.signal });
        setUser(fresh);
        writeJSON(USER_KEY, fresh);
      } catch (err) {
        if (err.name === "AbortError") return;
        // 401 means the session is genuinely gone. A network error means the
        // API is down — keep the cached user rather than logging them out.
        if (err.status === 401) {
          setToken(null);
          setUser(null);
          removeKey(USER_KEY);
        }
      } finally {
        if (!controller.signal.aborted) setReady(true);
      }
    })();

    return () => controller.abort();
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { token, user: nextUser } = await authApi.login({ email, password });
      persist(nextUser, token);
      return nextUser;
    },
    [persist]
  );

  const signup = useCallback(
    async (fields) => {
      const { token, user: nextUser } = await authApi.register(fields);
      persist(nextUser, token);
      return nextUser;
    },
    [persist]
  );

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user),
      hasRole: (...roles) => Boolean(user) && roles.includes(user.role),
      login,
      signup,
      logout,
    }),
    [user, ready, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
