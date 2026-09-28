import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { getStockStatus } from "@/lib/stock";
import { UnsplashImage } from "@/components/unsplash-image";

export function ProductCard({
  product,
  sizes,
}: {
  product: Product;
  sizes: string;
}) {
  const [image] = product.images;
  const soldOut = getStockStatus(product.stock).state === "sold-out";
  const badge = soldOut ? "Sold out" : product.badge;

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col gap-3">
      <div className="media-frame">
        <UnsplashImage
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          className="transition-transform duration-700 ease-standard group-hover:scale-[1.03]"
        />
        {badge ? (
          <span className="eyebrow absolute top-3 left-3 bg-canvas px-2 py-1">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 px-1 text-body-sm">
        <p className="eyebrow text-ink-subtle">{product.category}</p>
        <h3 className="group-hover:underline group-hover:underline-offset-4">
          {product.name}
        </h3>
        <p className="text-ink-muted">{formatPrice(product.priceCents)}</p>
      </div>
    </Link>
  );
}
