import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-[#b8973c] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[#b8973c]/50 bg-[#2a1e12] text-[#f4ecd8] shadow-lg shadow-black/40 hover:shadow-lg hover:bg-[#3d2e1f]",
        secondary:
          "border-amber-500/50 bg-[#2a1e12] text-amber-400 shadow-lg shadow-black/40 hover:shadow-lg hover:bg-[#3d2e1f]",
        destructive:
          "border-red-500/50 bg-[#2a1e12] text-[#8b0000] shadow-lg shadow-black/40 hover:shadow-lg hover:bg-[#3d2e1f]",
        outline: "text-[#1a1a1a] border-[#b8973c]/50 hover:bg-[#2a1e12] hover:text-[#f4ecd8] hover:border-[#b8973c]/80",
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
