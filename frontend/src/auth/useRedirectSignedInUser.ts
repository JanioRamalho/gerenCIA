import { useEffect } from "react";
import { useAuth } from "./AuthContext";

/**
 * Manda para o painel quem já está logado. Usado nas páginas que só fazem
 * sentido para visitantes: a inicial, a de entrar e a de criar conta. Depois
 * de entrar ou criar a conta, o status muda e a pessoa vai para o painel.
 */
export default function useRedirectSignedInUser() {
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      // replace troca a página atual no histórico: o botão voltar não traz a
      // pessoa de volta para o formulário.
      window.location.replace("/app");
    }
  }, [status]);
}
