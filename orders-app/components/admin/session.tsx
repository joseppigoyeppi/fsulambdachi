"use client";

import * as React from "react";
import * as api from "@/lib/api";
import { ApiError, type AdminData } from "@/lib/api";

/*
  Admin state for the static build: the token lives in localStorage, the data (orders,
  products, settings) is fetched in one call and refetched after every mutation.
  Any "unauthorized" reply signs the admin out so an expired token never leaves
  the UI half-working.
*/

interface AdminSession {
  /** null while checking storage, false when signed out, true when a token exists */
  authed: boolean | null;
  data: AdminData | null;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Runs a mutation, then refreshes. Rethrows so forms can show the message. */
  mutate: (fn: () => Promise<unknown>) => Promise<void>;
}

const SessionContext = React.createContext<AdminSession | null>(null);

function subscribeToken(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const token = React.useSyncExternalStore<string | null | undefined>(subscribeToken, () => api.getToken(), () => undefined);
  const [tick, setTick] = React.useState(0);
  const [data, setData] = React.useState<AdminData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const authed = token === undefined ? null : Boolean(token);

  // State is only touched from promise callbacks, never synchronously in an effect.
  const load = React.useCallback((): Promise<void> => {
    if (!api.getToken()) return Promise.resolve();
    return api
      .fetchAdmin()
      .then((fresh) => {
        setData(fresh);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.code === "unauthorized") {
          api.setToken(null);
          setData(null);
          setTick((t) => t + 1);
        } else {
          setError(err instanceof ApiError ? err.message : "Could not load admin data.");
        }
      });
  }, []);

  React.useEffect(() => {
    if (authed) void load();
  }, [authed, tick, load]);

  const value = React.useMemo<AdminSession>(
    () => ({
      authed,
      data,
      error,
      login: async (username, password) => {
        await api.login(username, password);
        setTick((t) => t + 1);
      },
      logout: async () => {
        await api.logout();
        setData(null);
        setTick((t) => t + 1);
      },
      refresh: load,
      mutate: async (fn) => {
        try {
          await fn();
        } catch (err) {
          if (err instanceof ApiError && err.code === "unauthorized") {
            api.setToken(null);
            setTick((t) => t + 1);
          }
          throw err;
        }
        await load();
      },
    }),
    [authed, data, error, load],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAdmin(): AdminSession {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminSessionProvider>");
  return ctx;
}

/** Turns any thrown error into a message for a form. */
export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  return err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
}
