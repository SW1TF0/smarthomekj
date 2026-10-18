"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/lib/public-actions";
import { CheckIcon } from "./icons";

/** Form wrapper for public server actions: success screen, error text and invalid-field highlighting. */
export function ActionForm({
  action,
  locale,
  submitLabel,
  sendingLabel,
  successText,
  errorText,
  invalidText,
  children,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  locale: string;
  submitLabel: string;
  sendingLabel: string;
  successText: string;
  errorText: string;
  invalidText: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    state?.fields?.forEach((name) => form.querySelector(`[name="${name}"]`)?.setAttribute("aria-invalid", "true"));
  }, [state]);

  if (state?.ok) {
    return (
      <div className="tile bg-cloud p-10 text-center" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
          <CheckIcon size={28} />
        </span>
        <p className="mt-5 text-[21px] font-semibold tracking-tight">{successText}</p>
      </div>
    );
  }

  return (
    <form ref={ref} action={formAction} className="space-y-5" noValidate={false}>
      <input type="hidden" name="locale" value={locale} />
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {children}
      {state && !state.ok && (
        <p className="text-[14px] text-danger" role="alert">
          {state.error === "invalid" ? invalidText : errorText}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? sendingLabel : submitLabel}
      </button>
    </form>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  textarea,
  defaultValue,
  autoComplete,
  rows = 5,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  defaultValue?: string;
  autoComplete?: string;
  rows?: number;
}) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {textarea ? (
        <textarea id={id} name={name} required={required} rows={rows} defaultValue={defaultValue} className="field" />
      ) : (
        <input id={id} name={name} type={type} required={required} defaultValue={defaultValue} autoComplete={autoComplete} className="field" />
      )}
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  options: Record<string, string>;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="label">
        {label}
      </label>
      <select id={`f-${name}`} name={name} defaultValue={defaultValue} required={required} className="field appearance-none">
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Renders "text {link} text" templates with a link in place of the placeholder. */
export function LinkedText({ template, links }: { template: string; links: Record<string, { href: string; label: string }> }) {
  const parts = template.split(/(\{\w+\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const key = part.match(/^\{(\w+)\}$/)?.[1];
        const link = key ? links[key] : undefined;
        return link ? (
          <a key={i} href={link.href} target="_blank" rel="noreferrer" className="text-link underline">
            {link.label}
          </a>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}
