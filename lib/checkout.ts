const value = (form: FormData, key: string) => String(form.get(key) || "").trim();

export function validateDelivery(form: FormData) {
  const errors: Record<string, string> = {};
  if (!value(form, "name")) errors.name = "Enter your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value(form, "email"))) errors.email = "Enter a valid email";
  if (!value(form, "address")) errors.address = "Enter an address";
  if (!value(form, "city")) errors.city = "Enter a city";
  if (!value(form, "postalCode")) errors.postalCode = "Enter a postal code";
  return errors;
}

export function confirmationReference(now = new Date(), random = Math.random) {
  const day = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `DEMO-${day}-${String(Math.floor(random() * 10000)).padStart(4, "0")}`;
}
