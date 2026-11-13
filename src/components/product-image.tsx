"use client";

import Image from "next/image";
import { useState } from "react";
import { fastImage } from "@/lib/images";

/** A product photo: the WebP copy when there is one, the original upload when the copy is missing. */
export function ProductImage({ src, alt, className, sizes }: { src: string; alt: string; className?: string; sizes?: string }) {
  const fast = fastImage(src);
  const [current, setCurrent] = useState(fast);
  return (
    <Image
      src={current}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      onError={() => {
        if (current !== src) setCurrent(src);
      }}
    />
  );
}
