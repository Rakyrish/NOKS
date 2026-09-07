import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold " +
    "transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 [&_svg]:shrink-0 " +
    "active:translate-y-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-[#0a38c2] via-[#0c48e6] to-[#2f5efa] text-white font-bold shadow-[0_8px_24px_-6px_rgba(12,72,230,0.55)] " +
          "hover:brightness-110 hover:-translate-y-0.5",
        blue:
          "bg-gradient-to-r from-[#0a38c2] via-[#0c48e6] to-[#2f5efa] text-white font-bold shadow-[0_8px_24px_-6px_rgba(12,72,230,0.55)] " +
          "hover:brightness-110 hover:-translate-y-0.5",
        emerald:
          "bg-[var(--brand-emerald)] text-white shadow-[0_8px_24px_-10px_rgba(5,150,105,0.6)] " +
          "hover:brightness-110 hover:-translate-y-0.5",
        navy:
          "bg-navy-900 text-white hover:bg-navy-800 hover:-translate-y-0.5 " +
          "shadow-[0_8px_24px_-12px_rgba(7,18,51,0.6)]",
        outline:
          "border border-line bg-white text-navy-900 hover:border-brand-300 " +
          "hover:bg-brand-50 hover:-translate-y-0.5",
        ghost: "text-navy-900 hover:bg-surface-muted",
        glass:
          "glass-dark text-white hover:bg-white/15 hover:-translate-y-0.5",
        link: "text-[var(--brand-primary)] underline-offset-4 hover:underline rounded-md",
      },
      size: {
        sm: "h-9 px-4 text-[13px] [&_svg]:size-4",
        md: "h-11 px-6 text-sm [&_svg]:size-4",
        lg: "h-13 px-8 text-[15px] [&_svg]:size-5",
        icon: "size-11 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
