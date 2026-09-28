// Loads the storefront catalogue into the database. Safe to re-run: rows are
// upserted by slug. Run with: npm run db:seed
import "./load-env";
import { sql } from "drizzle-orm";
import { db } from "./index";
import { categories, products, type Photo } from "./schema";

function unsplash(id: string, alt: string): Photo {
  return {
    src: `https://images.unsplash.com/photo-${id}`,
    alt,
  };
}

type CategorySeed = {
  slug: string;
  name: string;
  image?: Photo;
};

type ProductSeed = {
  slug: string;
  name: string;
  categorySlug: string;
  priceCents: number;
  badge?: string;
  stock: number;
  colour: string;
  description: string;
  details: string[];
  images: [Photo, ...Photo[]];
};

const categorySeeds: CategorySeed[] = [
  {
    slug: "ready-to-wear",
    name: "Ready-to-wear",
    image: unsplash(
      "1558769132-cb1aea458c5e",
      "Neutral-toned knitwear hanging on a rail",
    ),
  },
  {
    slug: "bags",
    name: "Bags",
    image: unsplash(
      "1566150905458-1bf1fc113f0d",
      "Blush leather shoulder bag with a chain strap on a white plinth",
    ),
  },
  {
    slug: "shoes",
    name: "Shoes",
    image: unsplash(
      "1560769629-975ec94e6a86",
      "Pair of multicoloured trainers displayed on white blocks",
    ),
  },
  {
    slug: "jewelry",
    name: "Jewellery",
    image: unsplash(
      "1535632066927-ab7c9ab60908",
      "Crystal and sapphire drop earrings resting on a green leaf",
    ),
  },
  { slug: "eyewear", name: "Eyewear" },
  { slug: "watches", name: "Watches" },
  { slug: "accessories", name: "Accessories" },
  { slug: "small-leather-goods", name: "Small leather goods" },
];

