# Implementation Plan: SummonScroll Visual Redesign (Proposal D)

## Overview

This implementation plan transforms SummonScroll from a dark-mode template into a polished modern mobile gacha experience. The chosen identity is **Proposal D: "Summoner's Console"** — matching the Pick Me Up source material's anime gacha aesthetic with glowing gradients, dramatic stat displays, and cinematic atmosphere.

The implementation follows a strict dependency order where visual foundations (surfaces, icons, typography) are established first, then atmosphere and UX components are layered on top, and finally mobile optimizations ensure the experience works on all devices.

**Estimated effort:** 12-15 working days (solo dev, 3-4 hours/day)

---

## Tasks

### Phase 1: Visual Identity Decision (Already Complete)

- [x] 1. Record Visual Identity decision
  - **Decision:** Proposal D — "Summoner's Console" (modern mobile gacha)
  - No code changes; this is a reference point for all subsequent tasks
  - _Requirements: 01_VISUAL_IDENTITY.md_

---

### Phase 2: Foundation Layer (Surface System, Icons, Typography)

- [x] 2. Implement Surface System with Proposal D chrome
  - [x] 2.1 Add Proposal D color palette to src/styles.css
    - Add `:root` CSS variables for Proposal D colors (deep black, gold-bright, violet, cyan, rose gradients)
    - Replace existing color tokens while preserving legacy names for backward compatibility
    - _Requirements: 02_SURFACE_SYSTEM.md — Proposal D palette section_
  - [x] 2.2 Add base surface primitive CSS classes
    - Implement `.ss-card`, `.ss-card-hero`, `.ss-modal`, `.ss-pane`, `.ss-input` base classes
    - Add button primitives: `.ss-btn`, `.ss-btn-primary`, `.ss-btn-secondary`, `.ss-btn-danger`, `.ss-btn-ghost`
    - Add chip and divider utilities: `.ss-chip`, `.ss-chip-gold`, `.ss-divider`
    - _Requirements: 02_SURFACE_SYSTEM.md — Surface primitives section_
  - [x] 2.3 Add Proposal D gradient and glow chrome CSS
    - Implement `.ss-card-d-glow` with gradient border pseudo-element
    - Add `.ss-burst` radial glow effect with pulse animation
    - Add `.ss-tab-d` with animated gold under-bar
    - Implement `.ss-btn-d-primary` with metallic plate styling
    - Add `.ss-rarity-star-d` with particle glow and rarity color variants
    - Implement `.ss-stat-d` Genshin-style stat display components
    - _Requirements: 02_SURFACE_SYSTEM.md — Proposal D specific section_
  - [x] 2.4 Migrate CascadeCard, DailyRitual, and PromotionChamber to surface classes
    - Replace inline background/border styles with `.ss-modal` class
    - Ensure build passes after each component migration
    - _Requirements: 02_SURFACE_SYSTEM.md — Migration plan_
  - [x] 2.5 Migrate TaskCard, PlayerHeader, and WhisperFeed to surface classes
    - Apply `.ss-card` to TaskCard, `.ss-chip-muted` to PlayerHeader currencies
    - Preserve WhisperFeed tone-specific styles while basing on `.ss-card`
    - _Requirements: 02_SURFACE_SYSTEM.md — Migration plan_
  - [x] 2.6 Migrate route screens to surface classes
    - Update Altar, Expeditions, Battle, Quests, Compendium, Codex, Forge, Bazaar screens
    - Replace inline card/modal styles with surface primitives
    - Apply Proposal D chrome (`.ss-card-d-glow`, `.ss-stat-d`) to hero moments
    - Run `npm run build` after each route to verify no regressions
    - _Requirements: 02_SURFACE_SYSTEM.md — Migration table_

- [x] 3. Implement Icon System with Lucide Icons
  - [x] 3.1 Install Lucide Icons and create Icon wrapper component
    - Run `npm install lucide-react`
    - Create `src/components/ui/Icon.tsx` with icon name mapping and Proposal D glow utility
    - Add `.lucide-glow` CSS for hover effects
    - _Requirements: 03_ICON_SYSTEM.md — Option D section_
  - [x] 3.2 Replace emoji in PlayerHeader, CascadeCard, and WhisperFeed
    - Replace 💰/💎/🔑/⚡/✨ with Icon component using appropriate names
    - Apply gold/cyan color tints matching Proposal D palette
    - _Requirements: 03_ICON_SYSTEM.md — Migration files section_
  - [x] 3.3 Replace emoji in Hub, Expeditions, and Altar
    - Update all icon instances to use Icon component
    - Apply `.lucide-glow` to hero moments (Altar summon, Expedition drops)
    - _Requirements: 03_ICON_SYSTEM.md — Migration files section_
  - [x] 3.4 Replace emoji in remaining routes
    - Update Profile, Trial, Quests, Codex, Battle, Compendium icons
    - Replace monster placeholder 👾 with `/monsters/placeholder.png`
    - Run acceptance check: grep for remaining emoji (expect < 5 results)
    - _Requirements: 03_ICON_SYSTEM.md — Migration table_

