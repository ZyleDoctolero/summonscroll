import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-[var(--gold-glow)]/50 bg-[var(--bg-panel)] px-3 py-2 text-base text-[var(--bg-stage)] shadow-inner transition-all duration-300 placeholder:text-[var(--gold-glow)]/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-glow)] focus-visible:border-[var(--gold-glow)] focus-visible:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] hover:border-[var(--gold-glow)]/80 hover:bg-[var(--ink-secondary)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
