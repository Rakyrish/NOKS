"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import * as React from "react";

import { api } from "@/lib/api";

export const NewsletterForm = ({ source = "footer" }: { source?: string }) => {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = React.useState("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      await api.subscribe(email.trim(), source);
      setState("done");
      setMessage("You're subscribed. Watch your inbox.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("That didn't go through. Please try again.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full lg:justify-self-end lg:max-w-md">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.co.ke"
          disabled={state === "loading"}
          className="h-12 flex-1 rounded-full border border-white/15 bg-white/8 px-5 text-sm
                     text-white placeholder:text-white/40 transition-all
                     focus:border-white/40 focus:bg-white/12 focus:outline-none
                     disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={state === "loading" || state === "done"}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full
                     bg-white px-6 text-sm font-semibold text-navy-900 transition-all
                     hover:bg-brand-50 disabled:opacity-70"
        >
          {state === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : state === "done" ? (
            <Check className="size-4" />
          ) : (
            <>
              Subscribe
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`mt-2.5 text-[13px] ${
            state === "error" ? "text-rose-300" : "text-[var(--brand-emerald-light)]"
          }`}
        >
          {message}
        </p>
      )}
      {!message && (
        <p className="mt-2.5 text-[12.5px] text-white/40">
          We never share your address. Unsubscribe anytime.
        </p>
      )}
    </form>
  );
};