- [x] 4. Implement Typography System for Proposal D
  - [x] 4.1 Add Google Fonts import for Proposal D fonts
    - Update `src/index.html` with Orbitron, Saira Condensed, Inter, Spectral, JetBrains Mono
    - _Requirements: 04_TYPOGRAPHY_SYSTEM.md — Proposal D section_
  - [x] 4.2 Add typography role CSS classes
    - Add `:root` font-family variables for display/heading/body/mono/lore
    - Implement `.t-display`, `.t-h1`, `.t-h2`, `.t-h3`, `.t-label`, `.t-body`, `.t-body-sm`, `.t-mono`, `.t-mono-lg`, `.t-lore` classes
    - Apply wider letter-spacing and larger sizes per Proposal D rules
    - _Requirements: 04_TYPOGRAPHY_SYSTEM.md — CSS utility classes_
  - [x] 4.3 Migrate components to typography classes
    - Replace inline fontFamily styles with typography classes
    - Apply `.t-display` to hero numbers (levels, damage, large stats)
    - Apply `.t-heading` to screen titles and section labels
    - Apply `.t-mono` to all currency/stat values with `tabular-nums`
    - Apply `.t-lore` to monster flavor text and journal entries
    - _Requirements: 04_TYPOGRAPHY_SYSTEM.md — Component-level migration_
  - [x] 4.4 Test typography on mobile and verify readability
    - Ensure minimum 13px body text on mobile
    - Verify display sizes are appropriately large (56-80px for hero numbers per Proposal D)
    - Run acceptance check: grep for remaining inline fontFamily declarations
    - _Requirements: 04_TYPOGRAPHY_SYSTEM.md — Acceptance checks_

- [x] 5. Checkpoint: Verify foundation layer
  - Ensure all tests pass, build completes successfully
  - Screenshot Hub, Altar, Battle screens to confirm visual identity is consistent
  - Ask the user if questions arise about style decisions

---

### Phase 3: Atmosphere and UX Components

- [x] 6. Generate and apply atmosphere backgrounds
  - [x] 6.1 Generate 6 atmosphere images using Proposal D style anchor
    - Create Gemini prompts with Proposal D style anchor (modern anime gacha, deep black backgrounds, violet/gold/cyan glows, volumetric lighting)
    - Generate: hub.png (starfield with sigil rings), altar.png (ritual circle with particles), expedition.png (crossroads), battle.png (coliseum), codex.png (open tome), trial.png (black gate)
    - Save as `public/atmos/{name}.png`, compress to < 400KB each
    - _Requirements: 05_ATMOSPHERE_PER_SCREEN.md — Six atmosphere paintings section_
  - [x] 6.2 Add atmosphere CSS system
    - Add `.bg-atmos` base class with darkening veil and z-index layering
    - Add per-screen classes: `.bg-atmos-hub`, `.bg-atmos-altar`, `.bg-atmos-expedition`, etc.
    - Add preload link for Hub atmosphere in `src/index.html`
    - _Requirements: 05_ATMOSPHERE_PER_SCREEN.md — The system section_
  - [x] 6.3 Apply atmosphere classes to route screens
    - Add atmosphere classes to Hub, Altar, Expeditions, Battle, Codex, Trial routes
    - Verify text contrast ≥ 4.5:1 against atmospheres; adjust veil opacity if needed
    - Test on mobile: confirm backgrounds scale appropriately with cover/center-top
    - _Requirements: 05_ATMOSPHERE_PER_SCREEN.md — Implementation per route_

- [x] 7. Implement The Compass directive component
  - [x] 7.1 Create Compass component with scoring logic
    - Create `src/components/game/Compass.tsx`
    - Implement 8 candidate suggestion rules (Morning Ritual, Evening Reflection, Reflection Pull, Boss Almost Slain, Promotion Possible, Stamina Full, Wailing Wall, Sacred Directives)
    - Add scoring formula with base scores + bonuses - cooldown penalties
    - Implement tone-based styling (calm/urgent/rare) with Proposal D accent colors
    - _Requirements: 06_THE_COMPASS.md — Component spec section_
  - [x] 7.2 Wire Compass into Hub and remove RitualStatusPill
    - Mount Compass as first child of Hub main content area
    - Pass onOpenMorning/onOpenEvening callbacks
    - Remove deprecated RitualStatusPill component
    - Test that suggestions change based on game state (morning window, completed tasks, stamina level)
    - _Requirements: 06_THE_COMPASS.md — Mount the Compass section_

