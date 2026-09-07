import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";

import { FaqSection } from "@/components/home/faq-section";
import { ContactForm } from "@/components/shared/contact-form";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { api } from "@/lib/api";
import { localBusinessSchema } from "@/lib/schema";
import { brand, contact, social } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact Us — Chemical Sales & Technical Support",
  description: `Contact ${brand.fullName} in ${contact.city || "Nairobi"}. Phone ${contact.phone}, email ${contact.email}. Chemical sales, technical support and quotation requests across Kenya and East Africa.`,
  alternates: { canonical: "/contact" },
};

/** Same line configured twice should read as one number, not two. */
const digitsOnly = (value: string) => value.replace(/\D/g, "");
const altPhone =
  contact.phoneAlt && digitsOnly(contact.phoneAlt) !== digitsOnly(contact.phone)
    ? contact.phoneAlt
    : "";

export default async function ContactPage() {
  const faqs = await api.homepage();

  const channels = [
    {
      Icon: Phone,
      label: "Call sales",
      value: contact.phone,
      href: contact.telHref,
      note: altPhone ? `Alt: ${altPhone}` : undefined,
    },
    {
      Icon: Mail,
      label: "Email sales",
      value: contact.email,
      href: `mailto:${contact.email}`,
      note: contact.emailSupport ? `Technical: ${contact.emailSupport}` : undefined,
    },
    {
      Icon: MessageCircle,
      label: "WhatsApp",
      value: contact.phone,
      href: contact.whatsappUrl,
      note: "Fastest response during business hours",
    },
    {
      Icon: MapPin,
      label: "Visit us",
      value: contact.addressLine,
      href: undefined,
      note: contact.postal ? `P.O. Box ${contact.postal}` : undefined,
    },
  ].filter((channel) => channel.value);

  return (
    <>
      <JsonLd id="contact-business" data={localBusinessSchema()} />

      <PageHero
        eyebrow="Contact"
        title="Talk to our technical sales team"
        description="Quotations, product selection, safety documentation or sourcing enquiries —
                     we respond within one business day."
        crumbs={[{ name: "Contact", url: "/contact" }]}
      />

      <div className="bg-surface-muted py-14 sm:py-20">
        <div className="container-noks grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="rounded-2xl border border-line bg-white p-7 sm:p-9">
            <h2 className="font-display text-xl font-bold text-navy-900">Send us a message</h2>
            <p className="mt-1.5 text-[14px] text-slate-500">
              Tell us what you need and the right specialist will reply directly.
            </p>
            <ContactForm />
          </div>

          <div className="space-y-4">
            {channels.map((channel) => (
              <div key={channel.label} className="rounded-2xl border border-line bg-white p-6">
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-[var(--brand-primary)]">
                    <channel.Icon className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                      {channel.label}
                    </p>
                    {channel.href ? (
                      <a
                        href={channel.href}
                        target={channel.href.startsWith("http") ? "_blank" : undefined}
                        rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="mt-1 block text-[14.5px] font-semibold break-words text-navy-900 transition-colors hover:text-[var(--brand-primary)]"
                      >
                        {channel.value}
                      </a>
                    ) : (
                      <p className="mt-1 text-[14.5px] font-semibold text-navy-900">
                        {channel.value}
                      </p>
                    )}
                    {channel.note && (
                      <p className="mt-1 text-[12.5px] text-slate-500">{channel.note}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {contact.hours && (
              <div className="rounded-2xl bg-navy-900 p-6 text-white">
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10">
                    <Clock className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.12em] text-white/45 uppercase">
                      Opening hours
                    </p>
                    <p className="mt-1 text-[14.5px] font-semibold">{contact.hours}</p>
                    <p className="mt-1 text-[12.5px] text-white/55">
                      Emergency supply available outside these hours by arrangement.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(social.linkedin || social.facebook) && (
              <div className="rounded-2xl border border-line bg-white p-6">
                <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                  Follow us
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(social)
                    .filter(([, href]) => href)
                    .map(([name, href]) => (
                      <a
                        key={name}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-line px-3.5 py-1.5 text-[12.5px]
                                   font-medium text-slate-600 capitalize transition-colors
                                   hover:border-brand-300 hover:bg-brand-50
                                   hover:text-[var(--brand-primary)]"
                      >
                        {name}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        {contact.mapsEmbed && (
          <div className="container-noks mt-10">
            <div className="overflow-hidden rounded-2xl border border-line">
              <iframe
                src={contact.mapsEmbed}
                title={`${brand.fullName} location`}
                width="100%"
                height="420"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
              />
            </div>
          </div>
        )}
      </div>

      <FaqSection
        faqs={faqs.faqs}
        tone="white"
        eyebrow="Before you write"
        title="Quick answers"
        description="The questions our sales team is asked most often."
      />
    </>
  );
}
