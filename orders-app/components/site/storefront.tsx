"use client";

import * as React from "react";
import { MotionConfig } from "motion/react";
import { ApiError, fetchMyOrders } from "@/lib/api";
import { groupCatalog } from "@/lib/catalog";
import { statsFor, type MemberStats } from "@/lib/ranks";
import type { MemberSession, Order, Product, Settings } from "@/lib/types";
import { AccountDrawer } from "./account-drawer";
import { CanMarquee } from "./can-marquee";
import { CartBar } from "./cart-bar";
import { CartDrawer } from "./cart-drawer";
import { CartProvider } from "./cart-context";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Leaderboard } from "./leaderboard";
import { Menu } from "./menu";

interface StorefrontProps {
  products: Product[];
  settings: Settings;
  member: MemberSession;
  onSignOut: () => void;
}

export function Storefront({ products, settings, member, onSignOut }: StorefrontProps) {
  const categories = React.useMemo(() => groupCatalog(products, settings.brandOrder), [products, settings.brandOrder]);
  const drinkCount = products.filter((p) => p.category === "drinks" && p.available).length;

  // The brother's own history feeds both the badge in the top bar and the account panel.
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = React.useState<string | null>(null);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [boardKey, setBoardKey] = React.useState(0);
  const loadOrders = React.useCallback(() => {
    fetchMyOrders()
      .then((r) => {
        setOrders(r.orders);
        setOrdersError(null);
      })
      .catch((err: unknown) => setOrdersError(err instanceof ApiError ? err.message : "Could not load your orders."));
  }, []);
  React.useEffect(() => {
    loadOrders();
  }, [loadOrders, member.token]);
  const stats: MemberStats | null = React.useMemo(() => (orders ? statsFor(orders) : null), [orders]);
  // After an order goes through: refresh the history and nudge the leaderboard to refetch.
  const afterOrder = React.useCallback(() => {
    loadOrders();
    setBoardKey((k) => k + 1);
  }, [loadOrders]);
  const openAccount = React.useCallback(() => setAccountOpen(true), []);
  const closeAccount = React.useCallback(() => setAccountOpen(false), []);

  return (
    <MotionConfig reducedMotion="user">
      <CartProvider products={products}>
        <main className="relative">
          <Hero settings={settings} productCount={drinkCount} member={member} stats={stats} onOpenAccount={openAccount} />
          <CanMarquee />
          <Menu categories={categories} settings={settings} />
          <Leaderboard member={member} refreshKey={boardKey} />
          <HowItWorks settings={settings} />
        </main>
        <Footer settings={settings} />
        <CartBar />
        <CartDrawer settings={settings} member={member} onSignOut={onSignOut} onOrderPlaced={afterOrder} />
        <AccountDrawer
          open={accountOpen}
          onClose={closeAccount}
          member={member}
          orders={orders}
          stats={stats}
          error={ordersError}
          onRefresh={loadOrders}
          onSignOut={onSignOut}
        />
      </CartProvider>
    </MotionConfig>
  );
}
