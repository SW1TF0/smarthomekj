"use client";

export function ConfirmButton({ children, message, className = "text-[13px] text-danger hover:underline" }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
