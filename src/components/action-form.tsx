"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitForm, type FormKind, type FormState } from "@/lib/forms";
import { CheckIcon } from "./icons";

export type Receipt = { title: string; print: string; receivedAt: string; fields: Record<string, string> };

/** Public form: validates in the browser, stores in Firestore, then shows a success screen (or a printable receipt). */
export function ActionForm({
  kind,
  locale,
  submitLabel,
  sendingLabel,
  successText,
  errorText,
  invalidText,
  receipt,
  children,
}: {
  kind: FormKind;
  locale: string;
  submitLabel: string;
  sendingLabel: string;
  successText: string;
  errorText: string;
  invalidText: string;
  receipt?: Receipt;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState((_: FormState, form: FormData) => submitForm(kind, form), null);
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
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-white print:hidden">
          <CheckIcon size={28} />
        </span>
        <p className="mt-5 text-[21px] font-semibold tracking-tight">{successText}</p>
        {receipt && state.values && (
          <div className="mx-auto mt-8 max-w-[480px] rounded-[20px] bg-white p-6 text-left text-[15px]">
            <h2 className="text-[17px] font-semibold">{receipt.title}</h2>
            <dl className="mt-4 space-y-2">
              <div>
                <dt className="text-[13px] text-mute">{receipt.receivedAt}</dt>
                <dd>{new Date(state.at ?? Date.now()).toLocaleString(locale, { timeZone: "Europe/Sofia" })}</dd>
              </div>
              {Object.entries(receipt.fields).map(([key, label]) =>
                state.values?.[key] ? (
                  <div key={key}>
                    <dt className="text-[13px] text-mute">{label}</dt>
                    <dd className="whitespace-pre-wrap">{state.values[key]}</dd>
                  </div>
                ) : null,
              )}
            </dl>
            <button type="button" onClick={() => window.print()} className="btn btn-secondary btn-sm mt-6 print:hidden">
              {receipt.print}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form ref={ref} action={formAction} className="space-y-5">
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

/** Fills a field from the page URL (e.g. ?order=KJ…), since static pages cannot read the query on the server. */
function useQueryDefault(name: string, param?: string) {
  useEffect(() => {
    if (!param) return;
    const value = new URLSearchParams(window.location.search).get(param);
    const el = document.getElementById(`f-${name}`) as HTMLInputElement | HTMLSelectElement | null;
    if (value && el && (el.tagName !== "SELECT" || [...(el as HTMLSelectElement).options].some((o) => o.value === value))) el.value = value;
  }, [name, param]);
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
  queryParam,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  defaultValue?: string;
  autoComplete?: string;
  rows?: number;
  queryParam?: string;
}) {
  const id = `f-${name}`;
  useQueryDefault(name, queryParam);
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
  queryParam,
}: {
  label: string;
  name: string;
  options: Record<string, string>;
  defaultValue?: string;
  required?: boolean;
  queryParam?: string;
}) {
  useQueryDefault(name, queryParam);
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
