import type { ChangeEvent, ReactNode } from "react";

export const fieldDescription = (id: string, { hint, error }: { hint?: string; error?: string }) =>
  [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;

// One labelled field: label and hint on a row, the control, then its inline error.
export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
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
  visible: boolean;
  onToggle?: () => void;
  invalid?: boolean;
  describedBy?: string;
  minLength?: number;
};

// A password input with an optional show/hide control inside its right edge.
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
