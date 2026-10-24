import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import Brand from "../components/Brand";
import { Field, PasswordInput, fieldDescription } from "../components/FormFields";

type Errors = { email?: string; password?: string; form?: string };

export default function LoginPage() {
  const { status, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const alertRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    document.title = "Entrar | gerenCIA";
  }, []);

  // Depois de entrar, ou se a pessoa já chegou logada, o destino é o painel.
  useEffect(() => {
    if (status === "authenticated") window.location.replace("/app");
  }, [status]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const next: Errors = {};
    if (!email.trim()) next.email = "Informe seu e-mail.";
    if (!password) next.password = "Informe sua senha.";
    setErrors(next);
    if (next.email || next.password) {
      document.getElementById(next.email ? "login-email" : "login-password")?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ email, password });
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError(0, "Não foi possível entrar agora. Tente de novo.");
      setErrors({ email: failure.fields.email, password: failure.fields.password, form: failure.fields.email || failure.fields.password ? undefined : failure.message });
      setSubmitting(false);
      requestAnimationFrame(() => alertRef.current?.focus());
    }
  };

  return <div className="access-shell on-night">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="site-header on-night"><div className="page-container header-inner"><Brand /><nav className="account-nav" aria-label="Navegação de conta"><a className="text-link" href="/register">Criar conta</a><a className="text-link" href="/">Voltar ao início</a></nav></div></header>
    <main className="access-main page-container" id="main-content" tabIndex={-1}>
      <div className="access-copy">
        <h1>Entre na sua conta.</h1>
        <p className="lead">Use o e-mail e a senha do cadastro. O envio de faturas ainda está em desenvolvimento; a demonstração com dados fictícios continua aberta a todos.</p>
        <div className="action-row"><a className="secondary-button" href="/#demo">Explorar a demonstração</a></div>
      </div>
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
              autoComplete="current-password" visible={showPassword} onToggle={() => setShowPassword((value) => !value)}
              invalid={!!errors.password} describedBy={fieldDescription("login-password", { error: errors.password })}
            />
          </Field>
          <button className="primary-button is-night form-submit" type="submit" disabled={submitting}>{submitting ? "Entrando…" : "Entrar"}</button>
        </form>
        <p className="form-switch">Ainda não tem conta? <a className="text-link" href="/register">Criar conta</a></p>
      </section>
    </main>
  </div>;
}
