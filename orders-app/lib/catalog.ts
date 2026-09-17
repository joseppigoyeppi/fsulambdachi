import { CATEGORIES, type Category, type Product } from "./types";

/* Pure helpers for grouping the catalog. Safe to import from client components. */

export function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

/** Brands in the configured order, then any others alphabetically. */
export function orderedBrands(products: Product[], brandOrder: string[]): string[] {
  const present = Array.from(new Set(products.map((p) => p.brand)));
  const ranked = brandOrder.filter((b) => present.includes(b));
  const rest = present.filter((b) => !ranked.includes(b)).sort((a, b) => a.localeCompare(b));
  return [...ranked, ...rest];
}

export interface BrandGroup {
  brand: string;
  products: Product[];
}

export interface CategoryGroup {
  id: Category;
  label: string;
  blurb: string;
  brands: BrandGroup[];
  count: number;
}

/** Every category (even empty ones) with its brands and products in display order. */
export function groupCatalog(products: Product[], brandOrder: string[]): CategoryGroup[] {
  const sorted = sortProducts(products);
  return CATEGORIES.map((category) => {
    const inCategory = sorted.filter((p) => p.category === category.id);
    const brands = orderedBrands(inCategory, brandOrder).map((brand) => ({
      brand,
      products: inCategory.filter((p) => p.brand === brand),
    }));
    return { ...category, brands, count: inCategory.length };
  });
}
