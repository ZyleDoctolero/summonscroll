import { Link } from "@tanstack/react-router";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";

const NAV_RARE = [
  { to: "/forge", label: "Forge", icon: "construction" },
  { to: "/trial", label: "Trial of Echoes", icon: "skull" },
  { to: "/guild", label: "Guild", icon: "groups" },
  { to: "/fusion", label: "Fusion", icon: "cyclone" },
  { to: "/bazaar", label: "Shop", icon: "storefront" },
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
    <ResponsiveDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title="More Destinations"
    >
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
            <span className="material-symbols-outlined text-[22px]" style={{ color: "var(--gold-bright)" }}>
              {item.icon}
            </span>
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
        <span className="material-symbols-outlined text-[22px]" style={{ color: "var(--gold-bright)" }}>
          person
        </span>
        <span className="text-sm font-semibold">Profile</span>
      </Link>
    </ResponsiveDialog>
  );
}
