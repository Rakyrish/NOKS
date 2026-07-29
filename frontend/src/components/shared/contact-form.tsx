"use client";

import { Check, Loader2, Send } from "lucide-react";
import * as React from "react";

import { Input, Label, Select, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const TOPICS = [
  { value: "general", label: "General enquiry" },
  { value: "technical", label: "Technical support" },
  { value: "sourcing", label: "Chemical sourcing" },
  { value: "partnership", label: "Partnership" },
  { value: "careers", label: "Careers" },
] as const;

export const ContactForm = () => {
  const [state, setState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = React.useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");

    try {
      await api.submitInquiry({
        full_name: String(form.get("full_name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        company: String(form.get("company") ?? ""),
        topic: String(form.get("topic") ?? "general"),
        subject: String(form.get("subject") ?? ""),
        message: String(form.get("message") ?? ""),
      });
      setState("sent");
    } catch {
      setState("error");
      setError("We couldn't send that. Please try again or call us directly.");
    }
  };

  if (state === "sent") {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--brand-emerald)] text-white">
          <Check className="size-6" />
        </span>
        <p className="mt-4 font-display text-lg font-bold text-emerald-900">Message sent</p>
        <p className="mt-2 text-[14.5px] text-emerald-800">
          Thank you — our team will respond within one business day.
        </p>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => setState("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name" required>
            Full name
          </Label>
          <Input id="contact-name" name="full_name" required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="contact-company">Company</Label>
          <Input id="contact-company" name="company" autoComplete="organization" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-email" required>
            Email
          </Label>
          <Input id="contact-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone</Label>
          <Input id="contact-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-topic">Topic</Label>
          <Select id="contact-topic" name="topic" defaultValue="general">
            {TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="contact-subject">Subject</Label>
          <Input id="contact-subject" name="subject" placeholder="Brief summary" />
        </div>
      </div>

      <div>
        <Label htmlFor="contact-message" required>
          Message
        </Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder="Tell us about the product, application or volume you need…"
        />
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-rose-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={state === "sending"}>
        {state === "sending" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="size-4" />
            Send message
          </>
        )}
      </Button>

      <p className="text-[12.5px] text-slate-400">
        By submitting you agree to be contacted about your enquiry. We never share your
        details.
      </p>
    </form>
  );
};
