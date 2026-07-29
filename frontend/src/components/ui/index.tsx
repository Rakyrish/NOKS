"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/* ── Card ──────────────────────────────────────────────────── */

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }
>(({ className, hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "surface-card",
      hover &&
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] " +
          "hover:border-brand-200",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

/* ── Badge ─────────────────────────────────────────────────── */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        brand: "bg-brand-50 text-brand-700",
        emerald: "bg-emerald-50 text-emerald-700",
        amber: "bg-amber-50 text-amber-700",
        rose: "bg-rose-50 text-rose-700",
        navy: "bg-navy-50 text-navy-900",
        neutral: "bg-surface-muted text-muted-fg",
        outline: "border border-line bg-white text-navy-900",
        glass: "glass-dark text-white",
      },
      size: {
        sm: "px-2.5 py-0.5 text-[11px]",
        md: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-[13px]",
      },
    },
    defaultVariants: { variant: "brand", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, size, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
);

/* ── Availability pill ─────────────────────────────────────── */

const AVAILABILITY_VARIANT: Record<string, BadgeProps["variant"]> = {
  in_stock: "emerald",
  low_stock: "amber",
  made_to_order: "brand",
  out_of_stock: "rose",
};

export const AvailabilityBadge = ({
  availability,
  label,
  className,
}: {
  availability: string;
  label: string;
  className?: string;
}) => (
  <Badge
    variant={AVAILABILITY_VARIANT[availability] ?? "neutral"}
    size="sm"
    className={className}
  >
    <span className="size-1.5 rounded-full bg-current" aria-hidden />
    {label}
  </Badge>
);

/* ── Inputs ────────────────────────────────────────────────── */

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink",
      "placeholder:text-slate-400 transition-all duration-200",
      "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none",
      "disabled:cursor-not-allowed disabled:bg-surface-muted",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink",
      "placeholder:text-slate-400 transition-all duration-200 resize-y min-h-28",
      "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full appearance-none rounded-xl border border-line bg-white px-4 pr-10",
      "text-sm text-ink transition-all duration-200 cursor-pointer",
      "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none",
      "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 " +
        "fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%2364748b%22 stroke-width=%222%22>" +
        "<path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M19 9l-7 7-7-7%22/></svg>')]",
      "bg-[length:18px] bg-[right_0.85rem_center] bg-no-repeat",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export const Label = ({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) => (
  <label
    className={cn("mb-1.5 block text-[13px] font-semibold text-navy-900", className)}
    {...props}
  >
    {children}
    {required && <span className="ml-0.5 text-rose-500">*</span>}
  </label>
);

/* ── Accordion ─────────────────────────────────────────────── */

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "surface-card overflow-hidden transition-colors data-[state=open]:border-brand-200",
      className,
    )}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "group flex flex-1 items-center justify-between gap-4 px-6 py-5 text-left",
        "font-display text-[15px] font-semibold text-navy-900 transition-colors",
        "hover:text-[var(--brand-primary)] sm:text-base",
        className,
      )}
      {...props}
    >
      {children}
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted",
          "text-muted-fg transition-all duration-300",
          "group-hover:bg-brand-50 group-hover:text-[var(--brand-primary)]",
          "group-data-[state=open]:rotate-180 group-data-[state=open]:bg-brand-50",
          "group-data-[state=open]:text-[var(--brand-primary)]",
        )}
      >
        <ChevronDown className="size-4" />
      </span>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden data-[state=closed]:animate-none"
    {...props}
  >
    <div className={cn("px-6 pb-6 text-[15px] leading-relaxed text-slate-600", className)}>
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = "AccordionContent";

/* ── Skeleton ──────────────────────────────────────────────── */

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("skeleton rounded-xl", className)} />
);