const productSeeds: ProductSeed[] = [
  {
    slug: "lune-top-handle-bag",
    name: "Lune top-handle bag",
    categorySlug: "bags",
    priceCents: 2450_00,
    badge: "New",
    stock: 12,
    colour: "Navy",
    description:
      "A compact top-handle bag in pebbled calf leather, with a deep flap and a rolled handle. Structured enough to stand on its own, with room for the day’s essentials.",
    details: [
      "Pebbled calf leather",
      "Press-stud flap closure",
      "Rolled top handle and detachable shoulder strap",
      "Suede lining with one flat pocket",
      "W 22 × H 19 × D 10 cm",
      "Made in Italy",
    ],
    images: [
      unsplash(
        "1560891958-68bb1fe7fb78",
        "Woman in a rust linen dress holding a navy leather top-handle bag",
      ),
    ],
  },
  {
    slug: "riviera-woven-leather-bag",
    name: "Riviera woven leather bag",
    categorySlug: "bags",
    priceCents: 1890_00,
    badge: "New",
    stock: 0,
    colour: "Cognac",
    description:
      "Wide strips of supple nappa, hand-woven into a soft, slouchy shape and carried on a gold-tone chain.",
    details: [
      "Hand-woven nappa leather",
      "Gold-tone chain handle",
      "Magnetic closure",
      "W 38 × H 26 × D 12 cm",
      "Made in Italy",
    ],
    images: [
      unsplash(
        "1598532163257-ae3c6b2524b6",
        "Cognac woven leather bag with a gold chain handle",
      ),
    ],
  },
  {
    slug: "monk-strap-shoe",
    name: "Double monk-strap shoe",
    categorySlug: "shoes",
    priceCents: 980_00,
    stock: 7,
    colour: "Chestnut",
    description:
      "A double monk-strap on a slim last, hand-burnished to bring depth to the leather. Goodyear-welted so it can be resoled for years.",
    details: [
      "Hand-burnished calf leather",
      "Leather lining and sole",
      "Goodyear-welted construction",
      "Brass buckles",
      "Made in Portugal",
    ],
    images: [
      unsplash(
        "1533867617858-e7b97e060509",
        "Pair of brown leather double monk-strap shoes on a dark surface",
      ),
    ],
  },
  {
    slug: "embossed-mini-bag",
    name: "Embossed mini shoulder bag",
    categorySlug: "bags",
    priceCents: 1650_00,
    badge: "New",
    stock: 2,
    colour: "Bordeaux",
    description:
      "A compact shoulder bag in glossy croc-embossed leather, fastened with a geometric gold-tone clasp.",
    details: [
      "Croc-embossed calf leather",
      "Gold-tone hardware",
      "Leather shoulder strap, 55 cm drop",
      "W 17 × H 20 × D 6 cm",
      "Made in Italy",
    ],
    images: [
      unsplash(
        "1575032617751-6ddec2089882",
        "Burgundy croc-embossed mini bag held by its strap",
      ),
    ],
  },
  {
    slug: "brogue-derby",
    name: "Brogue derby",
    categorySlug: "shoes",
    priceCents: 890_00,
    stock: 9,
    colour: "Tan",
    description:
      "An open-laced derby with full brogue perforations, cut from a single hide and polished by hand.",
    details: [
      "Calf leather upper",
      "Waxed cotton laces",
      "Leather sole with rubber heel insert",
      "Made in Portugal",
    ],
    images: [
      unsplash(
        "1614252235316-8c857d38b5f4",
        "Close-up of a polished tan leather brogue derby",
      ),
    ],
  },
  {
    slug: "pointed-leather-pump",
    name: "Pointed leather pump",
    categorySlug: "shoes",
    priceCents: 850_00,
    badge: "New",
    stock: 1,
    colour: "Ivory",
    description:
      "A pointed pump in softly grained leather, on a slender 95 mm heel with a cushioned footbed.",
    details: [
      "Grained calf leather",
      "Leather lining and sole",
      "95 mm heel",
      "Made in Italy",
    ],
    images: [
      unsplash(
        "1535043934128-cf0b28d52f95",
        "Pair of ivory pointed leather pumps by a window",
      ),
    ],
  },
  {
    slug: "archive-leather-backpack",
    name: "Archive leather backpack",
    categorySlug: "bags",
    priceCents: 2100_00,
    stock: 5,
    colour: "Cognac",
    description:
      "A soft backpack in vegetable-tanned leather that darkens and softens with wear. Padded laptop sleeve inside.",
    details: [
      "Vegetable-tanned leather",
      "Padded 15-inch laptop sleeve",
      "Adjustable shoulder straps",
      "W 30 × H 42 × D 14 cm",
      "Made in Italy",
    ],
    images: [
      unsplash(
        "1622560480605-d83c853bc5c3",
        "Brown leather backpack with a front pocket",
      ),
    ],
  },
  {
    slug: "petrol-satchel",
    name: "Petrol leather satchel",
    categorySlug: "bags",
    priceCents: 2300_00,
    stock: 4,
    colour: "Petrol",
    description:
      "A structured satchel in deep teal leather with a push-lock closure and a rolled top handle.",
    details: [
      "Smooth calf leather",
      "Gold-tone push-lock",
      "Detachable shoulder strap",
      "W 28 × H 21 × D 10 cm",
      "Made in Italy",
    ],
    images: [
      unsplash(
        "1594223274512-ad4803739b7c",
        "Teal leather satchel with a gold push-lock",
      ),
    ],
  },
  {
    slug: "chain-link-bracelet",
    name: "Chain-link bracelet",
    categorySlug: "jewelry",
    priceCents: 720_00,
    stock: 15,
    colour: "Gold",
    description:
      "Oversized links in gold-plated sterling silver, finished with a hidden box clasp.",
    details: [
      "18k gold-plated sterling silver",
      "Box clasp",
      "Length 19 cm",
      "Made in Italy",
    ],
    images: [
      unsplash(
        "1602173574767-37ac01994b2a",
        "Chunky gold chain-link bracelet lying on an open magazine",
      ),
    ],
  },
  {
    slug: "pearl-strand-necklace",
    name: "Pearl strand necklace",
    categorySlug: "jewelry",
    priceCents: 1350_00,
    stock: 0,
    colour: "Ivory",
    description:
      "A single strand of hand-knotted freshwater pearls, fastened with a crystal-set clasp.",
    details: [
      "Freshwater pearls, 7–8 mm",
      "Hand-knotted silk thread",
      "Crystal-set sterling silver clasp",
      "Length 45 cm",
    ],
    images: [
      unsplash(
        "1515562141207-7a88fb7ce338",
        "Pearl necklace with a crystal clasp in a red presentation box",
      ),
    ],
  },
  {
    slug: "round-metal-sunglasses",
    name: "Round metal sunglasses",
    categorySlug: "eyewear",
    priceCents: 410_00,
    stock: 20,
    colour: "Gold / green",
    description:
      "Fine round metal frames with mineral glass lenses and adjustable nose pads.",
    details: [
      "Gold-tone metal frame",
      "Green mineral glass lenses, 100% UV protection",
      "Adjustable nose pads",
      "Leather case included",
    ],
    images: [
      unsplash(
        "1511499767150-a48a237f0083",
        "Round gold-framed sunglasses with dark green lenses",
      ),
    ],
  },
  {
    slug: "minimal-leather-watch",
    name: "Minimal leather-strap watch",
    categorySlug: "watches",
    priceCents: 1150_00,
    stock: 3,
    colour: "White / brown",
    description:
      "A clean white dial in a slim steel case, on a hand-stitched leather strap.",
    details: [
      "36 mm stainless steel case",
      "Swiss quartz movement",
      "Sapphire crystal",
      "Water resistant to 50 m",
      "Interchangeable leather strap",
    ],
    images: [
      unsplash(
        "1524592094714-0f0654e20314",
        "Hand holding a watch with a white dial and brown leather strap",
      ),
    ],
  },
  {
    slug: "bridle-leather-belt",
    name: "Bridle leather belt",
    categorySlug: "accessories",
    priceCents: 450_00,
    stock: 18,
    colour: "Tan",
    description:
      "A 35 mm belt in English bridle leather with a solid brass buckle. Stiff at first, then yours.",
    details: [
      "English bridle leather",
      "Solid brass buckle",
      "Width 35 mm",
      "Made in England",
    ],
    images: [
      unsplash(
        "1624222247344-550fb60583dc",
        "Close-up of a tan leather belt with a brass buckle",
      ),
    ],
  },
  {
    slug: "bifold-wallet",
    name: "Bifold wallet",
    categorySlug: "small-leather-goods",
    priceCents: 390_00,
    stock: 25,
    colour: "Brown",
    description:
      "A slim bifold with eight card slots and a full-length note compartment, edge-painted by hand.",
    details: [
      "Calf leather",
      "Eight card slots, two note compartments",
      "Hand-painted edges",
      "W 11 × H 9 cm closed",
    ],
    images: [
      unsplash(
        "1627123424574-724758594e93",
        "Brown leather bifold wallet on a dark background",
      ),
    ],
  },
  {
    slug: "technical-bomber",
    name: "Technical bomber jacket",
    categorySlug: "ready-to-wear",
    priceCents: 1790_00,
    stock: 6,
    colour: "Rust",
    description:
      "A lightweight bomber in water-repellent technical twill, with ribbed trims and a two-way zip.",
    details: [
      "Water-repellent technical twill",
      "Ribbed collar, cuffs and hem",
      "Two-way zip",
      "Regular fit",
      "Made in Italy",
    ],
    images: [
      unsplash(
        "1591047139829-d91aecb6caea",
        "Rust-coloured bomber jacket on a hanger",
      ),
    ],
  },
  {
    slug: "cotton-crewneck-sweatshirt",
    name: "Cotton crewneck sweatshirt",
    categorySlug: "ready-to-wear",
    priceCents: 590_00,
    stock: 30,
    colour: "Optic white",
    description:
      "Heavyweight loopback cotton, garment-washed for softness, with a relaxed body and ribbed trims.",
    details: [
      "100% organic cotton loopback jersey",
      "Garment-washed",
      "Relaxed fit",
      "Made in Portugal",
    ],
    images: [
      unsplash(
        "1620799140408-edc6dcb6d633",
        "Plain white crewneck sweatshirt laid flat",
      ),
    ],
  },
];

