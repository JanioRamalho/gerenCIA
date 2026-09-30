import { useState, type FormEvent } from "react";
import UiArrow from "../components/UiArrow";
import SampleReport from "../components/SampleReport";
import "../styles/registration.css";

type FormValues = { name: string; email: string; password: string; confirm: string };
type Field = keyof FormValues;
type FormErrors = Partial<Record<Field, string>>;

const initialValues: FormValues = { name: "", email: "", password: "", confirm: "" };

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length < 2) errors.name = "Informe seu nome completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Informe um e-mail válido.";
  if (values.password.length < 8) errors.password = "Use pelo menos 8 caracteres.";
  if (values.confirm !== values.password || !values.confirm) errors.confirm = "As senhas precisam ser iguais.";
  return errors;
}

export default function RegistrationPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const change = (field: Field, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitted(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`register-${first}`)?.focus();
      return;
    }
    setSubmitted(true);
  };

  return <div className="registration-page">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="registration-header page-container">
      <a className="brand" href="/" aria-label="gerenCIA, início" translate="no"><svg viewBox="0 0 30 29" fill="none" aria-hidden="true"><path d="M2 27h6l3-11H5L2 27Zm10 0h6l5-20h-6l-5 20Zm10 0h6l6-27h-6l-6 27Z" fill="currentColor" /></svg><span>geren<span>CIA</span><i>.</i></span></a>
      <nav aria-label="Navegação de conta"><a href="/login">Entrar</a><a href="/" className="registration-back">Voltar ao início <UiArrow /></a></nav>
    </header>
    <main className="registration-main page-container" id="main-content" tabIndex={-1}>
      <section className="registration-intro" aria-labelledby="registration-title">
        <p className="registration-eyebrow"><span /> Cadastro em desenvolvimento</p>
        <h1 id="registration-title">Da fatura ao detalhe que importa.</h1>
        <p className="registration-lede">O cadastro é uma prévia. Enquanto preparamos as contas pessoais, você pode explorar como o gerenCIA organiza dados fictícios.</p>
        <SampleReport />
        
      </section>
      <section className="registration-form-panel" aria-labelledby="form-title">
        <div className="registration-form-top"><span>Prévia da conta</span><span>Cadastro</span></div>
        <div className="registration-form-heading"><h2 id="form-title">Conheça o formulário.</h2><p>Preencha os campos para experimentar a validação do cadastro.</p></div>
        <div className="registration-preview-note" role="note"><span aria-hidden="true">◎</span><p><strong>Prévia do cadastro</strong> A criação de contas ainda está em desenvolvimento. Nenhum dado deste formulário é enviado ou salvo.</p></div>
        <form onSubmit={submit} noValidate>
          <div className="registration-field"><label htmlFor="register-name">Nome completo</label><input id="register-name" name="name" type="text" autoComplete="name" placeholder="Como podemos chamar você?" value={values.name} onChange={(event) => change("name", event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "register-name-error" : undefined} required />{errors.name && <p id="register-name-error" className="registration-error">{errors.name}</p>}</div>
          <div className="registration-field"><label htmlFor="register-email">E-mail</label><input id="register-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="voce@exemplo.com" value={values.email} onChange={(event) => change("email", event.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "register-email-error" : undefined} required />{errors.email && <p id="register-email-error" className="registration-error">{errors.email}</p>}</div>
          <div className="registration-field"><div className="registration-label-row"><label htmlFor="register-password">Senha</label><span>8 caracteres ou mais</span></div><div className="registration-password-wrap"><input id="register-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Crie uma senha" value={values.password} onChange={(event) => change("password", event.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? "register-password-error" : undefined} required minLength={8} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Mostrar"}</button></div>{errors.password && <p id="register-password-error" className="registration-error">{errors.password}</p>}</div>
          <div className="registration-field"><label htmlFor="register-confirm">Confirme a senha</label><input id="register-confirm" name="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Digite a senha novamente" value={values.confirm} onChange={(event) => change("confirm", event.target.value)} aria-invalid={!!errors.confirm} aria-describedby={errors.confirm ? "register-confirm-error" : undefined} required />{errors.confirm && <p id="register-confirm-error" className="registration-error">{errors.confirm}</p>}</div>
          <button className="registration-submit" type="submit">Continuar <UiArrow direction="diagonal" /></button>
          <p className="registration-status" role="status" aria-live="polite">{submitted ? "Formulário validado. O cadastro estará disponível quando a criação de contas for lançada. Seus dados não foram enviados." : ""}</p>
        </form>
        <p className="registration-login">Já tem uma conta? <a href="/login">Entrar <UiArrow /></a></p>
      </section>
    </main>
  </div>;
}
