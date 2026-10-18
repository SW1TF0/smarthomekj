"use client";

import { useActionState } from "react";
import type { AdminState } from "@/app/admin/actions";

export function AdminForm({
  action,
  children,
  submitLabel = "Запази",
  successText = "Запазено.",
  className = "space-y-4",
}: {
  action: (state: AdminState, form: FormData) => Promise<AdminState>;
  children: React.ReactNode;
  submitLabel?: string;
  successText?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p className="text-[14px] text-danger" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
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
