"use client";

import { useState } from "react";
import { useCart, type CartItem } from "./cart-provider";
import { CheckIcon } from "./icons";

export function AddToCartButton({
  item,
  disabled,
  label,
  addedLabel,
  className = "btn btn-primary",
}: {
  item: Omit<CartItem, "quantity">;
  disabled?: boolean;
  label: string;
  addedLabel: string;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={() => {
        add(item);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
    >
      {added ? (
        <>
          <CheckIcon size={18} /> {addedLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
