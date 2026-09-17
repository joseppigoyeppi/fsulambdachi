"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Hint, Input, Label, Select, Textarea } from "@/components/ui/input";
import * as api from "@/lib/api";
import { asset } from "@/lib/base-path";
import { parseDollarsToCents } from "@/lib/money";
import { CATEGORIES, type Category, type ImageFit, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { errorMessage, useAdmin } from "./session";

interface ProductFormProps {
  product?: Product;
  brands: string[];
  /** Preselected section for a new product. */
  defaultCategory?: Category;
  /** Called after a successful save (create or update) with the saved id. */
  onSaved?: (id: string) => void;
  onCancel?: () => void;
}

/**
 * One form per product. Existing products submit in place; a form with no
 * product creates one. The image can be a pasted URL or an uploaded file.
 */
export function ProductForm({ product, brands, defaultCategory = "drinks", onSaved, onCancel }: ProductFormProps) {
  const { mutate } = useAdmin();
  const key = product?.id ?? "new";
  const [name, setName] = React.useState(product?.name ?? "");
  const [brand, setBrand] = React.useState(product?.brand ?? "");
  const [category, setCategory] = React.useState<Category>(product?.category ?? defaultCategory);
  const [price, setPrice] = React.useState(product ? (product.priceCents / 100).toFixed(2) : "");
  const [tag, setTag] = React.useState(product?.tag ?? "");
  const [description, setDescription] = React.useState(product?.description ?? "");
  const [imageFit, setImageFit] = React.useState<ImageFit>(product?.imageFit ?? "contain");
  const [available, setAvailable] = React.useState(product?.available ?? true);
  const [imageUrl, setImageUrl] = React.useState(product?.image ?? "");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const isNew = !product;

  const onFileChange = (next: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const priceCents = parseDollarsToCents(price);
    if (!name.trim()) return setError("Give the product a name.");
    if (!brand.trim()) return setError("Add a brand (e.g. Sun Cruiser).");
    if (priceCents === null) return setError("Enter a valid price like 18.99.");
    setError(null);
    setPending(true);
    try {
      let savedId = product?.id ?? "";
      await mutate(async () => {
        const result = await api.saveProduct(
          { id: product?.id, name: name.trim(), brand: brand.trim(), category, tag: tag.trim(), description: description.trim(), priceCents, image: imageUrl.trim(), imageFit, available },
          file ? await api.fileToUpload(file) : undefined,
        );
        savedId = result.product.id;
      });
      onSaved?.(savedId);
    } catch (err) {
      setError(errorMessage(err, "Could not save the product."));
    } finally {
      setPending(false);
    }
  };

  const shownImage = preview ?? imageUrl;

  return (
    <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
      <div>
        <div
          className={cn(
            "relative aspect-[4/5] overflow-hidden rounded-2xl bg-tile",
            !shownImage && "flex items-center justify-center bg-white/[0.04] text-xs text-foreground/50",
          )}
        >
          {shownImage ? (
            <Image src={preview ?? asset(imageUrl)} alt="" fill sizes="180px" className={imageFit === "cover" ? "object-cover" : "object-contain p-3"} />
          ) : (
            "No image"
          )}
        </div>
        <label
          htmlFor={`imageFile-${key}`}
          className="liquid-glass mt-3 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full text-xs font-medium transition-colors hover:bg-white/[0.06]"
        >
          <ImagePlus className="size-4" aria-hidden />
          Upload image
        </label>
        <input id={`imageFile-${key}`} type="file" accept="image/*" className="sr-only" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor={`name-${key}`}>Name</Label>
          <Input id={`name-${key}`} name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="Peach Iced Tea" />
        </div>
        <div>
          <Label htmlFor={`category-${key}`}>Section</Label>
          <Select id={`category-${key}`} name="category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`brand-${key}`}>Brand</Label>
          <Input id={`brand-${key}`} name="brand" list="brand-options" value={brand} onChange={(e) => setBrand(e.target.value)} required maxLength={60} placeholder="Sun Cruiser, or e.g. Zeta Rho for merch" />
          <datalist id="brand-options">
            {brands.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor={`price-${key}`}>Price (USD)</Label>
          <Input id={`price-${key}`} name="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="18.99" />
        </div>
        <div>
          <Label htmlFor={`tag-${key}`}>Pack / size</Label>
          <Input id={`tag-${key}`} name="tag" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={80} placeholder="8-pack · 12 oz cans" />
        </div>
        <div>
          <Label htmlFor={`imageFit-${key}`}>Image fit</Label>
          <Select id={`imageFit-${key}`} name="imageFit" value={imageFit} onChange={(e) => setImageFit(e.target.value === "cover" ? "cover" : "contain")}>
            <option value="contain">Contain (product on white)</option>
            <option value="cover">Cover (photo fills card)</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`image-${key}`}>Image URL</Label>
          <Input id={`image-${key}`} name="image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="products/name.webp or https://…" />
          <Hint>Paste a link, or use Upload image on the left — an upload wins over this field.</Hint>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`description-${key}`}>Description</Label>
          <Textarea id={`description-${key}`} name="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} className="min-h-20" placeholder="Real brewed tea + vodka. 4.5% ABV." />
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm sm:col-span-2">
          <input type="checkbox" name="available" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="size-5 cursor-pointer accent-white" />
          Available to order
        </label>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" size="md" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {pending ? "Saving…" : isNew ? "Add product" : "Save changes"}
          </Button>
          {onCancel && (
            <Button variant="ghost" size="md" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          )}
          <FieldError>{error}</FieldError>
        </div>
      </div>
    </form>
  );
}
