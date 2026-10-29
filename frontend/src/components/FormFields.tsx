import type { ChangeEvent, ReactNode } from "react";

/**
 * Monta o aria-describedby de um campo: os ids da mensagem de erro e da dica,
 * quando existem. Assim o leitor de tela lê o erro e a dica junto com o campo.
 * Sem nenhum dos dois, devolve undefined e o atributo não aparece.
 */
export function fieldDescription(id: string, { hint, error }: { hint?: string; error?: string }) {
  const ids: string[] = [];
  if (error) {
    ids.push(`${id}-error`);
  }
  if (hint) {
    ids.push(`${id}-hint`);
  }
  if (ids.length === 0) {
    return undefined;
  }
  return ids.join(" ");
}

type FieldProps = {
  id: string; // id do campo, ligado ao label
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode; // o campo em si
};

/** Um campo com nome: o label e a dica numa linha, o campo e, embaixo, o erro. */
export function Field({ id, label, hint, error, children }: FieldProps) {
  return <div className="form-field">
    <div className="field-label-row"><label htmlFor={id}>{label}</label>{hint && <span id={`${id}-hint`}>{hint}</span>}</div>
    {children}
    {error && <p id={`${id}-error`} className="field-error">{error}</p>}
  </div>;
}

type PasswordInputProps = {
  id: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  autoComplete: "current-password" | "new-password";
  visible: boolean; // true mostra a senha em texto
  onToggle?: () => void; // sem ele, o campo fica sem o botão "Mostrar"
  invalid?: boolean;
  describedBy?: string;
  minLength?: number;
};

/** Campo de senha com um botão opcional, dentro da borda direita, para mostrar ou ocultar. */
export function PasswordInput({ id, name, value, onChange, autoComplete, visible, onToggle, invalid, describedBy, minLength }: PasswordInputProps) {
  return <div className="password-wrap">
    <input
      id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete}
      value={value} onChange={onChange} aria-invalid={invalid} aria-describedby={describedBy}
      required minLength={minLength} spellCheck={false} autoCapitalize="none"
    />
    {onToggle && <button type="button" onClick={onToggle} aria-pressed={visible}>{visible ? "Ocultar" : "Mostrar"}<span className="sr-only"> senha</span></button>}
  </div>;
}
