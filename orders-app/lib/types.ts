export type ImageFit = "contain" | "cover";

export type Category = "drinks" | "merch";

export const CATEGORIES: { id: Category; label: string; blurb: string }[] = [
  { id: "drinks", label: "Drinks", blurb: "Stock up for the weekend." },
  { id: "merch", label: "Merch", blurb: "Rep the chapter." },
];

export interface Product {
  id: string;
  /** Which storefront section the product lives in. */
  category: Category;
  brand: string;
  name: string;
  /** Short line under the name, e.g. "8-pack · 12 oz cans". */
  tag: string;
  description: string;
  /** Whole cents, so $18.99 is 1899. Avoids floating point drift in totals. */
  priceCents: number;
  /** Path under /public, an /api/files/... path, or an absolute https URL. */
  image: string;
  imageFit: ImageFit;
  available: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "delivered", "cancelled"];

export interface OrderItem {
  productId: string;
  brand: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  /** Human-facing sequential number, starts at 1001. */
  number: number;
  firstName: string;
  lastName: string;
  /** "First Last", kept for display, search, and CSV. */
  fullName: string;
  items: OrderItem[];
  totalCents: number;
  /** File name inside data/uploads/screenshots. */
  screenshot: string;
  note: string;
  status: OrderStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  storeName: string;
  chapterName: string;
  tagline: string;
  /** Shown at checkout before the screenshot upload, e.g. "Venmo @ZetaRho-LCA". */
  paymentInstructions: string;
  storeOpen: boolean;
  closedMessage: string;
  /** Brands render in this order; unknown brands follow alphabetically. */
  brandOrder: string[];
  /** Only present in admin responses. */
  nextOrderNumber?: number;
}

