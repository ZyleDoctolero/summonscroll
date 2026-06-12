import { useNavigate } from "@tanstack/react-router";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { Icon } from "@/components/ui/Icon";

interface TutorialFollowUpModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Follow-up modal that appears after the user scores their first tutorial directive.
 * 
 * According to Requirement 7.10: "WHEN user scores tutorial directive, THE System SHALL display 'A summon awaits' follow-up modal"
 * According to Requirement 7.11: "WHEN follow-up modal CTA is clicked, THE System SHALL navigate to /altar"
 */
export function TutorialFollowUpModal({ open, onClose }: TutorialFollowUpModalProps) {
  const navigate = useNavigate();

  const handleOpenAltar = () => {
    onClose();
    navigate({ to: "/altar" });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={(open) => !open && onClose()} title="A Summon Awaits">
      <div className="text-center space-y-6">
        {/* Mystic orb icon with glow effect */}
        <div className="flex justify-center">
          <div className="relative">
            <Icon 
              name="sparkle" 
              size={64} 
              color="var(--violet)" 
              className="lucide-glow" 
            />
            <div 
              className="absolute inset-0 ss-burst opacity-50"
              style={{ background: "radial-gradient(circle, var(--violet)20, transparent 70%)" }}
            />
          </div>
        </div>

        {/* Title and description with dramatic voice */}
        <div className="space-y-3">
          <h2 className="t-h2 text-xl" style={{ color: "var(--violet)" }}>
            A Summon Awaits
          </h2>
          <p className="t-body text-sm" style={{ color: "var(--ink-secondary)" }}>
            You have proven your worth. The Altar recognizes your dedication and offers you a <strong style={{ color: "var(--gold-bright)" }}>free summoning</strong>.
          </p>
          <p className="t-body-sm text-xs" style={{ color: "var(--ink-tertiary)" }}>
            Your first pull costs nothing, and fate smiles upon beginners.
          </p>
        </div>

        {/* CTA Button with Proposal D styling */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={handleOpenAltar}
            className="ss-btn ss-btn-d-primary w-full"
            style={{ 
              background: "linear-gradient(135deg, var(--violet), var(--violet-dark))",
              border: "1px solid var(--violet)",
              boxShadow: "0 0 20px rgba(163, 116, 255, 0.3)"
            }}
          >
            <Icon name="sparkle" size={16} />
            Open the Altar
          </button>
          
          <button
            onClick={onClose}
            className="ss-btn ss-btn-ghost text-xs"
            style={{ color: "var(--ink-tertiary)" }}
          >
            I'll summon later
          </button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}