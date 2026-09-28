import type { Photo } from "@/lib/catalog";
import { UnsplashImage } from "@/components/unsplash-image";

// Mobile: edge-to-edge swipeable strip. Desktop: images stacked in one column
// so the page scrolls through them beside the sticky product summary.
export function ProductGallery({ images }: { images: Photo[] }) {
  return (
    <div className="relative -mx-gutter lg:mx-0">
      <ul
        aria-label="Product images"
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible"
      >
        {images.map((image, index) => (
          <li key={image.src} className="w-full shrink-0 snap-start">
            <div className="media-frame">
              <UnsplashImage
                src={image.src}
                alt={image.alt}
                fill
                preload={index === 0}
                sizes="(min-width: 64rem) 58vw, 100vw"
              />
            </div>
          </li>
        ))}
      </ul>
      {images.length > 1 ? (
        <p className="eyebrow absolute right-gutter bottom-4 bg-canvas px-2 py-1 lg:hidden">
          {images.length} images · swipe
        </p>
      ) : null}
    </div>
  );
}
