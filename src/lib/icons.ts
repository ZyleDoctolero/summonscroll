import {
  Sparkles,
  Hexagon,
  Scroll,
  Coins,
  Swords,
  Shield,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Star,
  Award,
  Crown,
  Flame,
  Droplet,
  Wind,
  Mountain,
  Leaf,
  Moon,
  Sun,
  Skull,
  Users,
  User,
  Settings,
  Home,
  Map,
  Book,
  Sword,
  ShieldAlert,
  Activity,
  BarChart3,
  Trophy,
  Gift,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Plus,
  Minus,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  SlidersHorizontal,
  Calendar,
  Clock,
  Bell,
  Mail,
  MessageSquare,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  MoreVertical,
  MoreHorizontal,
  Menu,
  Grid,
  List,
  Maximize2,
  Minimize2,
  ExternalLink,
  Copy,
  Trash2,
  Edit,
  Save,
  LogOut,
  LogIn,
} from 'lucide-react'

/**
 * Currency icon mappings for game currencies
 * Maps currency types to their corresponding lucide-react icons
 */
export const CURRENCY_ICONS = {
  spiritCrystals: Sparkles,
  voidShards: Hexagon,
  pactSeals: Scroll,
} as const

/**
 * Game-specific icon mappings for stats, actions, and UI elements
 * Provides a centralized mapping of game concepts to lucide-react icons
 */
export const GAME_ICONS = {
  // Core stats
  gold: Coins,
  attack: Swords,
  defense: Shield,
  health: Heart,
  energy: Zap,
  accuracy: Target,
  power: TrendingUp,
  
  // Rarity & rewards
  rarity: Star,
  achievement: Award,
  legendary: Crown,
  
  // Elements
  fire: Flame,
  water: Droplet,
  air: Wind,
  earth: Mountain,
  nature: Leaf,
  light: Sun,
  dark: Moon,
  death: Skull,
  
  // Social & navigation
  guild: Users,
  player: User,
  settings: Settings,
  home: Home,
  map: Map,
  compendium: Book,
  battle: Sword,
  protect: ShieldAlert,
  
  // Stats & progress
  stats: Activity,
  chart: BarChart3,
  trophy: Trophy,
  reward: Gift,
  
  // States
  locked: Lock,
  unlocked: Unlock,
  visible: Eye,
  hidden: EyeOff,
  
  // Actions
  add: Plus,
  remove: Minus,
  close: X,
  confirm: Check,
  
  // Navigation
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  
  // Feedback
  info: Info,
  alert: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
  help: HelpCircle,
  
  // Utility
  search: Search,
  filter: Filter,
  adjust: SlidersHorizontal,
  calendar: Calendar,
  time: Clock,
  notification: Bell,
  mail: Mail,
  message: MessageSquare,
  share: Share2,
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  loading: Loader2,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,
  menu: Menu,
  grid: Grid,
  list: List,
  expand: Maximize2,
  collapse: Minimize2,
  external: ExternalLink,
  copy: Copy,
  delete: Trash2,
  edit: Edit,
  save: Save,
  logout: LogOut,
  login: LogIn,
} as const

/**
 * Type helpers for icon mappings
 */
export type CurrencyIconKey = keyof typeof CURRENCY_ICONS
export type GameIconKey = keyof typeof GAME_ICONS
export type IconKey = CurrencyIconKey | GameIconKey

/**
 * Get an icon component by key from either currency or game icons
 */
export function getIcon(key: IconKey) {
  return (CURRENCY_ICONS as Record<string, any>)[key] ?? (GAME_ICONS as Record<string, any>)[key]
}
