import {
  Coins,
  Diamond,
  Key,
  BookOpen,
  Box,
  Zap,
  Sparkles,
  Egg,
  TestTube,
  UtensilsCrossed,
  Flame,
  Snowflake,
  Heart,
  HeartCrack,
  Crown,
  Skull,
  Sun,
  Moon,
  Sword,
  Gem,
  Cross,
  Star,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Target,
  Trash2,
  Edit,
  Lock,
  AlertTriangle,
  User,
  PawPrint,
  Compass,
  type LucideIcon,
} from "lucide-react";

// ─── Icon Name Map ──────────────────────────────────────────────────────────
// Maps semantic game icon names to Lucide components.
// Proposal D: clean geometric line set, tinted per accent color.

const ICONS: Record<string, LucideIcon> = {
  // Currencies
  gold: Coins,
  crystal: Diamond,
  seal: Key,
  tome: BookOpen,
  stone: Box,
  stamina: Zap,
  sparkle: Sparkles,
  egg: Egg,
  potion: TestTube,
  food: UtensilsCrossed,

  // Player State
  streak: Flame,
  cold: Snowflake,
  bond: Heart,
  bondLow: HeartCrack,
  hp: Heart,
  xp: Sparkles,
  crown: Crown,
  death: Skull,

  // Activity
  morning: Sun,
  evening: Moon,
  battle: Sword,
  tower: Gem,
  summon: Gem,
  memorial: Cross,
  island: Gem,
  star: Star,
  check: Check,
  close: X,
  prev: ArrowLeft,
  next: ArrowRight,

  // Additional central categories & controls (Proposal D)
  dumbbell: Dumbbell,
  target: Target,
  delete: Trash2,
  edit: Edit,
  lock: Lock,
  warning: AlertTriangle,
  user: User,
  pet: PawPrint,
  mount: Compass,
};

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

// ─── Icon Component ──────────────────────────────────────────────────────────
// Renders a Lucide icon by semantic name with Proposal D tinting support.
// Apply .lucide-glow class for hero moment glow effects.

export function Icon({
  name,
  size = 16,
  color = "currentColor",
  className,
  strokeWidth = 2,
}: IconProps) {
  const LucideComponent = ICONS[name];
  if (!LucideComponent) return null;
  return (
    <LucideComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    />
  );
}
