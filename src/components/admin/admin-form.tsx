"use client";

import { useState } from "react";
import { authError } from "@/lib/admin-store";

/** Client form for the admin: runs onSubmit with the form data and shows the result. */
export function AdminForm({
  onSubmit,
  children,
  submitLabel = "Запази",
  successText = "Запазено.",
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  onSubmit: (form: FormData) => Promise<void | string>;
  children: React.ReactNode;
  submitLabel?: string;
  successText?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, setState] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setPending(true);
        setState(null);
        try {
          const error = await onSubmit(new FormData(form));
          if (error) setState({ error });
          else {
            setState({ ok: true });
            if (resetOnSuccess) form.reset();
          }
        } catch (err) {
          setState({ error: authError(err) });
        } finally {
          setPending(false);
        }
      }}
    >
      {children}
      {state?.error && (
        <p className="text-[14px] text-danger" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && successText && (
        <p className="text-[14px] text-success" role="status">
          {successText}
        </p>
      )}
      <button className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? "…" : submitLabel}
      </button>
    </form>
  );
}

export const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
export const euroToCents = (v: string) => Math.round(parseFloat(v.replace(",", ".")) * 100);
