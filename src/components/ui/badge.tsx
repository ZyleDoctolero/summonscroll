import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-cyan-500/50 bg-black text-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.3)] hover:shadow-[0_0_15px_rgba(0,255,255,0.6)]",
        secondary:
          "border-amber-500/50 bg-black text-amber-400 shadow-[0_0_8px_rgba(255,191,0,0.3)] hover:shadow-[0_0_15px_rgba(255,191,0,0.6)]",
        destructive:
          "border-red-500/50 bg-black text-red-500 shadow-[0_0_8px_rgba(255,0,0,0.3)] hover:shadow-[0_0_15px_rgba(255,0,0,0.6)]",
        outline: "text-cyan-300 border-cyan-800/50 hover:bg-cyan-950/30 hover:border-cyan-500/30",
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
