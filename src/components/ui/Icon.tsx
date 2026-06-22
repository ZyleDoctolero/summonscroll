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
  HeartPulse,
  Crown,
  Skull,
  Sun,
  Moon,
  Sword,
  Swords,
  Shield,
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
  Search,
  AlertTriangle,
  User,
  PawPrint,
  Compass,
  Layers,
  Scroll,
  TreePine,
  FlaskConical,
  Users,
  Home,
  TrendingUp,
  Battery,
  type LucideIcon,
} from "lucide-react";

//  Icon Name Map
// Maps semantic game icon names to Lucide components.
// Proposal D: clean geometric line set, tinted per accent color.

const ICONS: Record<string, LucideIcon> = {
  // Currencies
  gold: Coins,
  crystal: Diamond,
  seal: Key,
  tome: BookOpen,
  stone: Box,
  stamina: Battery,
  sparkle: Sparkles,
  egg: Egg,
  potion: TestTube,
  food: UtensilsCrossed,

  // Player State
  streak: Flame,
  cold: Snowflake,
  bond: Heart,
  bondLow: HeartCrack,
  hp: HeartPulse,
  xp: TrendingUp,
  crown: Crown,
  death: Skull,

  // Activity / Nav
  morning: Sun,
  evening: Moon,
  battle: Sword,
  swords: Swords,
  tower: Layers,
  summon: Scroll,
  scroll: Scroll,
  memorial: Cross,
  island: TreePine,
  fusion: FlaskConical,
  guild: Users,
  hub: Home,
  book: BookOpen,
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
  search: Search,
  shield: Shield,
  heart: Heart,
  zap: Zap,
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
  style?: React.CSSProperties;
  title?: string;
}

//  Icon Component
// Renders a Lucide icon by semantic name with Proposal D tinting support.
// Apply .lucide-glow class for hero moment glow effects.

export function Icon({
  name,
  size = 16,
  color = "currentColor",
  className,
  strokeWidth = 2,
  style,
  title,
}: IconProps) {
  // Fall back to a neutral glyph rather than vanishing when a name is unknown.
  const LucideComponent = ICONS[name] ?? ICONS.sparkle;
  return (
    <LucideComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
    />
  );
}
