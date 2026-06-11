# 11 — Mobile-First Audit

> **Depends on:** [02_SURFACE_SYSTEM](./02_SURFACE_SYSTEM.md), [08_NAV_HIERARCHY](./08_NAV_HIERARCHY.md).

## The problem

SummonScroll is fundamentally a *habit tracker* — used in 30-second bursts on a
phone. Currently the app is desktop-first:

- Modals are `<dialog>`-style centered cards — fine on desktop, awkward on
  mobile (small viewport, far-from-thumb dismiss)
- Touch targets are sometimes 24-32px (Apple HIG says 44px minimum)
- Compendium grid at 3 columns on mobile is too dense — portraits become
  unreadable
- PlayerHeader's stat strip wraps poorly on viewports <380px
- The Promotion Chamber's ritual circle is 8rem wide; modal is 28rem max width;
  overflows on 360px screens

This file fixes those systematically using **Vaul** (Emil Kowalski's
bottom-sheet primitive) for mobile-specific drawer UI, plus a small audit of
fixed touch-target sizing and grid density.

## The strategy

```
Desktop → existing modals stay (Promotion Chamber, Daily Ritual, Trial confirm)
Mobile  → Vaul drawer with the same content slides up from bottom

Switch decided by Tailwind breakpoint (md, 768px):
  - <768px:  Drawer
  - ≥768px:  Modal
```

This keeps both surfaces feeling native. Mobile users get thumb-distance
dismiss + the iOS-style drag handle they expect. Desktop users get the
deliberate ceremony of a centered modal.

---

## The shared dialog wrapper

### File: `src/components/ui/ResponsiveDialog.tsx`

```tsx
import { Drawer } from "vaul";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { dur, ease } from "@/lib/ui/motion-tokens";

const MOBILE_BP = 768;

function useIsMobile() {
  const [mobile, setMobile] = useState<boolean>(() =>
    typeof window === "undefined" ? false : window.innerWidth < MOBILE_BP
  );
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mobile;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
  title,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  children: React.ReactNode;
  title?: string;
}) {
  const mobile = useIsMobile();

  if (mobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <Drawer.Content
            className="ss-modal fixed bottom-0 left-0 right-0 rounded-b-none mt-24 max-h-[92vh] overflow-y-auto"
            style={{ background: "linear-gradient(180deg, #1B1F2A 0%, #15181F 100%)" }}
          >
            <div className="mx-auto w-12 h-1.5 rounded-full bg-white/20 mb-4" />
            {title && <h2 className="t-h2 mb-4">{title}</h2>}
            {children}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop modal — existing pattern
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur.normal, ease: ease.out }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)" }}
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
```

---

## Components to migrate

These should swap their hand-rolled modal/backdrop pattern with
`<ResponsiveDialog>`:

| Component | Status |
|---|---|
| `PromotionChamber.tsx` | Wrap content in ResponsiveDialog |
| `DailyRitual.tsx` (Morning + Evening) | Wrap |
| `Trial confirm + results modals` | Wrap |
| `Compendium detail modal` | Wrap |
| `Onboarding` (from file 07) | Wrap |
| `MoreSheet` (from file 08) | Already drawer-based; just use ResponsiveDialog instead |

The internal content of each modal stays exactly the same. Only the surrounding
wrapper changes.

---

## Touch targets

Audit every interactive element. Apple HIG: 44pt × 44pt minimum. Google
Material: 48dp × 48dp.

### Targets to fix

```bash
# Find suspiciously small buttons
grep -rnE 'className="[^"]*py-(0|0\.5|1)[^"]*"' src --include='*.tsx'
```

Per component:

| File | Element | Current | Fix |
|---|---|---|---|
| PlayerHeader | Currency chips | py-1, font-size 14 | min-height 36px (acceptable for compact strip on desktop) |
| TaskCard | +/− score buttons | w-9 h-9 (36px) | bump to **w-11 h-11 (44px)** |
| GameSidebar mobile | Bottom nav items | py-2 | min-h-[44px] |
| Battle ModeCard | "Enter →" button | py-2.5 | leave; full-width works |
| Quests delete "Abandon" | text-[10px] px-2 py-1 | bump to **min-h-[32px] px-3** |
| Compendium close ✕ | w-7 h-7 (28px) | bump to **w-11 h-11** with absolutely positioned X |
| Compendium grid card | tap target | full card already large enough |
| Codex heatmap cell | w-3 h-3 (12px) | leave on desktop; on mobile, **wrap in a bigger tap region** |
| RitualStatusPill chips | px-3 py-1.5 | leave; chip-pattern is fine for chip-density |
| Forge recipe rows | py-2 | bump to **py-3** on mobile |

