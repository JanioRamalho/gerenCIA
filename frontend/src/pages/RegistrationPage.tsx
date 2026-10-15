import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import Brand from "../components/Brand";
import { Field, PasswordInput, fieldDescription } from "../components/FormFields";

type FormValues = { name: string; email: string; password: string; confirm: string };
type FieldName = keyof FormValues;
type FormErrors = Partial<Record<FieldName | "form", string>>;

const initialValues: FormValues = { name: "", email: "", password: "", confirm: "" };

const planned = [
  "Enviar faturas CSV e XLSX do cartão.",
  "Revisar estabelecimentos e corrigir categorias.",
  "Comparar meses e chegar aos lançamentos de cada total.",
];

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length < 2) errors.name = "Informe seu nome completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Informe um e-mail válido, como nome@exemplo.com.";
  if (values.password.length < 8) errors.password = "Use pelo menos 8 caracteres.";
  if (values.confirm !== values.password || !values.confirm) errors.confirm = "As senhas precisam ser iguais.";
  return errors;
}

const order: FieldName[] = ["name", "email", "password", "confirm"];

export default function RegistrationPage() {
  const { status, signUp } = useAuth();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const alertRef = useRef<HTMLParagraphElement>(null);

  // Creating the account signs the person in; either way the next stop is the home page.
  useEffect(() => {
    if (status === "authenticated") window.location.replace("/");
  }, [status]);

  const change = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const focusFirst = (found: FormErrors) => {
    const first = order.find((field) => found[field]);
    if (first) document.getElementById(`register-${first}`)?.focus();
    else requestAnimationFrame(() => alertRef.current?.focus());
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const local = validate(values);
    setErrors(local);
    if (Object.keys(local).length) { focusFirst(local); return; }

    setSubmitting(true);
    try {
      await signUp({ name: values.name, email: values.email, password: values.password });
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError(0, "Não foi possível criar a conta agora. Tente de novo.");
      const next: FormErrors = {};
      for (const field of ["name", "email", "password"] as const) if (failure.fields[field]) next[field] = failure.fields[field];
      // A 409 is about the e-mail even though it carries no field map.
      if (failure.status === 409) next.email = failure.message;
      if (!Object.keys(next).length) next.form = failure.message;
      setErrors(next);
      setSubmitting(false);
      focusFirst(next);
    }
  };

  const described = (field: FieldName, hint?: string) => fieldDescription(`register-${field}`, { error: errors[field], hint });

  return <div className="registration-page">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="site-header on-night"><div className="page-container header-inner">
      <Brand />
      <nav className="account-nav" aria-label="Navegação de conta"><a className="text-link" href="/login">Entrar</a><a className="text-link" href="/">Voltar ao início</a></nav>
    </div></header>
    <main className="registration-main page-container" id="main-content" tabIndex={-1}>
      <section className="registration-intro" aria-labelledby="registration-title">
        <h1 id="registration-title">Crie sua conta.</h1>
        <p className="lead">Com a conta, as suas faturas ficarão guardadas só para você. O envio de arquivos ainda está em desenvolvimento, e a demonstração com dados fictícios continua aberta a todos.</p>
        <div className="planned-list">
          <h2>Com uma conta, será possível:</h2>
          <ul>{planned.map((item) => <li key={item}><i className="status-mark" aria-hidden="true" />{item}</li>)}</ul>
        </div>
      </section>
      <section className="registration-form-panel" aria-labelledby="form-title">
        <h2 id="form-title">Dados da conta</h2>
        <form onSubmit={submit} noValidate>
          {errors.form && <p ref={alertRef} tabIndex={-1} role="alert" className="form-alert">{errors.form}</p>}
          <Field id="register-name" label="Nome completo" error={errors.name}>
            <input id="register-name" name="name" type="text" autoComplete="name" value={values.name} onChange={(event) => change("name", event.target.value)} aria-invalid={!!errors.name} aria-describedby={described("name")} required />
          </Field>
          <Field id="register-email" label="E-mail" error={errors.email}>
            <input id="register-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="nome@exemplo.com" value={values.email} onChange={(event) => change("email", event.target.value)} aria-invalid={!!errors.email} aria-describedby={described("email")} autoCapitalize="none" spellCheck={false} required />
          </Field>
          <Field id="register-password" label="Senha" hint="8 caracteres ou mais" error={errors.password}>
            <PasswordInput id="register-password" name="password" value={values.password} onChange={(event) => change("password", event.target.value)} autoComplete="new-password" visible={showPassword} onToggle={() => setShowPassword((value) => !value)} invalid={!!errors.password} describedBy={described("password", "hint")} minLength={8} />
          </Field>
          <Field id="register-confirm" label="Confirme a senha" error={errors.confirm}>
            <PasswordInput id="register-confirm" name="confirm" value={values.confirm} onChange={(event) => change("confirm", event.target.value)} autoComplete="new-password" visible={showPassword} invalid={!!errors.confirm} describedBy={described("confirm")} />
          </Field>
          <button className="primary-button is-night form-submit" type="submit" disabled={submitting}>{submitting ? "Criando conta…" : "Criar conta"}</button>
        </form>
        <p className="form-switch">Já tem conta? <a className="text-link" href="/login">Entrar</a></p>
      </section>
    </main>
  </div>;
}
