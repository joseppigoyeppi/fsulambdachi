"use client";

import * as React from "react";
import { MotionConfig } from "motion/react";
import { groupCatalog } from "@/lib/catalog";
import type { Product, Settings } from "@/lib/types";
import { CanMarquee } from "./can-marquee";
import { CartBar } from "./cart-bar";
import { CartDrawer } from "./cart-drawer";
import { CartProvider } from "./cart-context";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Menu } from "./menu";

interface StorefrontProps {
  products: Product[];
  settings: Settings;
}

export function Storefront({ products, settings }: StorefrontProps) {
  const categories = React.useMemo(() => groupCatalog(products, settings.brandOrder), [products, settings.brandOrder]);
  const drinkCount = products.filter((p) => p.category === "drinks" && p.available).length;
  return (
    <MotionConfig reducedMotion="user">
      <CartProvider products={products}>
        <main className="relative">
          <Hero settings={settings} productCount={drinkCount} />
          <CanMarquee />
          <Menu categories={categories} settings={settings} />
          <HowItWorks settings={settings} />
        </main>
        <Footer settings={settings} />
        <CartBar />
        <CartDrawer settings={settings} />
      </CartProvider>
    </MotionConfig>
  );
}
