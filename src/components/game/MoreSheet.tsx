import { Link } from "@tanstack/react-router";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { Icon } from "@/components/ui/Icon";

const NAV_RARE = [
  { to: "/forge", label: "Forge", icon: "stone" },
  { to: "/trial", label: "Trial of Echoes", icon: "death" },
  { to: "/guild", label: "Guild", icon: "crown" },
  { to: "/fusion", label: "Fusion", icon: "sparkle" },
  { to: "/bazaar", label: "Shop", icon: "gold" },
] as const;

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * MoreSheet - Navigation drawer for rare/infrequent destinations
 *
 * Shows the 5 rare nav destinations (Forge, Trial, Guild, Fusion, Shop) plus Profile.
 * Opens from the "More" button in GameSidebar (both desktop and mobile).
 *
 * Uses Vaul drawer for smooth bottom-sheet UX on mobile.
 */
export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="More Destinations">
      {/* Nav links */}
      <div className="space-y-1 mb-4">
        {NAV_RARE.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-md transition-all"
            style={{
              color: "var(--ink-primary)",
              background: "transparent",
            }}
          >
            <Icon name={item.icon as any} size={22} color="var(--gold-bright)" />
            <span className="text-sm font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Divider */}
      <hr className="ss-divider my-3" />

      {/* Profile link */}
      <Link
        to="/profile"
        onClick={() => onOpenChange(false)}
        className="flex items-center gap-3 px-3 py-3 rounded-md transition-all mb-6"
        style={{
          color: "var(--ink-primary)",
          background: "transparent",
        }}
      >
        <Icon name="user" size={22} color="var(--gold-bright)" />
        <span className="text-sm font-semibold">Profile</span>
      </Link>
    </ResponsiveDialog>
  );
}
