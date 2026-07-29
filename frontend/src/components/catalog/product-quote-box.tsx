"use client";

import { Check, GitCompare, Heart, Loader2, Send } from "lucide-react";
import * as React from "react";

import { Input, Label, Select, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useCompare } from "@/lib/use-compare";
import { useWishlist } from "@/lib/use-wishlist";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/types";

export const ProductQuoteBox = ({ product }: { product: ProductDetail }) => {
  const [state, setState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [reference, setReference] = React.useState("");
  const [error, setError] = React.useState("");

  const { toggle: toggleCompare, has: inCompare } = useCompare();
  const { toggle: toggleWishlist, has: inWishlist } = useWishlist();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");

    try {
      const response = await api.submitQuote({
        full_name: String(form.get("full_name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        company: String(form.get("company") ?? ""),
        delivery_location: String(form.get("delivery_location") ?? ""),
        message: String(form.get("message") ?? ""),
        source: "product",
        items: [
          {
            product_slug: product.slug,
            product_name: product.name,
            quantity: String(form.get("quantity") ?? "1"),
            unit: product.unit,
            packaging: String(form.get("packaging") ?? ""),
          },
        ],
      });
      setReference(response.reference);
      setState("sent");
    } catch {
      setState("error");
      setError("We couldn't submit that. Please check your details and try again.");
    }
  };

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--brand-emerald)] text-white">
          <Check className="size-6" />
        </span>
        <p className="mt-4 font-display text-lg font-bold text-emerald-900">
          Request received
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-emerald-800">
          Your reference is <strong>{reference}</strong>. A technical sales specialist will
          respond within one business day.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => setState("idle")}
        >
          Request another quote
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="bg-navy-900 px-6 py-5 text-white">
        <p className="font-display text-lg font-bold">Request a quotation</p>
        <p className="mt-1 text-[13px] text-white/60">
          Pricing is quotation-based. Response within one business day.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 p-6">
        <div>
          <Label htmlFor="quote-name" required>
            Full name
          </Label>
          <Input id="quote-name" name="full_name" required autoComplete="name" />
        </div>

        <div>
          <Label htmlFor="quote-email" required>
            Work email
          </Label>
          <Input id="quote-email" name="email" type="email" required autoComplete="email" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="quote-phone">Phone</Label>
            <Input id="quote-phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div>
            <Label htmlFor="quote-company">Company</Label>
            <Input id="quote-company" name="company" autoComplete="organization" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="quote-quantity" required>
              Quantity ({product.unit})
            </Label>
            <Input
              id="quote-quantity"
              name="quantity"
              type="number"
              min={product.min_order_quantity}
              step="any"
              defaultValue={product.min_order_quantity}
              required
            />
          </div>
          <div>
            <Label htmlFor="quote-packaging">Packaging</Label>
            <Select id="quote-packaging" name="packaging" defaultValue="">
              <option value="">Any</option>
              {product.packaging_options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="quote-location">Delivery location</Label>
          <Input id="quote-location" name="delivery_location" placeholder="City, country" />
        </div>

        <div>
          <Label htmlFor="quote-message">Notes</Label>
          <Textarea
            id="quote-message"
            name="message"
            rows={3}
            placeholder="Grade requirements, required delivery date, documentation needs…"
          />
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-rose-600">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={state === "sending"}>
          {state === "sending" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="size-4" />
              Request Quote
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => toggleCompare(product.slug)}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-full border text-[13px] font-semibold transition-colors",
              inCompare(product.slug)
                ? "border-brand-300 bg-brand-50 text-[var(--brand-primary)]"
                : "border-line text-slate-600 hover:border-brand-300 hover:bg-brand-50",
            )}
          >
            <GitCompare className="size-3.5" />
            {inCompare(product.slug) ? "In compare" : "Compare"}
          </button>

          <button
            type="button"
            onClick={() => toggleWishlist(product.slug)}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-full border text-[13px] font-semibold transition-colors",
              inWishlist(product.slug)
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-line text-slate-600 hover:border-rose-200 hover:bg-rose-50",
            )}
          >
            <Heart className={cn("size-3.5", inWishlist(product.slug) && "fill-current")} />
            {inWishlist(product.slug) ? "Saved" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};
