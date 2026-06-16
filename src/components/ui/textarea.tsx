import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-[#b8973c]/50 bg-[#2a1e12] px-3 py-2 text-base text-[#f4ecd8] shadow-inner transition-all duration-300 placeholder:text-[#b8973c]/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b8973c] focus-visible:border-[#b8973c] focus-visible:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] hover:border-[#b8973c]/80 hover:bg-[#3d2e1f] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