- [x] 8. Checkpoint: Test atmosphere and Compass
  - Verify atmosphere renders on all 6 primary screens
  - Confirm Compass shows appropriate suggestions throughout the day
  - Ensure all tests pass and build completes
  - Ask the user if questions arise

---

### Phase 4: Onboarding and Navigation

- [ ] 9. Implement First-Time Experience flow
  - [x] 9.1 Create database migration for onboarding columns
    - Create `supabase/migrations/20260621000000_onboarding.sql`
    - Add `onboarding_completed_at` and `tutorial_directive_id` columns to profiles table
    - Run `supabase db push`
    - _Requirements: 07_FIRST_TIME_EXPERIENCE.md — DB change section_
  - [x] 9.2 Create Onboarding welcome carousel component
    - Create `src/components/game/Onboarding.tsx` with 3-card carousel
    - Implement card content (habits forge fantasy, three rhythms, start with one directive)
    - Add progress dots and navigation buttons
    - Style with Proposal D glow and gradient accents
    - _Requirements: 07_FIRST_TIME_EXPERIENCE.md — Step 1 section_
  - [x] 9.3 Implement tutorial directive seeding logic
    - Create `src/lib/game/onboarding-client.ts` with `completeOnboarding()` function
    - Insert tutorial directive ("Drink water (first habit)") on onboarding completion
    - Update profile with onboarding_completed_at and tutorial_directive_id
    - _Requirements: 07_FIRST_TIME_EXPERIENCE.md — Step 2 section_
  - [x] 9.4 Add tutorial pulse effect to TaskCard
    - Detect when task.id matches profile.tutorial_directive_id
    - Apply glowing pulse animation with Proposal D gold color
    - Add `@keyframes tutorial-pulse` CSS animation
    - Clear tutorial flag after first score
    - _Requirements: 07_FIRST_TIME_EXPERIENCE.md — Visual highlighting section_
  - [x] 9.5 Implement free first pull logic
    - Modify `gacha-client.ts > pullBanner` to detect first pull
    - Skip cost for first pull and guarantee at least one Rare in 10-pull
    - Add "Open the Altar" follow-up modal after tutorial directive scored
    - _Requirements: 07_FIRST_TIME_EXPERIENCE.md — Step 3 section_
  - [ ] 9.6 Mount Onboarding and test end-to-end flow
    - Add Onboarding conditional render in Hub based on `onboarding_completed_at`
    - Test full flow: sign up → carousel → tutorial task glows → score → free pull → Compass takes over
    - Verify DB state after each step
    - _Requirements: 07_FIRST_TIME_EXPERIENCE.md — Mounting section_

- [ ] 10. Restructure Navigation Hierarchy
  - [ ] 10.1 Restructure GameSidebar with three nav tiers
    - Split navigation into NAV_DAILY (Hub/Quests/Altar/Expeditions), NAV_WEEKLY (Battle/Compendium/Codex/Island), NAV_RARE (Forge/Trial/Guild/Fusion/Shop)
    - Add `.ss-nav-primary`, `.ss-nav-secondary`, `.ss-nav-more` CSS classes with Proposal D active states
    - Add fleuron or standard divider between Daily and Weekly groups
    - _Requirements: 08_NAV_HIERARCHY.md — New sidebar structure_
  - [ ] 10.2 Create More sheet component for rare destinations
    - Create `src/components/game/MoreSheet.tsx` using Vaul drawer
    - List 5 rare destinations + Profile link
    - Wire open/close state to "More" button in sidebar
    - _Requirements: 08_NAV_HIERARCHY.md — The More sheet section_
  - [ ] 10.3 Update mobile bottom nav to show Daily + More
    - Replace existing 5-item bottom nav with 4 Daily destinations + More button
    - Ensure mobile nav matches desktop primary nav for consistency
    - Test that More sheet opens on mobile when More is tapped
    - _Requirements: 08_NAV_HIERARCHY.md — Mobile bottom-nav section_

- [ ] 11. Checkpoint: Verify onboarding and navigation
  - Test full onboarding flow with a new test account
  - Verify navigation hierarchy on desktop and mobile
  - Ensure all 14 routes remain accessible
  - Ask the user if questions arise

---

