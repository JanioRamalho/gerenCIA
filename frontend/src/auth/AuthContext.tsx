import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as api from "./api";
import type { User } from "./api";

// "loading": a sessão ainda está sendo conferida.
// "unavailable": a API não respondeu. O site público continua funcionando.
type Status = "loading" | "anonymous" | "authenticated" | "unavailable";

type AuthValue = {
  status: Status;
  user: User | null;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

// O contexto deixa qualquer componente saber quem está logado, sem passar
// o usuário de componente em componente.
const AuthContext = createContext<AuthValue | null>(null);

/** Confere a sessão quando o site abre e oferece entrar, cadastrar e sair. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: Status; user: User | null }>({ status: "loading", user: null });

  // Pergunta à API quem está logado. "active" evita atualizar o estado se o
  // componente já saiu da tela quando a resposta chegar.
  useEffect(() => {
    let active = true;
    api.getCurrentUser().then(
      (user) => {
        if (!active) {
          return;
        }
        if (user) {
          setState({ status: "authenticated", user });
        } else {
          setState({ status: "anonymous", user: null });
        }
      },
      () => {
        if (active) {
          setState({ status: "unavailable", user: null });
        }
      },
    );
    return () => { active = false; };
  }, []);

  // useCallback e useMemo mantêm as mesmas funções e o mesmo objeto entre um
  // desenho e outro. Sem isso, todo componente que usa useAuth seria desenhado
  // de novo a cada mudança aqui, mesmo sem nada ter mudado para ele.
  const signIn = useCallback(async (input: { email: string; password: string }) => {
    const user = await api.login(input);
    setState({ status: "authenticated", user });
  }, []);

  const signUp = useCallback(async (input: { name: string; email: string; password: string }) => {
    const user = await api.register(input);
    setState({ status: "authenticated", user });
  }, []);

  // Lança um erro quando o servidor não encerrou a sessão, para a tela nunca
  // dizer que a pessoa saiu sem ela ter saído de verdade.
  const signOut = useCallback(async () => {
    await api.logout();
    setState({ status: "anonymous", user: null });
  }, []);

  const value = useMemo(() => ({ ...state, signIn, signUp, signOut }), [state, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** A sessão atual e as ações de entrar, cadastrar e sair. */
export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth precisa ser usado dentro do AuthProvider.");
  }
  return value;
}
