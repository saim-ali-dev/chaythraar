"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type MediaFrameProps = {
  src: string | null;
  alt: string;
  fallbackTitle: string;
  fallbackDetail?: string | null;
  className?: string;
  imageClassName?: string;
  sizes?: string;
};

export function MediaFrame({
  src,
  alt,
  fallbackTitle,
  fallbackDetail,
  className,
  imageClassName,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: MediaFrameProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src) && !imageFailed;

  return (
    <div className={cn("relative aspect-[16/10] overflow-hidden bg-[var(--color-sand)]", className)}>
      {showImage ? (
        <Image
          src={src!}
          alt={alt}
          fill
          unoptimized
          sizes={sizes}
          className={cn("object-cover object-center", imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-32 flex-col justify-end border-b-2 border-[var(--color-copper)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-copper-deep)]">{fallbackDetail || "CHAYTHRAAR archive"}</p>
          <p className="mt-2 max-w-xl font-editorial text-2xl leading-tight text-[var(--color-ink)]">{fallbackTitle}</p>
        </div>
      )}
    </div>
  );
}