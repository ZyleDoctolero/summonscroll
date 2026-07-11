import { Drawer } from "vaul";
import { AnimatePresence, motion } from "motion/react";
import { dur, ease } from "@/lib/ui/motion-tokens";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
}) {
  const mobile = useIsMobile();

  if (mobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-[rgba(61,46,31,0.6)] backdrop-blur-sm" />
          <Drawer.Content className="ss-modal fixed bottom-0 left-0 right-0 rounded-b-none mt-24 max-h-[92vh] overflow-y-auto">
            {/* Drag handle */}
            <div className="mx-auto w-12 h-1.5 rounded-full bg-[#b5a28a]/30 mb-4" />
            {/* Radix (via vaul) requires a Title inside DialogContent for
                screen readers — render it visually hidden when none given */}
            {title ? (
              <Drawer.Title asChild>
                <h2 className="t-h2 mb-4">{title}</h2>
              </Drawer.Title>
            ) : (
              <Drawer.Title className="sr-only">Dialog</Drawer.Title>
            )}
            {children}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop modal - existing pattern
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur.normal, ease: ease.out }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(61,46,31,0.6)",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: dur.measured, ease: ease.weighty }}
            onClick={(e) => e.stopPropagation()}
            className="ss-modal max-w-md w-full max-h-[88vh] overflow-y-auto"
          >
            {title && <h2 className="t-h2 mb-4">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
