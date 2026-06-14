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
    }, 800);
    return () => clearTimeout(timer);
  }, [item.id, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: 1, y: -40, scale: 1 }}
      exit={{ opacity: 0, y: -60 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-50 font-bold text-xl whitespace-nowrap"
      style={{
        color: item.color,
        textShadow: `0 0 10px ${item.color}, 0 0 20px ${item.color}`,
        fontFamily: "'VT323', monospace",
        top: "-10px",
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
