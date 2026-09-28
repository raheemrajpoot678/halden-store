"use client";

import Image, { type ImageLoader, type ImageProps } from "next/image";

// Unsplash serves photos through its own resizing CDN (imgix), so request the
// exact width the browser needs from it instead of proxying full-size originals
// through the Next.js image optimizer.
const unsplashLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  return url.toString();
};

export function UnsplashImage({ alt, ...props }: Omit<ImageProps, "loader">) {
  return <Image loader={unsplashLoader} alt={alt} {...props} />;
}
