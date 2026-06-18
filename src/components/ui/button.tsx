import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-glow)] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--bg-panel)] text-[var(--ink-primary)] border border-[var(--ss-border)] shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:border-[var(--ss-border-active)] hover:text-[var(--ink-primary)] hover:shadow-[0_0_15px_rgba(212,175,63,0.15)] backdrop-blur-md",
        destructive:
          "bg-[rgba(255,23,68,0.15)] text-[var(--danger)] border border-[rgba(255,23,68,0.4)] shadow-[0_0_10px_rgba(255,23,68,0.1)] hover:bg-[rgba(255,23,68,0.25)] hover:border-[rgba(255,23,68,0.6)] backdrop-blur-md",
        outline:
          "bg-transparent text-[var(--ink-primary)] border border-[var(--ss-border)] hover:bg-[var(--bg-panel)] hover:border-[var(--ss-border-active)] hover:shadow-[0_0_15px_rgba(212,175,63,0.15)]",
        secondary:
          "bg-[var(--bg-stage)] text-[var(--ink-secondary)] border border-[var(--ss-border)] hover:bg-[var(--bg-panel)] hover:text-[var(--ink-primary)]",
        ghost:
          "text-[var(--ink-secondary)] hover:bg-[var(--bg-panel)] hover:text-[var(--ink-primary)]",
        link: "text-[var(--gold-bright)] underline-offset-4 hover:underline drop-shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
