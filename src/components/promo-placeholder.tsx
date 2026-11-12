/** A value the owner has not given yet: yellow and dashed, so it cannot be mistaken for a real offer. */
export function PromoPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded-md border-2 border-dashed border-[#b38600] bg-[#ffd60a] px-2 py-0.5 font-bold text-ink" data-placeholder>
      {children}
    </mark>
  );
}
