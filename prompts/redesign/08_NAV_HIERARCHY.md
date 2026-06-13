# 08 — Nav Hierarchy

> **Depends on:** [02_SURFACE_SYSTEM](./02_SURFACE_SYSTEM.md) (for button styling).

## The problem

The sidebar currently has 14 routes treated identically:

> Hub / Quests / Island / Altar / Expeditions / Forge / Battle / Compendium /
> Codex / Trial of Echoes / Guild / Fusion / Shop / Profile

Equal visual weight = no cognitive hierarchy. The player has no signal about
which destinations are _daily_, which are _weekly_, which are _rare_.

Mobile is worse — the bottom-nav can only show 5 icons, so 9 routes are
invisible until you remember they exist.

## The fix

Three nav tiers. The visual hierarchy mirrors the gameplay rhythm.

```
TIER 1 — Daily (always-visible, large): Hub, Quests, Altar, Expeditions
TIER 2 — Weekly (always-visible, smaller): Battle, Compendium, Codex, Island
TIER 3 — Rare (collapsed into "More" sheet): Forge, Trial, Guild, Fusion, Shop
ALWAYS — Profile + Mute toggle (at sidebar bottom or in More)
```

The Compass already surfaces the "what to do now" — that absorbs the role the
old equally-weighted nav was failing at.

---

## New sidebar structure

### File: `src/components/game/GameSidebar.tsx`

```tsx
const NAV_DAILY = [
  { to: "/", label: "Hub", icon: "morning", weight: "primary" },
  { to: "/quests", label: "Quests", icon: "crown", weight: "primary" },
  { to: "/altar", label: "Altar", icon: "summon", weight: "primary" },
  { to: "/expeditions", label: "Expeditions", icon: "stamina", weight: "primary" },
] as const;

const NAV_WEEKLY = [
  { to: "/battle", label: "Battle", icon: "battle", weight: "secondary" },
  { to: "/compendium", label: "Compendium", icon: "tome", weight: "secondary" },
  { to: "/codex", label: "Codex", icon: "memorial", weight: "secondary" },
  { to: "/island", label: "Island", icon: "sparkle", weight: "secondary" },
] as const;

const NAV_RARE = [
  { to: "/forge", label: "Forge", icon: "stone" },
  { to: "/trial", label: "Trial", icon: "death" },
  { to: "/guild", label: "Guild", icon: "crown" },
  { to: "/fusion", label: "Fusion", icon: "sparkle" },
  { to: "/bazaar", label: "Shop", icon: "gold" },
] as const;
```

### Visual treatment

```tsx
// Primary nav links — bigger, more prominent
<NavLink
  className="ss-nav-primary"
  // padding: 10px 14px; icon size: 22; label: t-body weight 600
/>

// Secondary nav links — smaller
<NavLink
  className="ss-nav-secondary"
  // padding: 6px 12px; icon size: 18; label: t-body-sm
/>

// "More" toggle at bottom of secondary nav — opens a sheet
<button onClick={() => setMoreOpen(true)} className="ss-nav-more">
  <Icon name="next" size={16} />
  More
</button>
```

CSS:

```css
.ss-nav-primary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--ss-radius-md);
  font-family: var(--ss-font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--ss-ink-secondary);
  border-left: 3px solid transparent;
  transition: all 160ms ease-out;
}
.ss-nav-primary.active {
  color: var(--gold-leaf);
  background: rgba(255, 213, 79, 0.08);
  border-left-color: var(--gold-leaf);
}

.ss-nav-secondary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: var(--ss-radius-md);
  font-family: var(--ss-font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--ss-ink-tertiary);
  border-left: 2px solid transparent;
  transition: all 140ms ease-out;
}
.ss-nav-secondary.active {
  color: var(--ss-ink-primary);
  background: rgba(255, 255, 255, 0.03);
  border-left-color: var(--ss-ink-secondary);
}

.ss-nav-more {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--ss-radius-md);
  color: var(--ss-ink-tertiary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-top: 8px;
}
.ss-nav-more:hover {
  color: var(--ss-ink-secondary);
  background: rgba(255, 255, 255, 0.04);
}
```

### Section separators

Use the fleuron divider (file 02) between Daily and Weekly groups in
Proposal A (Burning Page), or a simple `<hr class="ss-divider">` for B/C.

---

## The "More" sheet

A bottom sheet (on mobile via Vaul, see file 11) or a popover (on desktop)
listing the 5 rare destinations. Open via the "More" button.

### File: `src/components/game/MoreSheet.tsx`

```tsx
import { Drawer } from "vaul"; // mobile
// OR for desktop, a Radix popover

export function MoreSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60" />
        <Drawer.Content className="ss-modal fixed bottom-0 left-0 right-0 rounded-b-none mt-24">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-white/20 mb-4" />
          <h3 className="t-h2 mb-3">More</h3>
          <div className="space-y-1">
            {NAV_RARE.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => onOpenChange(false)}
                className="ss-nav-primary"
              >
                <Icon name={item.icon as any} size={20} />
                {item.label}
              </Link>
            ))}
            <hr className="ss-divider" />
            <Link to="/profile" onClick={() => onOpenChange(false)} className="ss-nav-primary">
              <Icon name="bond" size={20} />
              Profile
            </Link>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

---

## Mobile bottom-nav

Replace the existing 5-item mobile bottom nav with the same 4 primary daily
destinations + a More button:

```tsx
// In GameSidebar.tsx mobile block:
<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t backdrop-blur-md ...">
  {NAV_DAILY.map((item) => (
    <MobileNavItem key={item.to} {...item} active={path === item.to} />
  ))}
  <MobileNavItem icon="next" label="More" onClick={() => setMoreOpen(true)} active={false} />
</nav>
```

The mobile bottom-nav now consistently shows Hub / Quests / Altar / Expeditions

- More. The 4 daily destinations match the 4 desktop primary destinations —
  brain memorizes the layout.

---

## Routing — keep all routes working

This is purely a visual reorganization. All 14 routes still exist. Users can
deep-link to `/forge` or `/trial` and reach them. The More sheet is just the
discovery path.

---

## Acceptance checks

- [ ] Desktop sidebar shows 4 primary + 4 secondary + "More" button
- [ ] Primary nav items visually larger than secondary
- [ ] Mobile bottom nav shows Hub / Quests / Altar / Expeditions / More
- [ ] "More" opens a sheet with the 5 rare destinations + Profile
- [ ] All 14 routes remain accessible
- [ ] Active route highlighted with the correct tier styling
- [ ] Build passes

## Tasks for agent

1. Restructure `GameSidebar.tsx` per the spec: split NAV_DAILY / NAV_WEEKLY /
   NAV_RARE.
2. Add the three nav CSS classes to `styles.css`.
3. Create `src/components/game/MoreSheet.tsx` (Vaul-based).
4. Mount the More sheet in `GameSidebar.tsx`.
5. Test that all routes still navigate correctly.
6. Remove the now-redundant secondary nav variants used in the old sidebar.
7. Commit.

## Out of scope

- **Don't reorganize the routes themselves.** They keep their existing paths.
- **Don't add new routes** during this restructure.
- **Don't promote Profile to a top-level Daily destination.** Profile is
  always-accessible but not part of the daily rhythm.
- **Don't combine Battle and Tower into one route.** They are conceptually
  one but mechanically separate. A future redesign of the battle screen will
  unify them.
