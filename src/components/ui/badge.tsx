import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-[var(--gold-glow)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[var(--gold-glow)]/50 bg-[var(--bg-panel)] text-[var(--bg-stage)] shadow-lg shadow-black/40 hover:shadow-lg hover:bg-[var(--ink-secondary)]",
        secondary:
          "border-amber-500/50 bg-[var(--bg-panel)] text-amber-400 shadow-lg shadow-black/40 hover:shadow-lg hover:bg-[var(--ink-secondary)]",
        destructive:
          "border-red-500/50 bg-[var(--bg-panel)] text-[var(--danger)] shadow-lg shadow-black/40 hover:shadow-lg hover:bg-[var(--ink-secondary)]",
        outline: "text-[var(--ink-primary)] border-[var(--gold-glow)]/50 hover:bg-[var(--bg-panel)] hover:text-[var(--bg-stage)] hover:border-[var(--gold-glow)]/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
