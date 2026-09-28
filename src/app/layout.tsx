import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Halden",
    template: "%s | Halden",
  },
  description: "Halden: bags, shoes, jewellery and ready-to-wear, made slowly by hand.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {/* Storefront chrome lives in (store)/layout.tsx; admin has its own. */}
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