---

## Grid density audit

### Compendium grid

Current: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`

On mobile, 2 columns at 16px gap gives ~140-150px portraits. Acceptable.
**Keep as-is** but verify portraits load at appropriate resolution
(don't ship 1024×1024 PNG for a 140px box).

Add `<img loading="lazy" decoding="async">` to all monster portraits in the
grid for perf.

### Compendium detail modal

On mobile, full bottom drawer is wider than 28rem max. Fine — content
overflows naturally if longer than the screen. Confirm scroll behavior.

### Hub task list

Current: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. Single column on mobile.
Already correct.

### Codex heatmap

365-cell grid. On mobile at 3px cells with 3px gap, the full strip is roughly
50 weeks × (3+3) = 300px wide — fits 380px screen. Confirm with screenshot.

If it overflows: switch from 13-week density to 8-week density on mobile via
media query.

---

## PlayerHeader on mobile

The PlayerHeader is currently hidden on mobile (`hidden md:flex`). That's fine
for now, but stats are inaccessible. **Add a compact mobile header**:

### File: `src/components/game/MobilePlayerHeader.tsx`

```tsx
export function MobilePlayerHeader({ profile }: { profile: Profile }) {
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="t-mono" style={{ color: "var(--gold-leaf)" }}>
          Lvl {profile.level}
        </span>
        <span className="text-xs" style={{ color: "var(--ss-ink-secondary)" }}>
          HP {profile.hp}/{profile.max_hp}
        </span>
      </div>
      <div className="flex items-center gap-3 t-mono text-sm">
        <span style={{ color: "var(--gold-leaf)" }}>💰{profile.gold}</span>
        <span style={{ color: "var(--river)" }}>💎{profile.crystals}</span>
      </div>
    </header>
  );
}
```

Mount in AppShell:

```tsx
<MobilePlayerHeader profile={profile} />
<PlayerHeader profile={profile} />  {/* hidden on mobile */}
```

---

## Acceptance checks (test in a 380×800 mobile emulator)

- [ ] All modals from the migration list open as bottom drawers
- [ ] All drawers have a drag handle visible
- [ ] All drawers dismiss when dragged down OR backdrop tapped
- [ ] Touch targets in the audit list meet 44px minimum
- [ ] Compendium grid loads quickly (lazy images)
- [ ] Mobile PlayerHeader is visible and shows level/HP/gold/crystals
- [ ] No horizontal scrollbar appears anywhere
- [ ] Codex heatmap renders within viewport
- [ ] Bottom nav doesn't overlap content (add `pb-20` to scroll containers)
- [ ] Build passes

```bash
# Quick check for horizontal-overflow risk
grep -rn 'whitespace-nowrap' src --include='*.tsx' | wc -l
# Acceptable: < 10. Anything more = audit those.
```

## Tasks for agent

1. Create `src/components/ui/ResponsiveDialog.tsx`.
2. Migrate the 6 modal-using components to use ResponsiveDialog. Test each on
   mobile width (Chrome devtools, set viewport to 380×800).
3. Apply the touch-target fixes from the audit table.
4. Create `src/components/game/MobilePlayerHeader.tsx`.
5. Add `<MobilePlayerHeader>` to `AppShell.tsx`.
6. Add `loading="lazy"` to monster portraits in Compendium grid and Altar reveal.
7. Add `pb-20` to scroll containers on screens that can have bottom nav.
8. Test full flow on a real phone if possible (Vercel preview URL on iOS / Android).
9. Commit per area.

## Out of scope

- **Don't rebuild the desktop sidebar.** It works. Mobile nav already exists.
- **Don't add complex gesture handling.** Vaul handles drag-to-dismiss for free.
- **Don't redesign the layouts for mobile separately.** Use existing layouts
  with responsive Tailwind classes. Specialization should be minimal.
- **Don't change images yet.** That's file 10.