// Overwrite every column except the key and createdAt on conflict.
function excluded(...columns: string[]) {
  return Object.fromEntries(
    columns.map((column) => [column, sql.raw(`excluded.${column}`)]),
  );
}

async function main() {
  const categoryRows = await db
    .insert(categories)
    .values(
      categorySeeds.map(({ slug, name, image }) => ({
        slug,
        name,
        imageUrl: image?.src ?? null,
        imageAlt: image?.alt ?? null,
      })),
    )
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        ...excluded("name", "image_url", "image_alt"),
        updatedAt: new Date(),
      },
    })
    .returning({ id: categories.id, slug: categories.slug });

  const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));

  await db
    .insert(products)
    .values(
      productSeeds.map(({ categorySlug, badge, ...product }) => {
        const categoryId = categoryIds.get(categorySlug);
        if (!categoryId) throw new Error(`Unknown category: ${categorySlug}`);
        return { ...product, categoryId, badge: badge ?? null };
      }),
    )
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        ...excluded(
          "category_id",
          "name",
          "price_cents",
          "stock",
          "badge",
          "colour",
          "description",
          "details",
          "images",
        ),
        updatedAt: new Date(),
      },
    });

  console.log(
    `Seeded ${categorySeeds.length} categories and ${productSeeds.length} products.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
