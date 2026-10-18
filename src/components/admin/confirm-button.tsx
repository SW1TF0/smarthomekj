"use client";

import { useState } from "react";

/** Asks for confirmation, then runs the action. */
export function ConfirmButton({
  children,
  message,
  onConfirm,
  className = "text-[13px] text-danger hover:underline",
}: {
  children: React.ReactNode;
  message: string;
  onConfirm: () => Promise<unknown> | void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        if (!confirm(message)) return;
        setBusy(true);
        try {
          await onConfirm();
        } catch (e) {
          alert((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
    </button>
  );
}
