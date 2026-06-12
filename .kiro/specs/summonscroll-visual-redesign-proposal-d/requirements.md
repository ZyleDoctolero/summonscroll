# Requirements Document

## Introduction

SummonScroll is a habit-tracker game with 12 shipped mechanical systems. The current visual surface is generic with no committed art direction, using emoji icons and lacking a first-time experience. This redesign will systematically transform the application into a modern anime gacha aesthetic following Proposal D - "The Summoner's Console", inspired by Genshin Impact, Honkai Star Rail, Arknights, and the in-universe game from Pick Me Up, Infinite Gacha.

The redesign encompasses 11 implementation files covering visual identity, surface system, icons, typography, atmosphere, compass component, first-time experience, navigation, empty states, monster art, and mobile responsiveness.

## Glossary

- **System**: The SummonScroll application frontend
- **User**: A player interacting with SummonScroll
- **Surface_Kit**: Tokenized CSS classes for consistent UI chrome (.ss-card, .ss-modal, .ss-pane, etc.)
- **Compass**: A smart suggestion component that recommends next actions
- **Atmosphere**: Background imagery specific to each primary route
- **Proposal_D**: The chosen visual identity - "The Summoner's Console" (modern anime gacha aesthetic)
- **Chrome**: Visual UI elements including borders, gradients, glows, and particles
- **Vaul**: Emil Kowalski's bottom-sheet drawer primitive for mobile UI
- **EARS**: Easy Approach to Requirements Syntax pattern system
- **Rarity**: Monster classification (common, uncommon, rare, elite, epic, legendary, mythic, ex)
- **Gemini**: Google's generative AI service for image generation
- **Hub**: The main dashboard route where users start
- **Altar**: The gacha summoning route
- **Compendium**: The monster collection browser
- **Codex**: The activity heatmap and journal
- **Trial**: The permadeath challenge system
- **Battle**: The tower climbing and combat route
- **Expedition**: The stamina-based dungeon running system
- **Lucide_Icons**: The geometric icon library chosen for Proposal D
- **Profile**: Database record containing user state and preferences
- **Task**: A habit, daily, or todo directive tracked in the system
- **Monster**: A collectible creature in the user's collection
- **Onboarding**: First-time user welcome flow
- **Tutorial_Directive**: The first seeded task for new users
- **Touch_Target**: Interactive UI element sized for finger/thumb taps
- **Responsive_Dialog**: A component that renders as modal on desktop, drawer on mobile

## Requirements

### Requirement 1: Visual Identity Selection and Application

**User Story:** As a developer, I want to commit to Proposal D visual identity, so that all subsequent design decisions inherit from a single coherent aesthetic.

#### Acceptance Criteria

