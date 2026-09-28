import { getCart } from "@/lib/cart";

// Read by the header badge and mini bag on the client, so the ISR pages that
// render the header never touch cookies.
export async function GET() {
  return Response.json(await getCart(), {
    headers: { "Cache-Control": "no-store" },
  });
}
