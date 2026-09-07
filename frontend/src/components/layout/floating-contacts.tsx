"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";
import * as React from "react";

import { brand, contact } from "@/lib/site";

export const FloatingContacts = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const phoneHref = contact.telHref || "tel:+254700000000";
  const displayPhone = contact.phone || "+254 700 000 000";
  const emailHref = contact.email ? `mailto:${contact.email}` : "mailto:info@noksindustrial.com";
  const displayEmail = contact.email || "info@noksindustrial.com";
  const whatsappHref = contact.whatsappUrl
    ? `${contact.whatsappUrl}?text=${encodeURIComponent(
        `Hello ${brand.name}, I would like to inquire about industrial chemicals and request a quotation.`,
      )}`
    : `https://wa.me/254700000000?text=${encodeURIComponent(
        `Hello ${brand.name}, I would like to inquire about industrial chemicals and request a quotation.`,
      )}`;

  return (
    <div
      className="fixed right-5 bottom-6 z-50 flex flex-col items-end gap-3 sm:right-6"
      aria-label="Quick contact shortcuts"
    >
      <AnimatePresence>
        {/* Phone Button (Deep Navy with Blue Ring) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 24, delay: 0.05 }}
          className="group relative flex items-center"
        >
          <span
            className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap
                       rounded-lg bg-[#040b1f] px-3 py-1.5 text-xs font-semibold text-white
                       shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100
                       group-hover:-translate-x-1 sm:block border border-blue-500/30"
          >
            Call {displayPhone}
          </span>
          <a
            href={phoneHref}
            aria-label={`Call us at ${displayPhone}`}
            className="flex size-12 items-center justify-center rounded-full
                       bg-gradient-to-br from-[#1c2f5e] to-[#040b1f] text-white
                       shadow-[0_6px_20px_rgba(4,11,31,0.5)] ring-2 ring-blue-500/30
                       transition-all duration-200 hover:scale-110 hover:ring-blue-400
                       active:scale-95"
          >
            <Phone className="size-5 text-blue-300" />
          </a>
        </motion.div>

        {/* Email Button (NOKS Royal Blue) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 24, delay: 0.1 }}
          className="group relative flex items-center"
        >
          <span
            className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap
                       rounded-lg bg-[#040b1f] px-3 py-1.5 text-xs font-semibold text-white
                       shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100
                       group-hover:-translate-x-1 sm:block border border-blue-500/30"
          >
            Email: {displayEmail}
          </span>
          <a
            href={emailHref}
            aria-label={`Email us at ${displayEmail}`}
            className="flex size-12 items-center justify-center rounded-full
                       bg-gradient-to-br from-[#0c48e6] via-[#0a38c2] to-[#0d2f9c] text-white
                       shadow-[0_6px_20px_rgba(12,72,230,0.5)] ring-2 ring-white/20
                       transition-all duration-200 hover:scale-110 hover:ring-white/40
                       active:scale-95"
          >
            <Mail className="size-5" />
          </a>
        </motion.div>

        {/* WhatsApp Button (WhatsApp Green) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 24, delay: 0.15 }}
          className="group relative flex items-center"
        >
          <span
            className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap
                       rounded-lg bg-[#040b1f] px-3 py-1.5 text-xs font-semibold text-white
                       shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100
                       group-hover:-translate-x-1 sm:block border border-white/15"
          >
            Chat on WhatsApp
          </span>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="relative flex size-14 items-center justify-center rounded-full
                       bg-[#25D366] text-white
                       shadow-[0_8px_25px_rgba(37,211,102,0.55)] ring-2 ring-white/30
                       transition-all duration-200 hover:scale-110 hover:ring-white/60
                       active:scale-95"
          >
            {/* Soft pulsing ring */}
            <span
              className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40
                         [animation-duration:3s]"
              aria-hidden
            />
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
              <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-6.99A9.82 9.82 0 0 0 12.04 2zM17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.825 9.825 0 016.988 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
            </svg>
          </a>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
