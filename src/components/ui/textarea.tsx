import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-cyan-500/30 bg-black/50 px-3 py-2 text-base text-cyan-50 shadow-[inset_0_0_10px_rgba(0,255,255,0.05)] transition-all duration-300 placeholder:text-cyan-500/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 focus-visible:shadow-[0_0_15px_rgba(0,255,255,0.3),inset_0_0_15px_rgba(0,255,255,0.1)] hover:border-cyan-500/50 hover:bg-cyan-950/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