### Phase 5: Content Polish (Empty States)

- [x] 12. Implement empty state system and rewrite all empty-state copy
  - [ ] 12.1 Create EmptyState shared component
    - Create `src/components/ui/EmptyState.tsx` with icon, title, body, CTA support
    - Style with dashed border and Proposal D styling
    - Add motion entrance animation
    - _Requirements: 09_EMPTY_STATES.md — The shared component section_
  - [ ] 12.2 Replace empty states in Hub, Quests, and Codex
    - Hub: "The grove is quiet" → Forge directive CTA
    - Quests: "No boss has been named" → Name the Boss CTA
    - Quests slain: "The wall is bare"
    - Codex journal: "The page hasn't seen ink"
    - Codex awakening: "Nothing has awakened"
    - Use Proposal D voice (modern, dramatic, occasionally archaic)
    - _Requirements: 09_EMPTY_STATES.md — The audit section_
  - [x] 12.3 Replace empty states in Trial, Battle, Compendium
    - Trial memorial: "No name has been carved"
    - Battle history: "No battles fought"
    - Compendium filters: "The bestiary is silent on this query"
    - _Requirements: 09_EMPTY_STATES.md — The audit section_
  - [x] 12.4 Replace empty states in remaining routes
    - Forge: "The anvil is cold"
    - Bazaar: "The merchant has nothing of that kind"
    - Profile equipment: "You stand unarmored"
    - Profile inventory: "Your satchel is empty"
    - Guild: "You walk alone"
    - Fusion: "The Matrix is dormant"
    - Run acceptance check: grep for "No X yet" (expect 0 results)
    - _Requirements: 09_EMPTY_STATES.md — The audit section_

- [x] 13. Checkpoint: Verify empty states
  - View each route with appropriate filters/empty state
  - Confirm voice is consistent with Proposal D (dramatic, modern gacha)
  - Ensure all tests pass
  - Ask the user if questions arise

---

### Phase 6: Monster Art Generation (Parallel Track)

- [ ] 14. Set up Monster Art generation pipeline
  - [] 14.1 Confirm and update Monster Art prompt for Proposal D
    - Review `prompts/MONSTER_ART_PROMPT.md`
    - Ensure Proposal D style block is active (anime gacha portrait, dramatic three-quarter pose, sharp linework, soft cel-shading, rim light, particle effects)
    - Verify all forbidden rules (no text, no scenes, transparent background, square 1:1 ratio)
    - _Requirements: 10_MONSTER_ART.md — Part 1 section_
  - [] 14.2 Create and run monster art triage script
    - Create `scripts/triage_monsters.mjs` with Sharp image analysis
    - Run: `npm install --save-dev sharp` then `node scripts/triage_monsters.mjs`
    - Review `triage_report.csv` and manually mark keep vs regenerate decisions
    - _Requirements: 10_MONSTER_ART.md — Part 2 section_
  - [] 14.3 Create batch generation runner script
    - Create `scripts/regen_monsters.mjs` using Supabase client and Gemini API
    - Configure environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY)
    - Set CURRENT_RELEASED_MAX to control batch size
    - _Requirements: 10_MONSTER_ART.md — Part 3 section_
  - [] 14.4 Run batch generation for first 50 monsters (test run)
    - Execute `node scripts/regen_monsters.mjs`
    - Manually inspect output for style consistency
    - Verify portraits match Proposal D aesthetic (anime dramatic poses, glowing eyes, particle wisps)
    - Tune prompt if needed based on results
    - _Requirements: 10_MONSTER_ART.md — Workflow summary_
  - [ ] 14.5 Complete batch generation and replace old files
    - Run full batch for remaining monsters (up to CURRENT_RELEASED_MAX)
    - Move old files to `public/sprites/monsters_old_backup/`
    - Replace with new consistent Proposal D portraits
    - Verify in Compendium grid that style is cohesive across all visible monsters
    - _Requirements: 10_MONSTER_ART.md — Workflow summary_

---

### Phase 7: Mobile-First Optimization

