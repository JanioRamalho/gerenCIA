import { useRef, useState, type FormEvent } from "react";
import { ApiError } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import useRedirectSignedInUser from "../auth/useRedirectSignedInUser";
import AccountHeader from "../components/AccountHeader";
import { Field, PasswordInput, fieldDescription } from "../components/FormFields";
import usePageTitle from "../hooks/usePageTitle";

type FormValues = { name: string; email: string; password: string; confirm: string };
type FieldName = keyof FormValues;
type FormErrors = Partial<Record<FieldName | "form", string>>;

const initialValues: FormValues = { name: "", email: "", password: "", confirm: "" };

// Ordem dos campos na tela: o foco vai para o primeiro que tiver erro.
const fieldOrder: FieldName[] = ["name", "email", "password", "confirm"];

// Texto sem espaços, um @, texto, um ponto e mais texto. É a mesma regra da API.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const plannedFeatures = [
  "Enviar faturas CSV e XLSX do cartão.",
  "Revisar estabelecimentos e corrigir categorias.",
  "Comparar meses e chegar aos lançamentos de cada total.",
];

/** Confere os campos antes de chamar a API, para avisar na hora. A API confere tudo de novo. */
function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length < 2) {
    errors.name = "Informe seu nome completo.";
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido, como nome@exemplo.com.";
  }
  if (values.password.length < 8) {
    errors.password = "Use pelo menos 8 caracteres.";
  }
  if (!values.confirm || values.confirm !== values.password) {
    errors.confirm = "As senhas precisam ser iguais.";
  }
  return errors;
}

/**
 * Transforma o erro do cadastro nas mensagens do formulário. Os erros que a API
 * aponta por campo aparecem embaixo de cada campo; os outros, no topo.
 */
function registrationErrorsFrom(error: unknown): FormErrors {
  // Um erro que não veio da API, como a falta de conexão, ganha uma mensagem genérica.
  const failure = error instanceof ApiError ? error : new ApiError(0, "Não foi possível criar a conta agora. Tente de novo.");
  const errors: FormErrors = {};

  for (const field of ["name", "email", "password"] as const) {
    if (failure.fields[field]) {
      errors[field] = failure.fields[field];
    }
  }

  // O 409 (conflito) quer dizer que o e-mail já tem conta, mesmo sem vir por campo.
  if (failure.status === 409) {
    errors.email = failure.message;
  }

  if (Object.keys(errors).length === 0) {
    errors.form = failure.message;
  }
  return errors;
}

/** Página /register: o formulário de cadastro. Criar a conta já deixa a pessoa logada. */
export default function RegistrationPage() {
  const { signUp } = useAuth();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const alertRef = useRef<HTMLParagraphElement>(null);

  usePageTitle("Criar conta | gerenCIA");
  useRedirectSignedInUser();

  // Ao digitar num campo, o erro dele e o aviso do topo somem.
  function change(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  // Leva o foco ao primeiro campo com erro ou, se o erro for geral, ao aviso do topo.
  function focusFirstError(found: FormErrors) {
    const firstField = fieldOrder.find((field) => found[field]);
    if (firstField) {
      document.getElementById(`register-${firstField}`)?.focus();
    } else {
      requestAnimationFrame(() => alertRef.current?.focus());
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    // Os erros que dá para ver sem a API (nome curto, e-mail sem @...) param aqui.
    const localErrors = validate(values);
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) {
      focusFirstError(localErrors);
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ name: values.name, email: values.email, password: values.password });
      // Deu certo: useRedirectSignedInUser leva a pessoa para o painel.
    } catch (error) {
      const apiErrors = registrationErrorsFrom(error);
      setErrors(apiErrors);
      setSubmitting(false);
      focusFirstError(apiErrors);
    }
  }

  // Liga cada campo à sua mensagem de erro e à sua dica, para o leitor de tela.
  const described = (field: FieldName, hint?: string) => fieldDescription(`register-${field}`, { error: errors[field], hint });

  return <div className="registration-page">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <AccountHeader switchHref="/login" switchLabel="Entrar" />
    <main className="registration-main page-container" id="main-content" tabIndex={-1}>
      <RegistrationIntro />
      <section className="registration-form-panel" aria-labelledby="form-title">
        <h2 id="form-title">Dados da conta</h2>
        <form onSubmit={submit} noValidate>
          {errors.form && <p ref={alertRef} tabIndex={-1} role="alert" className="form-alert">{errors.form}</p>}
          <Field id="register-name" label="Nome completo" error={errors.name}>
            <input
              id="register-name" name="name" type="text" autoComplete="name"
              value={values.name} onChange={(event) => change("name", event.target.value)}
              aria-invalid={!!errors.name} aria-describedby={described("name")} required
            />
          </Field>
          <Field id="register-email" label="E-mail" error={errors.email}>
            <input
              id="register-email" name="email" type="email" autoComplete="email" inputMode="email"
              placeholder="nome@exemplo.com" value={values.email} onChange={(event) => change("email", event.target.value)}
              aria-invalid={!!errors.email} aria-describedby={described("email")}
              autoCapitalize="none" spellCheck={false} required
            />
          </Field>
          <Field id="register-password" label="Senha" hint="8 caracteres ou mais" error={errors.password}>
            <PasswordInput
              id="register-password" name="password" value={values.password} onChange={(event) => change("password", event.target.value)}
              autoComplete="new-password" visible={showPassword} onToggle={() => setShowPassword(!showPassword)}
              invalid={!!errors.password} describedBy={described("password", "hint")} minLength={8}
            />
          </Field>
          {/* Sem botão próprio: o "Mostrar" da senha mostra os dois campos. */}
          <Field id="register-confirm" label="Confirme a senha" error={errors.confirm}>
            <PasswordInput
              id="register-confirm" name="confirm" value={values.confirm} onChange={(event) => change("confirm", event.target.value)}
              autoComplete="new-password" visible={showPassword}
              invalid={!!errors.confirm} describedBy={described("confirm")}
            />
          </Field>
          <button className="primary-button is-night form-submit" type="submit" disabled={submitting}>
            {submitting ? "Criando conta…" : "Criar conta"}
          </button>
        </form>
        <p className="form-switch">Já tem conta? <a className="text-link" href="/login">Entrar</a></p>
      </section>
    </main>
  </div>;
}

/** O texto ao lado do formulário, com o que a conta vai permitir fazer. */
function RegistrationIntro() {
  return <section className="registration-intro" aria-labelledby="registration-title">
    <h1 id="registration-title">Crie sua conta.</h1>
    <p className="lead">Com a conta, as suas faturas ficarão guardadas só para você. O envio de arquivos ainda está em desenvolvimento, e a demonstração com dados fictícios continua aberta a todos.</p>
    <div className="planned-list">
      <h2>Com uma conta, será possível:</h2>
      <ul>{plannedFeatures.map((item) => <li key={item}><i className="status-mark" aria-hidden="true" />{item}</li>)}</ul>
    </div>
  </section>;
}
