"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useBag } from "@/components/bag-provider";
import { bagSubtotal } from "@/lib/bag";
import { confirmationReference, validateDelivery } from "@/lib/checkout";
import { formatMoney } from "@/lib/money";
import { site } from "@/lib/site";

const fields = [
  { name: "name", label: "Full name", autoComplete: "name", type: "text" },
  { name: "email", label: "Email", autoComplete: "email", type: "email" },
  { name: "address", label: "Address", autoComplete: "street-address", type: "text" },
  { name: "city", label: "City", autoComplete: "address-level2", type: "text" },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code", type: "text" },
] as const;

export default function CheckoutPage() {
  const { lines, clear } = useBag();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reference, setReference] = useState<string>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDelivery(new FormData(event.currentTarget));
    setErrors(nextErrors);

    const firstInvalid = fields.find(({ name }) => nextErrors[name]);
    if (firstInvalid) {
      const input = event.currentTarget.elements.namedItem(firstInvalid.name);
      if (input instanceof HTMLElement) input.focus();
      return;
    }

    setReference(confirmationReference());
    clear();
  }

  if (reference) {
    return (
      <section className="checkout-page checkout-confirmation">
        <p className="eyebrow">Simulated checkout complete</p>
        <h1>Thank you</h1>
        <p className="confirmation-reference">Reference <strong>{reference}</strong></p>
        <p>Nothing was charged or shipped.</p>
        <Link className="button button-primary" href="/">Return home</Link>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="checkout-page">
        <p className="eyebrow">Simulated checkout</p>
        <h1>Your bag is empty</h1>
        <p>Add something to your bag before continuing.</p>
        <Link className="button button-primary" href="/collection">Explore the collection</Link>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="checkout-heading">
        <p className="eyebrow">Simulated checkout</p>
        <h1>Delivery details</h1>
        <p>{site.checkoutNotice}</p>
      </div>
      <form className="checkout-form" noValidate onSubmit={handleSubmit}>
        <div className="checkout-fields">
          {fields.map(({ name, label, autoComplete, type }) => {
            const errorId = `${name}-error`;
            return (
              <label key={name}>
                <span>{label}</span>
                <input
                  name={name}
                  type={type}
                  autoComplete={autoComplete}
                  required
                  aria-invalid={Boolean(errors[name])}
                  aria-describedby={errors[name] ? errorId : undefined}
                />
                {errors[name] && <span className="field-error" id={errorId}>{errors[name]}</span>}
              </label>
            );
          })}
        </div>
        <div className="checkout-summary">
          <p><span>Subtotal</span><strong>{formatMoney(bagSubtotal(lines), "EUR")}</strong></p>
          <div className="checkout-submit">
            <button className="button button-primary" type="submit">Complete simulated checkout</button>
            <p>{site.checkoutNotice}</p>
          </div>
        </div>
      </form>
    </section>
  );
}