1. THE System SHALL record Proposal D selection in file 01_VISUAL_IDENTITY.md
2. THE System SHALL use Proposal D color palette (void black #08080d, gold-bright #ffd95c, violet #a374ff, cyan #5ae0ff, rose #ff5e85)
3. THE System SHALL apply modern anime gacha surface motifs (gradient borders, radial bursts, particle effects, glowing rarity stars)
4. THE System SHALL use cinematic dramatic voice for all UI copy
5. THE System SHALL generate anime portrait-style monster art with cel-shading and particle effects

### Requirement 2: Surface System Implementation

**User Story:** As a developer, I want a tokenized CSS surface kit, so that all cards, modals, and panes use consistent chrome without inline styles.

#### Acceptance Criteria

1. WHEN the System renders a card, THE System SHALL apply .ss-card class with consistent background, border, radius, shadow, and inset edge
2. WHEN the System renders a modal, THE System SHALL apply .ss-modal class with gradient background and elevated shadow
3. THE System SHALL define CSS custom properties for spacing scale (4px to 48px), radius scale (4px to 16px), and elevation scale (3 shadow levels)
4. THE System SHALL define hairline border variables at 1px with rgba opacity
5. WHERE Proposal D is active, THE System SHALL provide .ss-card-d-glow class with gradient border pseudo-element
6. WHERE Proposal D is active, THE System SHALL provide .ss-burst class with radial gradient animation
7. WHERE Proposal D is active, THE System SHALL provide .ss-tab-d class with glowing under-bar on active state
8. WHERE Proposal D is active, THE System SHALL provide .ss-rarity-star-d class with drop-shadow glow and twinkle animation
9. WHERE Proposal D is active, THE System SHALL provide .ss-stat-d component with Orbitron display font at 1.5x expected size
10. THE System SHALL migrate 19 component files from inline styles to Surface_Kit classes
11. THE System SHALL remove hard-coded color literals (#13161F, #1A1E2A, #1B1F2A, #15181F) from component files
12. WHEN build completes, THE System SHALL pass with no inline box-shadow or border-radius literals in components

### Requirement 3: Icon System Replacement

**User Story:** As a developer, I want to replace all emoji with Lucide Icons, so that icons are consistent, tintable, and geometric.

#### Acceptance Criteria

1. THE System SHALL install lucide-react package
2. THE System SHALL create Icon component in src/components/ui/Icon.tsx with centralized icon mapping
3. THE System SHALL replace currency emoji (💰💎🔑📕🪨⚡✨🥚🧪🍖) with Lucide equivalents
4. THE System SHALL replace player state emoji (🔥❄🧊💖🥀💔❤✦✧👑💀) with Lucide equivalents
5. THE System SHALL replace activity emoji (☀🌙⚔🗼🔮🪦🏝⚜⭐✓✕←→) with Lucide equivalents
6. THE System SHALL replace monster placeholder emoji (👾) with /monsters/placeholder.png or Sphere icon
7. THE Icon component SHALL support name, size, weight, color, and className parameters
8. WHERE Proposal D is active, THE System SHALL apply .lucide-glow utility with drop-shadow filter
9. THE System SHALL migrate 8 high-impact files (PlayerHeader, CascadeCard, WhisperFeed, DailyRitual, Hub, Expeditions, Altar, Profile)
10. WHEN migration completes, THE System SHALL have fewer than 5 emoji literals remaining in source files

### Requirement 4: Typography System Establishment

**User Story:** As a developer, I want five typography roles with Google Fonts, so that display, heading, body, mono, and lore text are visually distinct.

#### Acceptance Criteria

1. THE System SHALL import Orbitron (700/900 weight) for Display role
2. THE System SHALL import Saira Condensed (400/600/700 weight) for Heading role
3. THE System SHALL import Inter (400/500/600/700 weight) for Body role
4. THE System SHALL import JetBrains Mono (400/600 weight) for Mono role
5. THE System SHALL import Spectral (italic 400/500 weight) for Lore role
6. THE System SHALL define CSS utility classes (.t-display, .t-h1, .t-h2, .t-h3, .t-label, .t-body, .t-body-sm, .t-mono, .t-mono-lg, .t-lore, .t-lore-sm)
7. THE System SHALL apply font-family via CSS custom properties (--ss-font-display, --ss-font-heading, --ss-font-body, --ss-font-mono, --ss-font-lore)
8. THE System SHALL use tabular-nums font-variant for all currency and stat counts
9. WHERE Proposal D is active, THE Display role SHALL use 56-80px font sizes for hero numbers
10. WHERE Proposal D is active, THE Heading role SHALL use letter-spacing ≥ 0.08em
11. THE System SHALL remove inline fontFamily declarations from components
12. WHEN migration completes, THE System SHALL have 40+ instances of .t-* classes in use

### Requirement 5: Atmosphere Background Generation

**User Story:** As a developer, I want six route-specific background images, so that each primary screen feels like a distinct place.

#### Acceptance Criteria

1. THE System SHALL generate Hub atmosphere as starfield with concentric sigil rings and slow parallax drift
2. THE System SHALL generate Altar atmosphere as ritual circle with particle wisps and violet gradient floor glow
3. THE System SHALL generate Expedition atmosphere as crossroads with three paths and pre-dawn mist
4. THE System SHALL generate Battle atmosphere as empty coliseum with closed iron gates and twilight sky
5. THE System SHALL generate Codex atmosphere as two-story library with open tome on reading table
6. THE System SHALL generate Trial atmosphere as black iron portcullis half-raised with red light bleeding from darkness
7. THE System SHALL generate Compendium atmosphere as shelf of leather-bound bestiaries with roman numeral spines (optional)
8. WHEN generating atmosphere images, THE System SHALL use Proposal D style anchor (anime gacha key art, particle effects, volumetric lighting, deep near-black background)
9. THE System SHALL output PNG format at 1920x1080 resolution
10. THE System SHALL compress each atmosphere PNG to under 400KB
11. THE System SHALL store atmosphere files in public/atmos/ directory
12. THE System SHALL define .bg-atmos CSS class with background-image, cover size, center-top position, and darkening veil pseudo-element
13. THE System SHALL define per-route classes (.bg-atmos-hub, .bg-atmos-altar, .bg-atmos-expedition, .bg-atmos-battle, .bg-atmos-codex, .bg-atmos-trial, .bg-atmos-compendium)
14. THE System SHALL apply atmosphere classes to 6 primary route root containers
15. THE System SHALL preload Hub atmosphere image for first paint optimization
16. WHEN all atmospheres load, THE System SHALL maintain text contrast ratio ≥ 4.5:1 against backgrounds

### Requirement 6: Compass Component Creation

**User Story:** As a user, I want a smart suggestion component on Hub, so that I always know the highest-leverage action available right now.

#### Acceptance Criteria

1. THE Compass component SHALL evaluate 8 candidate rules (Morning Ritual, Evening Reflection, Reflection Pull, Quarterly Boss, Promotion, Stamina Full, Wailing Wall, Sacred Directives)
2. WHEN Morning window is active AND morning_done is false, THE Compass SHALL suggest "Set today's Sacred Directives" with base score 100 + hours past 4am
3. WHEN Evening window is active AND morning_done is true AND evening_done is false, THE Compass SHALL suggest "Reflect on the day" with base score 90 + hours past wind_down_hour
4. WHEN reflection_pull_granted is true AND reflection_pull_used is false, THE Compass SHALL suggest "A Reflection Pull is waiting" with score 95
5. WHEN active quarterly goal exists AND hp_remaining / hp_total < 0.15, THE Compass SHALL suggest boss completion with score 95
6. WHEN any monster meets promotion requirements (bond ≥ 60%, star_level < 5, level ≥ 15), THE Compass SHALL suggest promotion with score 88 + (newStar * 2)
7. WHEN current stamina ≥ stamina_max, THE Compass SHALL suggest expeditions with score 70
8. WHEN tower highest_floor = 49 AND wailing_wall_cleared_at is null, THE Compass SHALL suggest Wailing Wall challenge with score 92
9. THE Compass SHALL pick the candidate with highest score
10. THE Compass SHALL render single suggestion with icon, title sentence, reason line, and CTA button
11. THE Compass SHALL support three tone styles (calm, urgent, rare) with distinct background and border colors
12. THE Compass SHALL refresh when profile or today-log queries invalidate
13. THE Compass SHALL mount at top of Hub route as first content element
14. WHEN no candidates match, THE Compass SHALL show fallback suggestion "Quiet day. Add a small directive."

### Requirement 7: First-Time Experience Implementation

**User Story:** As a new user, I want guided onboarding with a free first pull, so that I understand the game loop and get immediate delight.

#### Acceptance Criteria

1. THE System SHALL add onboarding_completed_at column to profiles table
2. THE System SHALL add tutorial_directive_id column to profiles table
3. WHEN profile onboarding_completed_at is null, THE System SHALL display welcome carousel modal
4. THE welcome carousel SHALL present 3 cards (habits forge fantasy world, three rhythms one game, start with one directive)
5. WHEN user completes carousel, THE System SHALL insert tutorial directive ("Drink water (first habit)") with difficulty=easy, type=habit, tags=["con"]
6. WHEN tutorial directive is inserted, THE System SHALL update profile onboarding_completed_at to current timestamp
7. WHEN tutorial directive is inserted, THE System SHALL store directive ID in profile tutorial_directive_id
8. WHEN tutorial_directive_id matches task ID, THE TaskCard SHALL apply glowing pulse animation with box-shadow glow
9. WHEN user scores tutorial directive first time, THE System SHALL stop pulse animation
10. WHEN user scores tutorial directive, THE System SHALL display "A summon awaits" follow-up modal
11. WHEN follow-up modal CTA is clicked, THE System SHALL navigate to /altar
12. WHEN user performs first pull (count of pulls = 0), THE System SHALL skip cost requirement
13. WHEN user performs first pull, THE System SHALL guarantee at least one Rare rarity in 10-pull results
14. WHEN onboarding completes, THE System SHALL allow Compass to suggest next actions
15. WHEN user reloads app, THE System SHALL not re-trigger onboarding if onboarding_completed_at is set

### Requirement 8: Navigation Hierarchy Restructure

**User Story:** As a user, I want navigation organized by usage frequency, so that daily destinations are prominent and rare features are in a More drawer.

#### Acceptance Criteria

1. THE System SHALL define Tier 1 Daily navigation (Hub, Quests, Altar, Expeditions) with .ss-nav-primary styling
2. THE System SHALL define Tier 2 Weekly navigation (Battle, Compendium, Codex, Island) with .ss-nav-secondary styling
3. THE System SHALL define Tier 3 Rare navigation (Forge, Trial, Guild, Fusion, Shop) accessible via More button
4. THE .ss-nav-primary class SHALL use 10px/14px padding, 22px icon size, 14px font size, 600 font weight
5. THE .ss-nav-secondary class SHALL use 6px/12px padding, 18px icon size, 12px font size, 500 font weight
6. WHEN nav item is active, THE .ss-nav-primary item SHALL apply gold-leaf color, 8% gold background, and 3px gold left border
7. WHEN nav item is active, THE .ss-nav-secondary item SHALL apply ink-primary color, 3% white background, and 2px secondary left border
8. THE System SHALL add More button at bottom of secondary nav section
9. WHEN More button is clicked, THE System SHALL open MoreSheet component (Vaul drawer on mobile, popover on desktop)
10. THE MoreSheet SHALL list 5 rare destinations plus Profile link
11. THE mobile bottom-nav SHALL show Hub, Quests, Altar, Expeditions, and More button
12. THE System SHALL maintain all 14 routes as accessible (no routes removed)
13. WHEN navigation restructure completes, THE System SHALL preserve deep-linking to all routes

### Requirement 9: Empty State Voice Rewrite

**User Story:** As a user, I want empty states to feel evocative and diegetic, so that every "no X yet" moment has soul.

#### Acceptance Criteria

1. THE System SHALL create EmptyState component with icon, title, body, and optional CTA parameters
2. THE EmptyState component SHALL render dashed border .ss-card with centered content
3. THE EmptyState component SHALL display icon at 40px size with 60% opacity
4. WHEN Hub has no tasks, THE System SHALL display "The grove is quiet." with "Forge one small directive." body
5. WHEN Quests has no active quests, THE System SHALL display "No boss has been named." with "Choose one. Three months from now, what will you have slain?" body
6. WHEN Quests slain list is empty, THE System SHALL display "The wall is bare." with "When you slay your first quarterly boss, the head hangs here." body
7. WHEN Codex journal is empty, THE System SHALL display "The page hasn't seen ink." with evening reflection prompt
8. WHEN Codex awakening log is empty, THE System SHALL display "Nothing has awakened in your company." with discipline message
9. WHEN Trial memorial is empty, THE System SHALL display "No name has been carved." with "May the wall stay bare." body
10. WHEN Battle history is empty, THE System SHALL display "No battles fought." with Tower climbing context
11. WHEN Compendium filters match nothing, THE System SHALL display "The bestiary is silent on this query." with filter/summon suggestion
12. WHEN Forge recipes are locked, THE System SHALL display "The anvil is cold." with level requirement
13. WHEN Bazaar category is empty, THE System SHALL display "The merchant has nothing of that kind today." with tab suggestion
14. WHEN Profile equipment is empty, THE System SHALL display "You stand unarmored." with Bazaar/Forge guidance
15. WHEN Profile inventory is empty, THE System SHALL display "Your satchel is empty." with task drop explanation
16. WHEN Profile pets list is empty, THE System SHALL display "No companion has chosen you." with egg drop hint
17. WHEN Guild is empty, THE System SHALL display "You walk alone." with browse/forge options
18. WHEN Fusion is unavailable, THE System SHALL display "The Matrix is dormant." with summoning requirement
19. WHERE Proposal D is active, THE System SHALL use modern dramatic cinematic voice for all empty states
20. WHEN migration completes, THE System SHALL have zero bare "No X yet" strings in route files

### Requirement 10: Monster Art Regeneration

**User Story:** As a developer, I want consistent anime portrait monster art, so that the collection feels like a professional gacha game.

#### Acceptance Criteria

1. THE System SHALL create locked Gemini prompt in prompts/MONSTER_ART_PROMPT.md
2. THE monster art prompt SHALL specify PNG format with transparent background at 1024x1024 resolution
3. THE monster art prompt SHALL specify anime gacha portrait style (Genshin Impact, Honkai Star Rail, Arknights reference)
4. THE monster art prompt SHALL specify sharp linework, soft cel-shading, hard rim light from upper-back
5. THE monster art prompt SHALL specify bold accent color glow matching element
6. THE monster art prompt SHALL specify particle/wisp effects (5-15 motes maximum)
7. THE monster art prompt SHALL specify confident dramatic stance (weapon raised, hand outstretched, ready-pose)
8. THE monster art prompt SHALL specify three-quarter or full-body view facing slightly off-camera
9. THE monster art prompt SHALL forbid text on armor/banners/scrolls/weapons/background
10. THE monster art prompt SHALL forbid scenes, environment, checker pattern, dialogue bubbles, UI borders, watermarks
11. THE System SHALL create triage script (scripts/triage_monsters.mjs) to score existing 202 images
12. THE triage script SHALL check format (PNG only), alpha channel presence, square aspect ratio, and file size (30-150kb optimal)
13. THE triage script SHALL output CSV with filename, format, size, has_alpha, square, verdict (keep/regen), reason
14. THE System SHALL create batch generation script (scripts/regen_monsters.mjs) to regenerate flagged monsters
15. THE batch generation script SHALL query monsters table filtered by bestiary_id <= CURRENT_RELEASED_MAX
16. THE batch generation script SHALL populate prompt template with monster name, rarity, role, element, origin
17. THE batch generation script SHALL call Gemini 2.0 Flash Exp image generation model
18. THE batch generation script SHALL save generated images as PNG in public/sprites/monsters/
19. THE batch generation script SHALL rate-limit at 1500ms between requests
20. WHEN batch generation completes, THE System SHALL have PNG-only sprites with transparent backgrounds
21. WHEN batch generation completes, THE System SHALL have style-consistent portraits across active bestiary
22. WHEN batch generation completes, THE System SHALL have no AI-generated text baked onto sprites

### Requirement 11: Mobile Responsiveness Optimization

**User Story:** As a mobile user, I want bottom-drawer modals and proper touch targets, so that the app feels native on my phone.

#### Acceptance Criteria

1. THE System SHALL install vaul package for bottom-sheet drawer primitive
2. THE System SHALL create ResponsiveDialog component in src/components/ui/ResponsiveDialog.tsx
3. WHEN viewport width < 768px, THE ResponsiveDialog SHALL render Vaul Drawer with drag handle
4. WHEN viewport width ≥ 768px, THE ResponsiveDialog SHALL render centered modal with backdrop blur
5. THE Vaul Drawer SHALL display white/20 opacity drag handle at top (12px width, 1.5px height, rounded-full)
6. THE Vaul Drawer SHALL allow dismiss by dragging down OR tapping backdrop
7. THE System SHALL migrate PromotionChamber modal to use ResponsiveDialog
8. THE System SHALL migrate DailyRitual modals to use ResponsiveDialog
9. THE System SHALL migrate Trial confirm/results modals to use ResponsiveDialog
10. THE System SHALL migrate Compendium detail modal to use ResponsiveDialog
11. THE System SHALL migrate Onboarding carousel to use ResponsiveDialog
12. THE System SHALL migrate MoreSheet to use ResponsiveDialog
13. WHEN TaskCard +/− buttons render, THE System SHALL apply min-height 44px touch targets
14. WHEN GameSidebar mobile bottom-nav renders, THE System SHALL apply min-height 44px to nav items
15. WHEN Compendium close button renders, THE System SHALL apply 44px x 44px touch target
16. WHEN Quests delete button renders, THE System SHALL apply min-height 32px touch target
17. THE System SHALL create MobilePlayerHeader component displaying level, HP, gold, crystals
18. WHEN viewport width < 768px, THE System SHALL mount MobilePlayerHeader in AppShell
19. WHEN viewport width < 768px, THE System SHALL hide desktop PlayerHeader
20. THE System SHALL add loading="lazy" and decoding="async" to monster portrait images in Compendium grid
21. THE System SHALL add loading="lazy" to atmosphere background images
22. THE System SHALL add pb-20 padding to scroll containers on routes with bottom navigation
23. WHEN mobile optimizations complete, THE System SHALL produce no horizontal scrollbar on 380px viewport
24. WHEN mobile optimizations complete, THE System SHALL render Codex heatmap within 380px viewport width

### Requirement 12: Parser and Serializer Requirements (Not Applicable)

**User Story:** Not applicable - this redesign does not implement parsers or serializers.

#### Acceptance Criteria

1. N/A - No parser or serializer components in scope

### Requirement 13: Build and Integration Requirements

**User Story:** As a developer, I want the redesign to build successfully and integrate with existing systems, so that no features break during visual transformation.

#### Acceptance Criteria

1. WHEN any file migration completes, THE System SHALL pass npm run build without errors
2. THE System SHALL preserve all existing motion-tokens durations and easing curves
3. THE System SHALL preserve all existing sound synthesis from sounds.ts
4. THE System SHALL preserve all 12 mechanical systems (Pick Me Up + 5 Pillars) without backend changes
5. THE System SHALL maintain authentication flow unchanged
6. THE System SHALL maintain database schema except for onboarding columns (onboarding_completed_at, tutorial_directive_id)
7. THE System SHALL maintain Supabase query patterns unchanged except for onboarding mutation
8. THE System SHALL maintain React Query cache keys unchanged
9. THE System SHALL maintain TanStack Router navigation unchanged
10. THE System SHALL maintain existing test suites passing (if present)
11. WHEN all 11 files ship, THE System SHALL have visual identity reading consistently across all screens
12. WHEN all 11 files ship, THE System SHALL have zero emoji icons remaining in UI
13. WHEN all 11 files ship, THE System SHALL have atmosphere backgrounds on 6 primary routes
14. WHEN all 11 files ship, THE System SHALL have Compass providing smart suggestions on Hub
15. WHEN all 11 files ship, THE System SHALL have onboarding flow completing for new users
16. WHEN all 11 files ship, THE System SHALL have 3-tier navigation implemented with More drawer
17. WHEN all 11 files ship, THE System SHALL have all empty states rewritten in chosen voice
18. WHEN all 11 files ship, THE System SHALL have consistent anime portrait monster art
19. WHEN all 11 files ship, THE System SHALL have mobile-optimized dialogs and touch targets
20. WHEN deployed to production, THE System SHALL load Hub atmosphere within 2 seconds on 3G connection

### Requirement 14: Accessibility and Performance Requirements

**User Story:** As a user with accessibility needs, I want the redesigned interface to maintain readability and keyboard navigation, so that I can use SummonScroll effectively.

#### Acceptance Criteria

1. THE System SHALL maintain text contrast ratio ≥ 4.5:1 for body text against backgrounds
2. THE System SHALL maintain text contrast ratio ≥ 3:1 for large text (≥18px) against backgrounds
3. THE Compass component SHALL have role="region" and aria-label="Next action"
4. THE Compass CTA button SHALL be reachable by keyboard tab navigation
5. WHEN Compass suggestion changes to urgent tone, THE System SHALL announce via aria-live="polite"
6. THE Icon components SHALL include aria-hidden="true" attribute
7. THE ResponsiveDialog Vaul Drawer SHALL trap focus within drawer when open
8. THE ResponsiveDialog backdrop SHALL close dialog when clicked with keyboard Enter key
9. THE EmptyState component SHALL maintain semantic heading hierarchy (h1/h2/h3)
10. THE GameSidebar navigation links SHALL indicate active state with aria-current="page"
11. WHEN all atmosphere images load, THE System SHALL maintain First Contentful Paint < 1.8 seconds
12. WHEN Compendium grid loads 202 monsters, THE System SHALL lazy-load images below fold
13. WHEN atmosphere PNGs compress, THE combined size SHALL be < 3MB total
14. WHEN Typography fonts load, THE System SHALL use font-display: swap to prevent FOIT
15. WHEN build completes, THE System SHALL have total bundle size increase < 400KB compared to baseline

