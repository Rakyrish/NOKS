"use client";

import { Check, Loader2, Plus, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { Input, Label, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useWishlist } from "@/lib/use-wishlist";

type Line = {
  key: string;
  slug?: string;
  name: string;
  quantity: string;
  unit: string;
  packaging: string;
};

const newLine = (partial: Partial<Line> = {}): Line => ({
  key: Math.random().toString(36).slice(2),
  name: "",
  quantity: "",
  unit: "kg",
  packaging: "",
  ...partial,
});

export const QuoteBuilder = () => {
  const searchParams = useSearchParams();
  const { items: saved } = useWishlist();

  const [lines, setLines] = React.useState<Line[]>([newLine()]);
  const [state, setState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [reference, setReference] = React.useState("");
  const [error, setError] = React.useState("");
  const [prefilled, setPrefilled] = React.useState(false);

  // Seed the builder from ?product=slug (the Quick Quote buttons).
  React.useEffect(() => {
    if (prefilled) return;
    const slug = searchParams.get("product");
    if (!slug) return;

    setPrefilled(true);
    api
      .product(slug)
      .then((product) =>
        setLines([
          newLine({
            slug: product.slug,
            name: product.name,
            unit: product.unit,
            quantity: String(product.min_order_quantity),
          }),
        ]),
      )
      .catch(() =>
        setLines([newLine({ slug, name: slug.replace(/-/g, " ") })]),
      );
  }, [searchParams, prefilled]);

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );

  const removeLine = (key: string) =>
    setLines((current) => (current.length === 1 ? current : current.filter((l) => l.key !== key)));

  const addSaved = async () => {
    const existing = new Set(lines.map((line) => line.slug).filter(Boolean));
    const toAdd = saved.filter((slug) => !existing.has(slug));
    if (!toAdd.length) return;

    const products = await Promise.all(
      toAdd.map((slug) => api.product(slug).catch(() => null)),
    );

    setLines((current) => [
      ...current.filter((line) => line.name.trim() || line.slug),
      ...products
        .filter((product): product is NonNullable<typeof product> => product !== null)
        .map((product) =>
          newLine({
            slug: product.slug,
            name: product.name,
            unit: product.unit,
            quantity: String(product.min_order_quantity),
          }),
        ),
    ]);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const items = lines
      .filter((line) => line.name.trim())
      .map((line) => ({
        product_slug: line.slug,
        product_name: line.name.trim(),
        quantity: line.quantity || "1",
        unit: line.unit || "kg",
        packaging: line.packaging,
      }));

    if (!items.length) {
      setState("error");
      setError("Add at least one product to your request.");
      return;
    }

    setState("sending");
    setError("");

    try {
      const response = await api.submitQuote({
        full_name: String(form.get("full_name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        company: String(form.get("company") ?? ""),
        country: String(form.get("country") ?? ""),
        delivery_location: String(form.get("delivery_location") ?? ""),
        message: String(form.get("message") ?? ""),
        source: "website",
        items,
      });
      setReference(response.reference);
      setState("sent");
    } catch {
      setState("error");
      setError("We couldn't submit that request. Please check your details and try again.");
    }
  };

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--brand-emerald)] text-white">
          <Check className="size-7" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold text-emerald-900">
          Quotation request received
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-emerald-800">
          Your reference is <strong>{reference}</strong>. A confirmation is on its way to
          your inbox, and a technical sales specialist will respond within one business day.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/products">Continue browsing</Link>
          </Button>
          <Button
            onClick={() => {
              setLines([newLine()]);
              setState("idle");
            }}
          >
            New request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Products */}
      <section className="rounded-2xl border border-line bg-white p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy-900">Products required</h2>
          {saved.length > 0 && (
            <button
              type="button"
              onClick={addSaved}
              className="text-[13px] font-semibold text-[var(--brand-primary)] hover:underline"
            >
              Add {saved.length} saved product{saved.length === 1 ? "" : "s"}
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {lines.map((line, index) => (
            <div
              key={line.key}
              className="grid gap-3 rounded-xl border border-line bg-surface-muted p-4
                         sm:grid-cols-[1fr_100px_88px_120px_auto]"
            >
              <div>
                <Label htmlFor={`line-name-${line.key}`} className="sr-only">
                  Product {index + 1}
                </Label>
                <Input
                  id={`line-name-${line.key}`}
                  value={line.name}
                  onChange={(event) => updateLine(line.key, { name: event.target.value })}
                  placeholder="Product name or CAS number"
                />
              </div>
              <Input
                aria-label={`Quantity for product ${index + 1}`}
                value={line.quantity}
                onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                placeholder="Qty"
                type="number"
                min="0"
                step="any"
              />
              <Input
                aria-label={`Unit for product ${index + 1}`}
                value={line.unit}
                onChange={(event) => updateLine(line.key, { unit: event.target.value })}
                placeholder="kg"
              />
              <Input
                aria-label={`Packaging for product ${index + 1}`}
                value={line.packaging}
                onChange={(event) => updateLine(line.key, { packaging: event.target.value })}
                placeholder="Packaging"
              />
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                disabled={lines.length === 1}
                aria-label={`Remove product ${index + 1}`}
                className="grid size-11 place-items-center rounded-xl border border-line bg-white
                           text-slate-400 transition-colors hover:border-rose-200
                           hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setLines((current) => [...current, newLine()])}
        >
          <Plus className="size-4" />
          Add another product
        </Button>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-line bg-white p-7">
        <h2 className="font-display text-lg font-bold text-navy-900">Your details</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="quote-full-name" required>
              Full name
            </Label>
            <Input id="quote-full-name" name="full_name" required autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="quote-company">Company</Label>
            <Input id="quote-company" name="company" autoComplete="organization" />
          </div>
          <div>
            <Label htmlFor="quote-email" required>
              Work email
            </Label>
            <Input id="quote-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="quote-phone">Phone</Label>
            <Input id="quote-phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div>
            <Label htmlFor="quote-country">Country</Label>
            <Input id="quote-country" name="country" autoComplete="country-name" />
          </div>
          <div>
            <Label htmlFor="quote-delivery">Delivery location</Label>
            <Input id="quote-delivery" name="delivery_location" placeholder="City / plant" />
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="quote-notes">Additional notes</Label>
          <Textarea
            id="quote-notes"
            name="message"
            rows={4}
            placeholder="Grade requirements, required delivery date, documentation needs…"
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[13px] text-rose-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-6" disabled={state === "sending"}>
          {state === "sending" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="size-4" />
              Submit quotation request
            </>
          )}
        </Button>
      </section>
    </form>
  );
};
