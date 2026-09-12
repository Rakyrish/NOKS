"use client";

import { Mail, MessageCircle, Phone, Plus, X } from "lucide-react";
import * as React from "react";

import { nap } from "@/lib/business";
import { brand } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Persistent contact shortcuts, behind one launcher.
 *
 * Two things were wrong before:
 *
 * 1. Three always-on buttons stacked ~180px up the right edge, with the AI
 *    assistant launcher holding the left edge — four floating affordances,
 *    and on a short phone screen the right-hand stack sat on top of whatever
 *    the visitor was reading. They now collapse into a single button that
 *    expands on demand.
 *
 * 2. Every value carried a hardcoded placeholder fallback — a dummy Kenyan
 *    number for tel:, for WhatsApp and for the tooltip, plus a literal email
 *    address. One blank environment variable away from publishing a fake
 *    phone number sitewide, and a fake number in the visible NAP is worse for
 *    local search than no number at all. A channel with no configured value
 *    is simply not rendered.
 */

const WHATSAPP_MESSAGE = (name: string) =>
  `Hello ${name}, I would like to inquire about industrial chemicals and request a quotation.`;

export const FloatingContacts = () => {
  const [open, setOpen] = React.useState(false);

  const channels = [
    nap.phoneDisplay && {
      key: "phone",
      href: nap.telHref,
      label: `Call ${nap.phoneDisplay}`,
      short: nap.phoneDisplay,
      Icon: Phone,
      className: "bg-gradient-to-br from-[#1c2f5e] to-[#040b1f] ring-blue-500/30",
      external: false,
    },
    nap.email && {
      key: "email",
      href: `mailto:${nap.email}`,
      label: `Email ${nap.email}`,
      short: nap.email,
      Icon: Mail,
      className: "bg-gradient-to-br from-[#0c48e6] via-[#0a38c2] to-[#0d2f9c] ring-white/20",
      external: false,
    },
    nap.whatsappUrl && {
      key: "whatsapp",
      href: `${nap.whatsappUrl}?text=${encodeURIComponent(WHATSAPP_MESSAGE(brand.name))}`,
      label: "Chat on WhatsApp",
      short: "WhatsApp",
      Icon: MessageCircle,
      className: "bg-[#25D366] ring-white/30",
      external: true,
    },
  ].filter(Boolean) as {
    key: string;
    href: string;
    label: string;
    short: string;
    Icon: React.ElementType;
    className: string;
    external: boolean;
  }[];

  if (!channels.length) return null;

  return (
    <div
      className="fixed right-4 bottom-5 z-50 flex flex-col items-end gap-2.5 sm:right-6 sm:bottom-6"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div
        id="floating-contact-channels"
        // `hidden` rather than opacity: a collapsed panel must be out of the
        // tab order and out of the accessibility tree, not merely invisible.
        hidden={!open}
        className="flex flex-col items-end gap-2.5"
      >
        {channels.map(({ key, href, label, short, Icon, className, external }) => (
          <a
            key={key}
            href={href}
            aria-label={label}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={cn(
              "flex items-center gap-2.5 rounded-full py-2 pr-3 pl-2 text-[13px] font-semibold",
              "text-white shadow-lg ring-2 transition-transform hover:scale-[1.03] active:scale-95",
              className,
            )}
          >
            <span className="grid size-8 place-items-center rounded-full bg-white/15">
              <Icon className="size-4" />
            </span>
            <span className="max-w-[9.5rem] truncate">{short}</span>
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="floating-contact-channels"
        aria-label={open ? "Hide contact options" : "Show contact options"}
        className="grid size-13 place-items-center rounded-full bg-[var(--brand-primary)] text-white
                   shadow-[0_8px_25px_rgba(12,72,230,0.45)] ring-2 ring-white/25
                   transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-5" /> : <Plus className="size-5" />}
      </button>
    </div>
  );
};
