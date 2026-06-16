import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b8973c] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#2a1e12] text-[#f4ecd8] border border-[#b8973c]/50 shadow-lg shadow-black/40 hover:shadow-xl hover:bg-[#3d2e1f]",
        destructive:
          "bg-[#2a1e12] text-[#8b0000] border border-[#8b0000]/50 shadow-lg shadow-black/40 hover:shadow-xl hover:bg-[#3d2e1f]",
        outline:
          "bg-transparent text-[#1a1a1a] border border-[#b8973c]/50 hover:bg-[#2a1e12] hover:text-[#f4ecd8] hover:shadow-lg",
        secondary:
          "bg-[#f4ecd8] text-[#1a1a1a] border border-[#b8973c]/50 shadow-lg shadow-black/40 hover:shadow-xl hover:bg-[#e0d4b8]",
        ghost:
          "text-[#1a1a1a] hover:bg-[#e0d4b8] hover:text-[#8b0000] hover:shadow-inner",
        link: "text-[#1a1a1a] underline-offset-4 hover:underline hover:text-[#8b0000] drop-shadow-sm",
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
