"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

import { brand, contact } from "@/lib/site";

/** Floating WhatsApp entry point — appears once the visitor starts scrolling. */
export const WhatsAppButton = () => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!contact.whatsapp) return null;

  const href = `${contact.whatsappUrl}?text=${encodeURIComponent(
    `Hello ${brand.name}, I'd like a quotation for industrial chemicals.`,
  )}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          initial={{ opacity: 0, scale: 0.7, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="group fixed bottom-6 left-6 z-40 grid size-14 place-items-center
                     rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.7)]
                     transition-transform hover:scale-105"
        >
          <span
            className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40
                       [animation-duration:2.8s]"
            aria-hidden
          />
          <svg viewBox="0 0 24 24" fill="currentColor" className="relative size-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.825 9.825 0 016.988 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
          </svg>

          <span
            className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap
                       rounded-full bg-navy-900 px-3.5 py-2 text-[13px] font-medium text-white
                       opacity-0 transition-opacity group-hover:opacity-100 lg:block"
          >
            Chat on WhatsApp
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
};
