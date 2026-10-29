import { useRef, useState, type FormEvent } from "react";
import { ApiError } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import useRedirectSignedInUser from "../auth/useRedirectSignedInUser";
import AccountHeader from "../components/AccountHeader";
import { Field, PasswordInput, fieldDescription } from "../components/FormFields";
import usePageTitle from "../hooks/usePageTitle";

type Errors = { email?: string; password?: string; form?: string };

/** Confere só se os campos foram preenchidos. Quem confere a senha é a API. */
function checkFilledFields(email: string, password: string): Errors {
  const errors: Errors = {};
  if (!email.trim()) {
    errors.email = "Informe seu e-mail.";
  }
  if (!password) {
    errors.password = "Informe sua senha.";
  }
  return errors;
}

/**
 * Transforma o erro do login nas mensagens do formulário. Se a API apontou um
 * campo, a mensagem aparece embaixo dele; se não, aparece no topo do formulário.
 */
function loginErrorsFrom(error: unknown): Errors {
  // Um erro que não veio da API, como a falta de conexão, ganha uma mensagem genérica.
  const failure = error instanceof ApiError ? error : new ApiError(0, "Não foi possível entrar agora. Tente de novo.");
  const { email, password } = failure.fields;
  if (email || password) {
    return { email, password };
  }
  return { form: failure.message };
}

/** Página /login: o formulário de entrada. Depois de entrar, a pessoa vai para o painel. */
export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const alertRef = useRef<HTMLParagraphElement>(null);

  usePageTitle("Entrar | gerenCIA");
  useRedirectSignedInUser();

  async function submit(event: FormEvent<HTMLFormElement>) {
    // O formulário não recarrega a página: quem envia os dados é o signIn.
    event.preventDefault();
    if (submitting) {
      return;
    }

    const emptyFields = checkFilledFields(email, password);
    setErrors(emptyFields);
    if (emptyFields.email) {
      document.getElementById("login-email")?.focus();
      return;
    }
    if (emptyFields.password) {
      document.getElementById("login-password")?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ email, password });
      // Deu certo: useRedirectSignedInUser leva a pessoa para o painel.
    } catch (error) {
      setErrors(loginErrorsFrom(error));
      setSubmitting(false);
      // Espera o aviso aparecer na tela e leva o foco até ele, para o leitor de tela anunciar.
      requestAnimationFrame(() => alertRef.current?.focus());
    }
  }

  return <div className="access-shell on-night">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <AccountHeader switchHref="/register" switchLabel="Criar conta" />
    <main className="access-main page-container" id="main-content" tabIndex={-1}>
      <LoginIntro />
      <section className="access-form form-block" aria-labelledby="login-title">
        <h2 id="login-title">Entrar</h2>
        <form onSubmit={submit} noValidate>
          {errors.form && <p ref={alertRef} tabIndex={-1} role="alert" className="form-alert">{errors.form}</p>}
          <Field id="login-email" label="E-mail" error={errors.email}>
            <input
              id="login-email" name="email" type="email" autoComplete="email" inputMode="email"
              placeholder="nome@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)}
              aria-invalid={!!errors.email} aria-describedby={fieldDescription("login-email", { error: errors.email })}
              autoCapitalize="none" spellCheck={false} required
            />
          </Field>
          <Field id="login-password" label="Senha" error={errors.password}>
            <PasswordInput
              id="login-password" name="password" value={password} onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password" visible={showPassword} onToggle={() => setShowPassword(!showPassword)}
              invalid={!!errors.password} describedBy={fieldDescription("login-password", { error: errors.password })}
            />
          </Field>
          <button className="primary-button is-night form-submit" type="submit" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="form-switch">Ainda não tem conta? <a className="text-link" href="/register">Criar conta</a></p>
      </section>
    </main>
  </div>;
}

/** O texto ao lado do formulário. */
function LoginIntro() {
  return <div className="access-copy">
    <h1>Entre na sua conta.</h1>
    <p className="lead">Use o e-mail e a senha do cadastro. O envio de faturas ainda está em desenvolvimento; a demonstração com dados fictícios continua aberta a todos.</p>
    <div className="action-row"><a className="secondary-button" href="/#demo">Explorar a demonstração</a></div>
  </div>;
}
