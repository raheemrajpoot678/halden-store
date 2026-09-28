// Editorial storefront content. Products and categories live in the database
// (see src/lib/products.ts); the homepage rows below pick them by slug.

import type { Photo } from "@/db/schema";

export type { Photo };

export type Collection = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  image: Photo;
};

export type NavItem = {
  label: string;
  href: string;
};

function unsplash(id: string, alt: string): Photo {
  return {
    src: `https://images.unsplash.com/photo-${id}`,
    alt,
  };
}

export const primaryNav: NavItem[] = [
  { label: "New In", href: "/collections/new-in" },
  { label: "Women", href: "/collections/women" },
  { label: "Men", href: "/collections/men" },
  { label: "Bags", href: "/collections/bags" },
  { label: "Shoes", href: "/collections/shoes" },
  { label: "Gifts", href: "/collections/gifts" },
];

export const hero = {
  eyebrow: "Autumn–Winter 2026",
  title: "Quiet Tailoring",
  description:
    "Soft structure, honest materials and a palette drawn from the season’s turning light.",
  primaryCta: { label: "Discover the collection", href: "/collections/new-in" },
  secondaryCta: { label: "Shop ready-to-wear", href: "/collections/ready-to-wear" },
  images: [
    unsplash(
      "1539533018447-63fcce2678e3",
      "Woman walking down stone steps in a belted camel trench coat",
    ),
    unsplash(
      "1539109136881-3be0616acf4b",
      "Woman in a pale blue coat standing in a cathedral square",
    ),
  ],
};

export const featuredCollections: Collection[] = [
  {
    slug: "women",
    eyebrow: "Women",
    title: "The Evening Edit",
    description: "Fluid silhouettes in colour that holds a room.",
    image: unsplash(
      "1595777457583-95e059d581b8",
      "Woman in a flowing red gown turning on a garden path",
    ),
  },
  {
    slug: "men",
    eyebrow: "Men",
    title: "Modern Tailoring",
    description: "Sharp shoulders, softened, for every day.",
    image: unsplash(
      "1617137968427-85924c800a22",
      "Man in a navy suit and brown shoes walking past a glass building",
    ),
  },
];

export const homeCategorySlugs = [
  "ready-to-wear",
  "bags",
  "shoes",
  "jewelry",
];

export const editorial = {
  eyebrow: "The Workshop",
  title: "Made slowly, by hand",
  body: [
    "Every piece begins at a workbench. Leather is cut by eye, edges are painted in layers and stitching is finished by the same hands that started it.",
    "It takes longer. That is the point.",
  ],
  cta: { label: "Inside the workshop", href: "/stories/workshop" },
  image: unsplash(
    "1581044777550-4cfa60707c03",
    "Woman in a pink ruffled blouse holding sunglasses in a wheat field",
  ),
};

export const newArrivalSlugs = [
  "lune-top-handle-bag",
  "riviera-woven-leather-bag",
  "monk-strap-shoe",
  "embossed-mini-bag",
  "brogue-derby",
  "pointed-leather-pump",
  "archive-leather-backpack",
  "petrol-satchel",
];

export const giftEditSlugs = [
  "chain-link-bracelet",
  "pearl-strand-necklace",
  "round-metal-sunglasses",
  "minimal-leather-watch",
  "bridle-leather-belt",
  "bifold-wallet",
  "technical-bomber",
  "cotton-crewneck-sweatshirt",
];

// Curated listings served at /collections/[slug] alongside the database
// categories, until collections are modelled. Rows render in slug order.
export type CuratedCollection = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  productSlugs: string[];
};

export const curatedCollections: CuratedCollection[] = [
  {
    slug: "women",
    eyebrow: "Collection",
    title: "Women",
    description: "Bags, shoes and jewellery with a quiet, considered line.",
    productSlugs: [
      "lune-top-handle-bag",
      "embossed-mini-bag",
      "riviera-woven-leather-bag",
      "petrol-satchel",
      "pointed-leather-pump",
      "pearl-strand-necklace",
      "chain-link-bracelet",
      "round-metal-sunglasses",
    ],
  },
  {
    slug: "men",
    eyebrow: "Collection",
    title: "Men",
    description: "Tailored leather, hard-wearing shoes and everyday layers.",
    productSlugs: [
      "technical-bomber",
      "cotton-crewneck-sweatshirt",
      "monk-strap-shoe",
      "brogue-derby",
      "archive-leather-backpack",
      "bifold-wallet",
      "bridle-leather-belt",
      "minimal-leather-watch",
    ],
  },
  {
    slug: "gifts",
    eyebrow: "Considered gifts",
    title: "The Gift Edit",
    description: "Pieces chosen to be given, and kept for years.",
    productSlugs: giftEditSlugs,
  },
];

export function getCuratedCollection(slug: string) {
  return curatedCollections.find((collection) => collection.slug === slug);
}

// Shown on /help/contact and the help pages. Replace with the real inbox
// and phone line before launch.
export const clientServices = {
  email: "clientservices@halden.example",
  phone: "+1 (212) 555-0142",
  hours: "Monday to Friday, 9am–6pm ET",
};

export const services = [
  {
    title: "Complimentary shipping",
    body: "Free express delivery on every order, packed in our signature box.",
  },
  {
    title: "Easy returns",
    body: "Return or exchange within 30 days, collected from your door.",
  },
  {
    title: "Book an appointment",
    body: "Shop in person or by video with a client advisor.",
  },
  {
    title: "Personalisation",
    body: "Hot-stamp initials on selected leather goods.",
  },
];

export const footerNav: { title: string; links: NavItem[] }[] = [
  {
    title: "Client services",
    links: [
      { label: "Contact us", href: "/help/contact" },
      { label: "Shipping", href: "/help/shipping" },
      { label: "Returns", href: "/help/returns" },
      { label: "FAQ", href: "/help" },
    ],
  },
  {
    title: "The company",
    links: [
      { label: "About Halden", href: "/about" },
      { label: "Craftsmanship", href: "/stories/workshop" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of sale", href: "/legal/terms" },
      { label: "Cookie settings", href: "/legal/cookies" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];
