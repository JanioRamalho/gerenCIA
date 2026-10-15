import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as api from "./api";
import type { User } from "./api";

// "unavailable" means the API did not answer. The public site keeps working in that case.
type Status = "loading" | "anonymous" | "authenticated" | "unavailable";

type AuthValue = {
  status: Status;
  user: User | null;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: Status; user: User | null }>({ status: "loading", user: null });

  useEffect(() => {
    let active = true;
    api.getCurrentUser().then(
      (user) => { if (active) setState(user ? { status: "authenticated", user } : { status: "anonymous", user: null }); },
      () => { if (active) setState({ status: "unavailable", user: null }); },
    );
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    const user = await api.login(input);
    setState({ status: "authenticated", user });
  }, []);

  const signUp = useCallback(async (input: { name: string; email: string; password: string }) => {
    const user = await api.register(input);
    setState({ status: "authenticated", user });
  }, []);

  // Throws when the server could not end the session, so the screen never claims a false sign-out.
  const signOut = useCallback(async () => {
    await api.logout();
    setState({ status: "anonymous", user: null });
  }, []);

  const value = useMemo(() => ({ ...state, signIn, signUp, signOut }), [state, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
