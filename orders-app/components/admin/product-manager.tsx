"use client";

import * as React from "react";
import Image from "next/image";
import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/badge";
import * as api from "@/lib/api";
import { asset } from "@/lib/base-path";
import { groupCatalog } from "@/lib/catalog";
import { formatCents } from "@/lib/money";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ActionButton } from "./pending-button";
import { Card } from "./primitives";
import { ProductForm } from "./product-form";
import { useAdmin } from "./session";

interface ProductManagerProps {
  products: Product[];
  brandOrder: string[];
}

/*
  Admin catalog editor. Products are listed per section (Drinks, Merch) and brand, in
  the same order the storefront shows them. Each row has quick actions; the pencil opens
  the full editor inline.
*/
export function ProductManager({ products, brandOrder }: ProductManagerProps) {
  const { mutate } = useAdmin();
  const [adding, setAdding] = React.useState<Category | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const savedTimer = React.useRef<number | null>(null);

  const categories = React.useMemo(() => groupCatalog(products, brandOrder), [products, brandOrder]);
  const allBrands = React.useMemo(() => Array.from(new Set(products.map((p) => p.brand))), [products]);
  const ordered = React.useMemo(() => categories.flatMap((c) => c.brands.flatMap((b) => b.products)), [categories]);

  // After any successful save: close the editor and show a short-lived "Saved" flag on that row.
  const handleSaved = React.useCallback((id: string) => {
    setAdding(null);
    setEditingId(null);
    setSavedId(id);
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSavedId(null), 4000);
  }, []);
  React.useEffect(
    () => () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
    },
    [],
  );
  const closeAdd = React.useCallback(() => setAdding(null), []);

  return (
    <div className="space-y-14">
      {categories.map((category, categoryIndex) => (
        <section key={category.id} aria-labelledby={`section-${category.id}`}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-foreground/60 uppercase">Section</p>
              <h2 id={`section-${category.id}`} className="mt-1 text-2xl tracking-tight md:text-3xl">
                {category.label}{" "}
                <span className="text-base text-foreground/50 tabular-nums">
                  ({category.count} {category.count === 1 ? "product" : "products"})
                </span>
              </h2>
            </div>
            {adding !== category.id && (
              <Button size="md" onClick={() => setAdding(category.id)}>
                <Plus className="size-4" aria-hidden />
                Add to {category.label}
              </Button>
            )}
          </div>

          {adding === category.id && (
            <Card className="mb-6 p-5 md:p-6">
              <h3 className="mb-5 text-xl tracking-tight">New {category.label.toLowerCase()} product</h3>
              <ProductForm brands={allBrands} defaultCategory={category.id} onSaved={handleSaved} onCancel={closeAdd} />
            </Card>
          )}

          {category.count === 0 && adding !== category.id && (
            <Card className="px-6 py-10 text-center">
              <p className="font-medium">Nothing in {category.label} yet.</p>
              <p className="mt-1 text-sm text-foreground/60">
                The storefront shows a &ldquo;coming soon&rdquo; card until you add something here.
              </p>
            </Card>
          )}

          <div className="space-y-8">
            {category.brands.map(({ brand, products: items }, brandIndex) => (
              <div key={brand}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg tracking-tight">
                    {brand} <span className="text-sm text-foreground/50 tabular-nums">({items.length})</span>
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="mr-1 hidden text-xs text-foreground/50 sm:inline">Brand order</span>
                    <ActionButton variant="ghost" size="icon-sm" disabled={brandIndex === 0} aria-label={`Move ${brand} up`} action={() => mutate(() => api.moveBrand(brand, "up"))}>
                      <ChevronUp className="size-4" aria-hidden />
                    </ActionButton>
                    <ActionButton
                      variant="ghost"
                      size="icon-sm"
                      disabled={brandIndex === category.brands.length - 1}
                      aria-label={`Move ${brand} down`}
                      action={() => mutate(() => api.moveBrand(brand, "down"))}
                    >
                      <ChevronDown className="size-4" aria-hidden />
                    </ActionButton>
                  </div>
                </div>

                <Card className="divide-y divide-white/10">
                  {items.map((product) => {
                    const editing = editingId === product.id;
                    const globalIndex = ordered.findIndex((p) => p.id === product.id);
                    return (
                      <div key={product.id} className={cn("p-4 md:px-5", editing && "bg-white/[0.03]")}>
                        <div className="flex items-center gap-4">
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-tile">
                            {product.image && (
                              <Image
                                src={asset(product.image)}
                                alt=""
                                fill
                                sizes="56px"
                                className={product.imageFit === "cover" ? "object-cover" : "object-contain p-1.5"}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2 font-medium">
                              <span className={cn(!product.available && "text-foreground/50 line-through")}>{product.name}</span>
                              {!product.available && <Pill className="bg-danger/15 text-danger">Sold out</Pill>}
                              {savedId === product.id && (
                                <Pill role="status" className="bg-success/15 text-success">
                                  <Check className="mr-1 size-3" aria-hidden />
                                  Saved
                                </Pill>
                              )}
                            </p>
                            <p className="text-xs text-foreground/60">{product.tag || "No size set"}</p>
                          </div>
                          <p className="hidden shrink-0 font-semibold tabular-nums sm:block">{formatCents(product.priceCents)}</p>

                          <div className="flex shrink-0 items-center gap-1">
                            <ActionButton
                              variant="glass"
                              size="sm"
                              className="hidden md:inline-flex"
                              action={() => mutate(() => api.setProductAvailability(product.id, !product.available))}
                            >
                              {product.available ? "Mark sold out" : "Mark available"}
                            </ActionButton>
                            <ActionButton variant="ghost" size="icon-sm" disabled={globalIndex === 0} aria-label={`Move ${product.name} up`} action={() => mutate(() => api.moveProduct(product.id, "up"))}>
                              <ChevronUp className="size-4" aria-hidden />
                            </ActionButton>
                            <ActionButton
                              variant="ghost"
                              size="icon-sm"
                              disabled={globalIndex === ordered.length - 1}
                              aria-label={`Move ${product.name} down`}
                              action={() => mutate(() => api.moveProduct(product.id, "down"))}
                            >
                              <ChevronDown className="size-4" aria-hidden />
                            </ActionButton>
                            <Button
                              variant={editing ? "primary" : "ghost"}
                              size="icon-sm"
                              onClick={() => setEditingId(editing ? null : product.id)}
                              aria-expanded={editing}
                              aria-label={editing ? `Close editor for ${product.name}` : `Edit ${product.name}`}
                            >
                              <Pencil className="size-4" aria-hidden />
                            </Button>
                            <ActionButton
                              variant="ghost"
                              size="icon-sm"
                              className="text-foreground/60 hover:text-danger"
                              aria-label={`Delete ${product.name}`}
                              confirm={`Delete ${product.name}? Past orders keep their copy of it.`}
                              action={() => mutate(() => api.deleteProduct(product.id))}
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </ActionButton>
                          </div>
                        </div>

                        {editing && (
                          <div className="mt-5 border-t border-white/10 pt-5">
                            <ProductForm product={product} brands={allBrands} onSaved={handleSaved} onCancel={() => setEditingId(null)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Card>
              </div>
            ))}
          </div>
          {categoryIndex < categories.length - 1 && <div aria-hidden className="mt-14 h-px bg-white/5" />}
        </section>
      ))}
    </div>
  );
}
