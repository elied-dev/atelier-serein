"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProducts } from "@/components/product-provider";
import { findProduct } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { readOrders, type DemoOrder } from "@/lib/orders";
import { site } from "@/lib/site";

export function OrderHistory({ orders }: { orders: DemoOrder[] }) {
  const products = useProducts();

  if (!orders.length) {
    return (
      <div className="bag-empty">
        <p>No simulated orders yet.</p>
        <Link className="button button-primary" href="/collection">Explore the collection</Link>
      </div>
    );
  }

  return (
    <ol className="order-list">
      {orders.map((order) => (
        <li key={order.reference}>
          <header>
            <h2>{order.reference}</h2>
            <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString("en", { dateStyle: "long" })}</time>
          </header>
          <ul>
            {order.lines.map((line) => {
              const product = findProduct(line.productSlug, products);
              const variant = product?.variants.find(({ id }) => id === line.variantId);
              if (!product || !variant) return null;
              return (
                <li key={`${line.productSlug}-${line.variantId}`}>
                  <Link href={`/product/${product.slug}`}>{product.name}</Link>
                  <span>{variant.name} × {line.quantity}</span>
                </li>
              );
            })}
          </ul>
          <p><span>Total</span><strong>{formatMoney(order.total, "EUR")}</strong></p>
        </li>
      ))}
    </ol>
  );
}

export default function OrdersPage() {
  const products = useProducts();
  const [orders, setOrders] = useState<DemoOrder[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrders(readOrders(localStorage, products));
  }, [products]);

  return (
    <section className="information-page">
      <p className="eyebrow">Your history</p>
      <h1>Simulated orders</h1>
      <OrderHistory orders={orders} />
      <p className="page-demo-notice">{site.demoNotice}</p>
    </section>
  );
}
