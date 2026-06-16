import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-black text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] hover:bg-cyan-950/30",
        destructive:
          "bg-black text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,0,0,0.2)] hover:shadow-[0_0_20px_rgba(255,0,0,0.6)] hover:bg-red-950/30",
        outline:
          "bg-black text-cyan-400 border border-cyan-500/30 hover:bg-cyan-950/50 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]",
        secondary:
          "bg-black text-amber-400 border border-amber-500/50 shadow-[0_0_10px_rgba(255,191,0,0.2)] hover:shadow-[0_0_20px_rgba(255,191,0,0.6)] hover:bg-amber-950/30",
        ghost:
          "text-cyan-500 hover:bg-cyan-950/30 hover:text-cyan-300 hover:shadow-[inset_0_0_10px_rgba(0,255,255,0.1)]",
        link: "text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300 drop-shadow-[0_0_5px_rgba(0,255,255,0.4)]",
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
