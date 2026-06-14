import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trans, dur, ease } from "@/lib/ui/motion-tokens";
import { Icon } from "@/components/ui/Icon";

const STEPS = [
  {
    title: "Your habits forge a fantasy world.",
    body: "Every habit you complete strengthens monsters in your collection. Every streak shapes a story. This is not a checklist app.",
    icon: "morning" as const,
  },
  {
    title: "Three rhythms, one game.",
    body: "Daily - tick tasks, earn rewards. Weekly - run expeditions, climb the Tower. Quarterly - slay a Boss, mint a Tome. The deeper rhythms reward consistency.",
    icon: "battle" as const,
  },
  {
    title: "Start with one directive.",
    body: "We've added a tutorial directive to your list. Tap the [+] on it to feel how it ripples through the entire system.",
    icon: "star" as const,
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

/**
 * Onboarding Welcome Carousel
 *
 * A 3-screen welcome flow shown to new users (profile.onboarding_completed_at IS NULL).
 * Implements Proposal D visual identity with gradient accents and dramatic typography.
 *
 * Flow:
 * 1. "Your habits forge a fantasy world" - context setting
 * 2. "Three rhythms, one game" - game loop explanation
 * 3. "Start with one directive" - tutorial prompt
 *
 * After completion, a tutorial directive is seeded and the free first pull is enabled.
 */
export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const currentStep = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(4px)" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: dur.measured, ease: ease.weighty }}
          className="ss-modal max-w-md text-center"
        >
          {/* Icon glyph with Proposal D glow */}
          <div className="mb-4 flex justify-center">
            <Icon
              name={currentStep.icon}
              size={48}
              className="lucide-glow"
              color="var(--gold-bright)"
            />
          </div>

          {/* Title with Proposal D dramatic typography */}
          <h2 className="t-h1 mb-3" style={{ color: "var(--gold-bright)" }}>
            {currentStep.title}
          </h2>

          {/* Body text */}
          <p className="t-body mb-6" style={{ color: "var(--ink-primary)" }}>
            {currentStep.body}
          </p>

          {/* Progress dots indicator */}
          <div className="flex gap-1 justify-center mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === step ? "var(--gold-bright)" : "var(--ink-tertiary)",
                  transform: i === step ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>

          {/* Navigation controls */}
          <div className="flex gap-3 justify-center">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="ss-btn ss-btn-secondary">
                Back
              </button>
            )}
            <button
              onClick={() => (last ? onComplete() : setStep(step + 1))}
              className="ss-btn ss-btn-primary"
              style={{ flex: step === 0 ? 1 : 2 }}
            >
              {last ? "Begin" : "Continue"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
