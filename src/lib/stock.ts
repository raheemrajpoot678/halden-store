export const LOW_STOCK_THRESHOLD = 3;

export type StockStatus =
  | { state: "in-stock"; label: string }
  | { state: "low-stock"; label: string }
  | { state: "sold-out"; label: string };

export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return { state: "sold-out", label: "Sold out" };
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { state: "low-stock", label: `Only ${stock} left` };
  }
  return { state: "in-stock", label: "In stock" };
}
