"use client";

import Image from "next/image";
import { useState } from "react";
import { getSafeImageSource, isImageOptimizable } from "@/lib/media-images";
import { cn } from "@/lib/utils";

type MediaFrameProps = {
  src: string | null;
  alt: string;
  fallbackTitle: string;
  fallbackDetail?: string | null;
  imageSource?: string | null;
  imageSourceUrl?: string | null;
  imageCredit?: string | null;
  imageLicense?: string | null;
  imageLicenseUrl?: string | null;
  imageChanges?: string | null;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  preload?: boolean;
};

export function MediaFrame({
  src,
  alt,
  fallbackTitle,
  fallbackDetail,
  imageSource,
  imageSourceUrl,
  imageCredit,
  imageLicense,
  imageLicenseUrl,
  imageChanges,
  className,
  imageClassName,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  preload = false,
}: MediaFrameProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const safeSrc = getSafeImageSource(src, Boolean(imageSource?.trim() && imageLicense?.trim()));
  const safeSourceUrl = getSafeImageSource(imageSourceUrl ?? null, true);
  const safeLicenseUrl = getSafeImageSource(imageLicenseUrl ?? null, true);
  const showImage = safeSrc !== null && failedSrc !== safeSrc;

  return (
    <figure className="min-w-0">
      <div className={cn("relative aspect-[16/10] overflow-hidden bg-[var(--color-sand)]", className)}>
        {showImage && safeSrc ? (
          <Image
            src={safeSrc}
            alt={alt || fallbackTitle}
            fill
            unoptimized={!isImageOptimizable(safeSrc)}
            loading={preload ? "eager" : "lazy"}
            sizes={sizes}
            className={cn("object-cover object-center", imageClassName)}
            onError={() => setFailedSrc(safeSrc)}
          />
        ) : (
          <>
            <Image
              src="/images/archive-media-fallback.svg"
              alt=""
              fill
              loading={preload ? "eager" : "lazy"}
              sizes={sizes}
              aria-hidden="true"
              className="object-cover"
            />
            <div className="relative z-10 flex h-full min-h-32 flex-col justify-end bg-gradient-to-t from-[var(--background)] via-[var(--background)]/85 to-transparent p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-copper-deep)]">{fallbackDetail || "CHAYTHRAAR archive"}</p>
              <p className="mt-2 line-clamp-2 max-w-xl break-words font-editorial text-xl leading-tight text-[var(--color-ink)]">{fallbackTitle}</p>
              <p className="mt-2 text-[11px] font-medium text-[var(--color-muted)]">Archive artwork · no verified photograph available</p>
            </div>
          </>
        )}
      </div>
      {showImage && <figcaption className="flex flex-wrap gap-x-3 gap-y-1 border-b border-[var(--color-line)] px-3 py-2 text-[11px] leading-4 text-[var(--color-muted)]">
        {imageCredit && <span className="break-all">Photo: {imageCredit}</span>}
        {imageSource && <span className="break-all">Source: {safeSourceUrl ? <a className="underline underline-offset-2" href={safeSourceUrl} target="_blank" rel="noopener noreferrer">{imageSource}</a> : imageSource}</span>}
        {imageLicense && <span className="break-all">License: {safeLicenseUrl ? <a className="underline underline-offset-2" href={safeLicenseUrl} target="_blank" rel="noopener noreferrer">{imageLicense}</a> : imageLicense}</span>}
        {imageChanges && <span className="basis-full break-words">Changes: {imageChanges}</span>}
        {!imageCredit && !imageSource && !imageLicense && <span>Image attribution not recorded</span>}
      </figcaption>}
    </figure>
  );
}