- [ ] 15. Implement mobile-responsive patterns
  - [ ] 15.1 Create ResponsiveDialog wrapper component
    - Create `src/components/ui/ResponsiveDialog.tsx` using Vaul for mobile
    - Implement useIsMobile hook with 768px breakpoint
    - Mobile (<768px): Vaul bottom drawer with drag handle
    - Desktop (≥768px): Centered modal with backdrop
    - _Requirements: 11_MOBILE_FIRST.md — The shared dialog wrapper section_
  - [ ] 15.2 Migrate modals to ResponsiveDialog
    - Wrap PromotionChamber content in ResponsiveDialog
    - Wrap DailyRitual (Morning + Evening) content
    - Wrap Trial confirm and results modals
    - Wrap Compendium detail modal
    - Wrap Onboarding component (if not already drawer-based)
    - Update MoreSheet to use ResponsiveDialog instead of raw Vaul
    - Test each modal on mobile width (380×800 viewport)
    - _Requirements: 11_MOBILE_FIRST.md — Components to migrate_
  - [ ] 15.3 Audit and fix touch targets to meet 44px minimum
    - TaskCard +/− buttons: bump from 36px to 44px (`w-11 h-11`)
    - GameSidebar mobile bottom nav: ensure `min-h-[44px]`
    - Compendium close button: bump to `w-11 h-11`
    - Forge recipe rows: bump `py-2` to `py-3` on mobile
    - Quests "Abandon" button: bump to `min-h-[32px] px-3`
    - _Requirements: 11_MOBILE_FIRST.md — Touch targets section_
  - [ ] 15.4 Create and mount MobilePlayerHeader component
    - Create `src/components/game/MobilePlayerHeader.tsx` with compact sticky header
    - Show level, HP, gold, crystals in condensed format
    - Mount in AppShell before desktop PlayerHeader (md:hidden vs hidden md:flex)
    - _Requirements: 11_MOBILE_FIRST.md — PlayerHeader on mobile section_
  - [ ] 15.5 Add lazy loading to monster portraits
    - Add `loading="lazy" decoding="async"` to all monster `<img>` tags in Compendium grid and Altar reveal
    - Add `pb-20` (bottom padding) to scroll containers on screens with bottom nav to prevent content overlap
    - _Requirements: 11_MOBILE_FIRST.md — Grid density audit section_
  - [ ] 15.6 Test full mobile experience on real device
    - Deploy to Vercel preview URL
    - Test on iOS and Android (if available) or use Chrome mobile emulator at 380×800
    - Verify: all drawers open/dismiss correctly, touch targets are tappable, no horizontal scroll, bottom nav doesn't overlap content
    - Run acceptance checks from requirements
    - _Requirements: 11_MOBILE_FIRST.md — Acceptance checks_

- [ ] 16. Final checkpoint and polish
  - Run full test suite: `npm run build` and verify no errors
  - Screenshot every primary screen (Hub, Altar, Expeditions, Battle, Codex, Trial, Compendium) on desktop and mobile
  - Compare screenshots against Proposal D design principles: gradients, glows, dramatic stat displays, anime portrait consistency
  - Ensure all 11 implementation files' acceptance checks pass
  - Ask the user if final questions or concerns arise

---

## Notes

- **Tasks marked with `*` are optional** — none in this plan; all tasks are required for the complete Proposal D implementation
- **Parallel execution**: File 10 (Monster Art) can run in parallel with Phases 2-5 since it's independent
- **Checkpoints**: Included at reasonable breaks (after Phase 2, 3, 4, 5) to validate incremental progress
- **Property-based tests**: Not applicable for this visual redesign — this is pure UI/UX implementation with manual visual acceptance checks
- **Each task references specific requirements** from the original design files (02-11) for traceability

## Deployment Strategy

After all tasks complete:

1. Commit per-phase with descriptive commit messages following the pattern from 12_IMPLEMENTATION_ORDER.md
2. Push to main (trunk-based) or create a `redesign/proposal-d` feature branch for PR review
3. Deploy to Vercel staging for final QA
4. Take before/after screenshots of every screen for documentation
5. Ship to production

## Success Criteria

After all 16 task groups complete:

- ✅ Visual identity reads as "modern anime gacha game" (Proposal D) consistently across all screens
- ✅ Surfaces use gradient borders, glowing accents, and dramatic stat displays
- ✅ Typography uses Orbitron for display numbers (large, confident), Saira Condensed for headings
- ✅ Icons are Lucide with gold/violet/cyan tints and glow effects on hero moments
- ✅ Atmosphere backgrounds create distinct sense of place per route
- ✅ Compass provides clear "what to do next" directive on Hub
- ✅ Onboarding guides new users through first directive → free pull → ongoing play
- ✅ Navigation has clear three-tier hierarchy (Daily/Weekly/Rare)
- ✅ Empty states use evocative voice matching Proposal D (dramatic, modern, occasionally archaic)
- ✅ Monster portraits are anime-style with consistent dramatic poses and glowing particle effects
- ✅ Mobile experience uses bottom drawers, meets 44px touch targets, shows compact header
- ✅ Build passes, no console errors, performance is acceptable on 4G mobile connection
