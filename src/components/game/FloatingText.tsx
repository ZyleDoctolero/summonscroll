import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";

export type FloatingTextItem = {
  id: string;
  text: string;
  color: string;
};

export function FloatingText({
  item,
  onComplete,
}: {
  item: FloatingTextItem;
  onComplete: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(item.id);
    }, 1000);
    return () => clearTimeout(timer);
  }, [item.id, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.3 }}
      animate={{ opacity: 1, y: -50, scale: [0.3, 1.3, 1] }}
      exit={{ opacity: 0, y: -80, scale: 0.8 }}
      transition={{
        duration: 1,
        ease: [0.16, 1, 0.3, 1],
        scale: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
      }}
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-50 font-bold text-xl whitespace-nowrap"
      style={{
        color: item.color,
        textShadow: `0 0 12px ${item.color}, 0 0 24px ${item.color}60, 0 2px 4px rgba(0,0,0,0.1)`,
        fontFamily: "'VT323', monospace",
        top: "-10px",
        letterSpacing: "0.05em",
      }}
    >
      {item.text}
    </motion.div>
  );
}

export function FloatingTextContainer({
  items,
  onComplete,
}: {
  items: FloatingTextItem[];
  onComplete: (id: string) => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {items.map((item) => (
          <FloatingText key={item.id} item={item} onComplete={onComplete} />
        ))}
      </AnimatePresence>
    </div>
  );
}
