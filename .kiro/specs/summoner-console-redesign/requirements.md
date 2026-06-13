# Requirements Document

## Introduction

SummonScroll is a habit-tracking application disguised as a dark fantasy gacha game, inspired by the web novel "Pick Me Up, Infinite Gacha". The application has 12 mechanical systems fully implemented and working, but the visual surface lacks a committed art direction, uses emoji icons inconsistently, and provides no guided first-time user experience.

This redesign implements **Proposal D - "The Summoner's Console"**, a modern anime mobile gacha aesthetic inspired by Genshin Impact, Honkai: Star Rail, Arknights, Wuthering Waves, and Limbus Company. This is the visual language the in-universe Pick Me Up game would actually use: deep void black backgrounds with bright glowing accents, gradient borders with particle effects, big confident stat numbers, dramatic anime-style hero portraits, radial light bursts, glowing rarity stars, and HUD-style chrome with metallic plate buttons.

The redesign encompasses 11 sequential implementation files covering: visual identity decision, surface system tokenization, icon system replacement, typography system establishment, atmosphere per screen, The Compass component, first-time experience flow, navigation hierarchy restructure, empty state voice rewrite, monster art regeneration, and mobile-first optimization.

## Glossary

- **System**: The SummonScroll frontend application
- **User**: A player interacting with SummonScroll
- **Proposal_D**: The chosen visual identity "The Summoner's Console" - modern anime gacha aesthetic
- **Surface_Kit**: Tokenized CSS classes providing consistent UI chrome (.ss-card, .ss-modal, .ss-pane, .ss-btn, .ss-chip)
- **Chrome**: Visual UI elements including borders, gradients, glows, shadows, and particle effects
- **Compass**: A smart suggestion component on the Hub that recommends the highest-leverage action available
- **Atmosphere**: Background imagery specific to each primary route that creates sense of place
- **Lucide_Icons**: The geometric icon library chosen for Proposal D (clean, consistent, tintable)
- **Vaul**: Emil Kowalski's bottom-sheet drawer primitive for mobile UI patterns
- **EARS**: Easy Approach to Requirements Syntax - requirement writing pattern system
- **Hub**: The main dashboard route where users start their session
- **Altar**: The gacha summoning route where users pull new monsters
- **Compendium**: The monster collection browser showing owned creatures
- **Codex**: The activity heatmap and journal route
- **Trial**: The permadeath challenge system route
- **Battle**: The tower climbing and combat route
- **Expedition**: The stamina-based dungeon running system
- **Profile**: Database record containing user state, level, resources, and preferences
- **Task**: A habit, daily, or todo directive tracked in the system
- **Monster**: A collectible creature in the user's collection
- **Onboarding**: First-time user welcome flow (carousel + tutorial + free pull)
- **Tutorial_Directive**: The first seeded task for new users to learn the scoring mechanic
- **Touch_Target**: Interactive UI element sized for finger/thumb taps (minimum 44px × 44px)
- **Responsive_Dialog**: Component rendering as modal on desktop, drawer on mobile
- **Rarity**: Monster classification (common, uncommon, rare, elite, epic, legendary, mythic, ex)
- **Gemini**: Google's generative AI service for image generation
- **PlayerHeader**: Desktop component showing user stats (level, HP, XP, currencies)
- **MobilePlayerHeader**: Compact sticky header for mobile showing essential stats
- **CascadeCard**: Connective-tissue card component showing event ripples from user actions
- **WhisperFeed**: Diegetic dialogue feed showing monster reactions
- **PromotionChamber**: Modal for promoting monsters to higher star levels
- **DailyRitual**: Morning and Evening reflection modal components
- **GameSidebar**: Desktop navigation sidebar with hierarchical sections
- **AppShell**: Root layout component containing header, nav, and content areas
- **MoreSheet**: Drawer/popover containing rare navigation destinations (Tier 3)

## Requirements

### Requirement 1: Visual Identity Commitment

**User Story:** As a developer, I want to commit to Proposal D ("The Summoner's Console") visual identity, so that all subsequent design and implementation decisions inherit from a single coherent aesthetic.

#### Acceptance Criteria

1. THE System SHALL record Proposal D selection in prompts/redesign/01_VISUAL_IDENTITY.md file header
2. THE System SHALL use Proposal D color palette as CSS custom properties (--bg-deep: #08080d, --bg-stage: #11111c, --bg-panel: #1a1a2a, --bg-pane: #232336, --ink-primary: #f5f0e6, --ink-secondary: #9089a8, --ink-tertiary: #5a566b, --gold-bright: #ffd95c, --gold-glow: #ffb83d, --violet: #a374ff, --cyan: #5ae0ff, --rose: #ff5e85, --ember: #ff7843, --success: #5dd39e, --danger: #ff5e5e)
3. THE System SHALL apply modern anime gacha surface motifs (glowing 2-stop gradient borders, radial light bursts, particle-emitting rarity stars, metallic plate buttons with inset highlights, animated star/particle drift)
4. THE System SHALL use cinematic dramatic voice for all UI copy (modern English with archaic flavor, evocative without flowery, action-verb driven)
5. THE System SHALL generate anime portrait-style monster art with cel-shading, particle effects, volumetric lighting, and confident dramatic stances

### Requirement 2: Surface System Tokenization

**User Story:** As a developer, I want a tokenized CSS surface kit in src/styles.css, so that all cards, modals, panes, buttons, and inputs use consistent chrome without inline styles.

#### Acceptance Criteria

1. THE System SHALL define spacing scale CSS variables (--ss-space-1: 4px through --ss-space-8: 48px)
2. THE System SHALL define radius scale CSS variables (--ss-radius-sm: 4px, --ss-radius-md: 8px, --ss-radius-lg: 12px, --ss-radius-xl: 16px, --ss-radius-pill: 9999px)
3. THE System SHALL define elevation scale CSS variables (--ss-shadow-low, --ss-shadow-mid, --ss-shadow-high with rgba black at 0.25, 0.40, 0.55 opacity)
4. THE System SHALL define inset edge highlight (--ss-inset-edge: inset 0 1px 0 rgba(255,255,255,0.04))
5. THE System SHALL define hairline border variables (--ss-hairline: 1px solid rgba(255,255,255,0.06), --ss-hairline-soft: 1px solid rgba(255,255,255,0.03), --ss-hairline-active: 1px solid rgba(255,213,79,0.32))
6. WHEN System renders a card, THE System SHALL apply .ss-card class with background var(--ss-bg-pane), border var(--ss-hairline), border-radius var(--ss-radius-lg), padding var(--ss-space-4), box-shadow var(--ss-shadow-low) and var(--ss-inset-edge), and transition on border-color and transform
7. WHEN System renders a hero card, THE System SHALL apply .ss-card-hero class with linear-gradient background, active hairline border, radius-lg, space-5 padding, and shadow-mid
8. WHEN System renders a modal, THE System SHALL apply .ss-modal class with gradient background from bg-pane to bg-deep, active hairline border, radius-xl, space-5 padding, shadow-high, and 28rem max-width
9. WHEN System renders a modal backdrop, THE System SHALL apply .ss-modal-backdrop with rgba(0,0,0,0.78) background and 3px backdrop-filter blur
10. THE System SHALL define .ss-pane class for sub-sections with rgba(0,0,0,0.32) background, radius-md, and space-3 padding
11. THE System SHALL define .ss-input class with full width, dark background, hairline border, focus state with active hairline and box-shadow glow
12. THE System SHALL define .ss-btn base class with inline-flex, center alignment, space-2 gap, padding, radius-md, uppercase 12px text with 0.18em letter-spacing, 700 font-weight, pointer cursor, and transform/box-shadow transitions
13. THE System SHALL define .ss-btn-primary class with gold gradient background, deep background text color, no border, and gold glow box-shadow
14. THE System SHALL define .ss-btn-secondary class with rgba white background, secondary ink color, and hairline border
15. THE System SHALL define .ss-btn-danger class with red gradient background and red glow box-shadow
16. THE System SHALL define .ss-btn-ghost class with transparent background, secondary ink color, no border, and reduced padding
17. THE System SHALL define .ss-chip base class with inline-flex, space-1 gap, 2px 8px padding, pill radius, 10px uppercase text with 0.15em letter-spacing, 700 font-weight, 1 line-height, and transparent border
18. THE System SHALL define .ss-chip-gold class with gold rgba background, gold-leaf color, and gold rgba border
19. THE System SHALL define .ss-chip-muted class with white rgba background and tertiary ink color
20. THE System SHALL define .ss-divider class with 1px height, hairline background, no border, and space-3 vertical margin
21. WHERE Proposal D is active, THE System SHALL define .ss-card-d-glow class with gradient border pseudo-element using linear-gradient from gold-glow through violet, -webkit-mask for 1px outline effect
22. WHERE Proposal D is active, THE System SHALL define .ss-burst class with radial-gradient pseudo-element (gold/violet fading to transparent) and 4s ease-in-out infinite pulse animation
23. WHERE Proposal D is active, THE System SHALL define .ss-tab-d class with 12px 18px padding, secondary ink color, transition on color, and active state with primary ink color and gold gradient under-bar with glow
24. WHERE Proposal D is active, THE System SHALL define .ss-btn-d-primary class with gold gradient, deep background text, inset white highlight, metallic glow, and hard bottom edge shadow
25. WHERE Proposal D is active, THE System SHALL define .ss-rarity-star-d class with inline-flex, 2px gap, gold-bright color, drop-shadow glow filter, and 2.5s ease-in-out infinite twinkle animation
26. WHERE Proposal D is active, THE System SHALL define rarity star variants (rarity-rare: cyan, rarity-epic: violet, rarity-legendary: gold-bright, rarity-mythic: rose, rarity-ex: multi-glow)
27. WHERE Proposal D is active, THE System SHALL define .ss-stat-d component with flex column, center alignment, padding, dark background, hairline border, radius-md
28. WHERE Proposal D is active, THE System SHALL define .ss-stat-d-label with heading font, 10px size, 0.18em letter-spacing, uppercase, secondary ink color
29. WHERE Proposal D is active, THE System SHALL define .ss-stat-d-value with display font (Orbitron), 28px size, 700 weight, gold-bright color, tabular-nums, and 0.02em letter-spacing
30. THE System SHALL migrate 19 component files from inline style declarations to Surface_Kit classes (CascadeCard, DailyRitual, PromotionChamber, WhisperFeed, TaskCard, PlayerHeader, AppShell, GameSidebar, altar route, expeditions route, battle route, quests route, compendium route, codex route, forge route, bazaar route, profile route, trial route, guild route, fusion route)
31. WHEN migration completes, THE System SHALL have zero inline background color literals (#13161F, #1A1E2A, #1B1F2A, #15181F) in component tsx files
32. WHEN migration completes, THE System SHALL have zero inline box-shadow values in component tsx files (except specialty hover effects)
33. WHEN build completes after migration, THE System SHALL pass npm run build with no TypeScript errors

### Requirement 3: Icon System Replacement

**User Story:** As a developer, I want to replace all emoji with Lucide Icons, so that icons are consistent, tintable, geometric, and professional.

#### Acceptance Criteria

1. THE System SHALL install lucide-react package via npm
2. THE System SHALL create Icon component in src/components/ui/Icon.tsx
3. THE Icon component SHALL define ICONS constant mapping semantic names to Lucide components (gold: Coins, crystal: Diamond, seal: Key, tome: BookOpen, stone: Cube, stamina: Lightning, sparkle: Sparkle, egg: Egg, potion: TestTube, food: ForkKnife, streak: Flame, cold: Snowflake, bond: Heart, bondLow: HeartBreak, hp: Heart, xp: Sparkle, crown: Crown, death: Skull, morning: Sun, evening: MoonStars, battle: Sword, tower: Sphere, summon: Sphere, memorial: Cross, star: Star, check: Check, close: X, prev: ArrowLeft, next: ArrowRight)
4. THE Icon component SHALL accept name (IconName type), size (default 16), weight (default "regular"), color (default "currentColor"), and className parameters
5. THE Icon component SHALL render chosen Lucide component with passed parameters and aria-hidden attribute
6. THE System SHALL replace currency emoji (💰 → gold, 💎 → crystal, 🔑 → seal, 📕 → tome, 🪨 → stone, ⚡ → stamina, ✨ → sparkle, 🥚 → egg, 🧪 → potion, 🍖 → food) with Icon component
7. THE System SHALL replace player state emoji (🔥 → streak, ❄ → cold, 🧊 → cold, 💖 → bond, 🥀 → bondLow, 💔 → bondLow, ❤ → hp, ✦✧ → xp, 👑 → crown, 💀 → death) with Icon component
8. THE System SHALL replace activity emoji (☀ → morning, 🌙 → evening, ⚔ → battle, 🗼 → tower, 🔮 → summon, 🪦 → memorial, 🏝 → island, ⚜ → crown, ⭐ → star, ✓ → check, ✕ → close, ←→ → prev/next) with Icon component
9. THE System SHALL replace monster placeholder emoji (👾) with /monsters/placeholder.png image OR Sphere icon at 50% opacity
10. WHERE Proposal D is active, THE System SHALL define .lucide-glow utility class with drop-shadow(0 0 4px currentColor) filter and transition on filter
11. WHERE Proposal D is active, THE .lucide-glow:hover state SHALL apply drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor) filter
12. THE System SHALL migrate 8 high-impact files first (PlayerHeader.tsx, CascadeCard.tsx, WhisperFeed.tsx, DailyRitual.tsx, routes/\_authenticated/index.tsx, routes/\_authenticated/expeditions.tsx, routes/\_authenticated/altar.tsx, routes/\_authenticated/profile.tsx)
13. THE System SHALL migrate 4 lower-priority files (trial.tsx, quests.tsx, codex.tsx, battle.tsx)
14. THE System SHALL tint icons with semantic colors (gold icons use var(--gold-leaf), crystal icons use var(--cyan) or var(--violet), HP icons use var(--danger), success icons use var(--success))
15. THE System SHALL apply glow class to hero moment icons (modal headers, ceremony banners, compass icon)
16. WHEN migration completes, THE System SHALL have fewer than 5 emoji Unicode literals remaining in src tsx/ts files (excluding display-only contexts like onboarding text strings)
17. WHEN migration completes, THE System SHALL use Icon component import in 12+ component files
18. WHEN build completes after migration, THE System SHALL pass npm run build with no import errors

### Requirement 4: Typography System Establishment

**User Story:** As a developer, I want five typography roles with Google Fonts, so that display numbers, headings, body text, mono stats, and lore flavor are visually distinct and hierarchy is clear.

#### Acceptance Criteria

1. THE System SHALL add Google Fonts link tag to src/index.html importing Orbitron (500, 700, 900 weights), Saira Condensed (400, 600, 700 weights), Inter (400, 500, 600, 700 weights), Spectral italic (400, 500 weights), and JetBrains Mono (400, 600 weights)
2. THE System SHALL define --ss-font-display CSS variable as 'Orbitron', sans-serif
3. THE System SHALL define --ss-font-heading CSS variable as 'Saira Condensed', sans-serif
4. THE System SHALL define --ss-font-body CSS variable as 'Inter', system-ui, sans-serif
5. THE System SHALL define --ss-font-mono CSS variable as 'JetBrains Mono', monospace
6. THE System SHALL define --ss-font-lore CSS variable as 'Spectral', serif
7. THE System SHALL define text size scale CSS variables (--ss-text-xs: 12px, --ss-text-sm: 13px, --ss-text-base: 15px, --ss-text-lg: 18px, --ss-text-xl: 22px, --ss-text-2xl: 28px, --ss-text-3xl: 36px, --ss-text-4xl: 48px, --ss-text-5xl: 64px)
8. THE System SHALL define letter-spacing scale CSS variables (--ss-track-tight: -0.01em, --ss-track-normal: 0, --ss-track-wide: 0.04em, --ss-track-wider: 0.08em, --ss-track-widest: 0.18em)
9. THE System SHALL apply body font-family, text-base size, ink-primary color, and 1.5 line-height to body element
10. THE System SHALL define .t-display class with display font, text-4xl size, 700 weight, track-wide letter-spacing, and 1.05 line-height
11. THE System SHALL define .t-h1 class with heading font, text-3xl size, 700 weight, track-wide letter-spacing, and 1.1 line-height
12. THE System SHALL define .t-h2 class with heading font, text-xl size, 700 weight, track-normal letter-spacing, and 1.2 line-height
13. THE System SHALL define .t-h3 class with heading font, text-base size, 700 weight, and track-wide letter-spacing
14. THE System SHALL define .t-label class with body font, 10px size, 700 weight, track-widest letter-spacing, uppercase transform, and secondary ink color
15. THE System SHALL define .t-body class with body font, text-base size, 500 weight, 1.5 line-height, and primary ink color
16. THE System SHALL define .t-body-sm class with body font, text-sm size, 500 weight, 1.45 line-height, and secondary ink color
17. THE System SHALL define .t-mono class with mono font, text-base size, 600 weight, and tabular-nums font-variant
18. THE System SHALL define .t-mono-lg class with mono font, text-lg size, 600 weight, and tabular-nums font-variant
19. THE System SHALL define .t-lore class with lore font, text-sm size, italic style, 400 weight, 1.5 line-height, and secondary ink color
20. THE System SHALL define .t-lore-sm class with lore font, text-xs size, italic style, 400 weight, and tertiary ink color
21. WHERE Proposal D is active, THE Display role SHALL use 56-80px font sizes for hero numbers (text-5xl for level displays, ceremony titles, big reveals)
22. WHERE Proposal D is active, THE Heading role SHALL use letter-spacing ≥ 0.08em (track-wider minimum)
23. WHERE Proposal D is active, THE Mono role SHALL use 700 font weight for stat displays (HP/ATK/DEF/SPD) with tabular-nums
24. WHERE Proposal D is active, THE Lore role SHALL only appear in dialogue bubbles (WhisperFeed), journal entries (Codex), and monster flavor (Compendium detail)
25. THE System SHALL remove inline fontFamily style declarations from component tsx files
26. THE System SHALL migrate 15+ component files to use typography classes (PlayerHeader, TaskCard, CascadeCard, WhisperFeed, DailyRitual, PromotionChamber, altar route, compendium route, codex route, profile route, quests route, battle route, trial route, forge route, bazaar route, guild route)
27. THE System SHALL apply tabular-nums font-variant to all elements displaying currency counts, HP/XP/stamina counts, percentages, and stat numbers
28. WHEN migration completes, THE System SHALL have fewer than 5 inline fontFamily declarations in src tsx files (excluding motion-tokens or legacy auth files)
29. WHEN migration completes, THE System SHALL have 40+ instances of .t-\* typography classes in component files
30. WHEN build completes after migration, THE System SHALL pass npm run build with fonts loading successfully

### Requirement 5: Atmosphere Background Generation

**User Story:** As a developer, I want six route-specific background images with Proposal D anime gacha key art style, so that each primary screen feels like a distinct place with sense of atmosphere.

#### Acceptance Criteria

1. THE System SHALL generate Hub atmosphere as starfield with faint concentric sigil rings, slow parallax drift, deep near-black background, volumetric lighting, anime gacha key art style, PNG format, 1920x1080 resolution
2. THE System SHALL generate Altar atmosphere as full ritual circle with particle wisps swirling around it, violet gradient floor glow, CSS animation compatible, deep near-black background, anime gacha key art style, PNG format, 1920x1080 resolution
3. THE System SHALL generate Expedition atmosphere as crossroads junction with three diverging paths, pre-dawn mist, soft diffuse lighting, deep near-black background, anime gacha key art style, PNG format, 1920x1080 resolution
4. THE System SHALL generate Battle atmosphere as empty coliseum arena with closed iron gates, twilight sky above, dramatic side lighting, deep near-black background, anime gacha key art style, PNG format, 1920x1080 resolution
5. THE System SHALL generate Codex atmosphere as two-story library interior with open tome on reading table, warm candlelight, leather-bound books on shelves, deep near-black background, anime gacha key art style, PNG format, 1920x1080 resolution
6. THE System SHALL generate Trial atmosphere as black iron portcullis half-raised with red light bleeding from darkness beyond, ominous fog, deep near-black background, anime gacha key art style, PNG format, 1920x1080 resolution
7. THE System SHALL optionally generate Compendium atmosphere as shelf of leather-bound bestiaries with roman numeral spines, soft study lighting, deep near-black background, anime gacha key art style, PNG format, 1920x1080 resolution
8. WHEN generating atmosphere images, THE System SHALL use Proposal D style anchors (modern anime mobile gacha aesthetic, Genshin Impact/Honkai Star Rail/Arknights reference, particle/wisp effects, volumetric lighting, dramatic rim lighting)
9. WHEN generating atmosphere images, THE System SHALL compress each PNG to under 400KB file size while maintaining visual quality
10. THE System SHALL store atmosphere files in public/atmos/ directory with semantic names (hub.png, altar.png, expedition.png, battle.png, codex.png, trial.png, compendium.png)
11. THE System SHALL define .bg-atmos base class with background-image property, background-size: cover, background-position: center top, and darkening veil pseudo-element (rgba black overlay at 0.4-0.6 opacity)
12. THE System SHALL define .bg-atmos-hub class with background-image url(/atmos/hub.png)
13. THE System SHALL define .bg-atmos-altar class with background-image url(/atmos/altar.png)
14. THE System SHALL define .bg-atmos-expedition class with background-image url(/atmos/expedition.png)
15. THE System SHALL define .bg-atmos-battle class with background-image url(/atmos/battle.png)
16. THE System SHALL define .bg-atmos-codex class with background-image url(/atmos/codex.png)
17. THE System SHALL define .bg-atmos-trial class with background-image url(/atmos/trial.png)
18. THE System SHALL define .bg-atmos-compendium class with background-image url(/atmos/compendium.png) if generated
19. THE System SHALL apply .bg-atmos-hub class to routes/\_authenticated/index.tsx root container
20. THE System SHALL apply .bg-atmos-altar class to routes/\_authenticated/altar.tsx root container
21. THE System SHALL apply .bg-atmos-expedition class to routes/\_authenticated/expeditions.tsx root container
22. THE System SHALL apply .bg-atmos-battle class to routes/\_authenticated/battle.tsx root container
23. THE System SHALL apply .bg-atmos-codex class to routes/\_authenticated/codex.tsx root container
24. THE System SHALL apply .bg-atmos-trial class to routes/\_authenticated/trial.tsx root container
25. THE System SHALL apply .bg-atmos-compendium class to routes/\_authenticated/compendium.tsx root container if generated
26. THE System SHALL add <link rel="preload" as="image" href="/atmos/hub.png"> to index.html for first paint optimization
27. THE System SHALL add loading="lazy" attribute to atmosphere background images for non-Hub routes
28. WHEN all atmospheres load, THE System SHALL maintain text contrast ratio ≥ 4.5:1 for body text (15px) against darkened backgrounds
29. WHEN all atmospheres load, THE System SHALL maintain text contrast ratio ≥ 3:1 for large text (≥18px) against darkened backgrounds
30. WHEN all 6-7 atmosphere images are compressed, THE combined file size SHALL be under 3MB total

### Requirement 6: Compass Component Implementation

**User Story:** As a user, I want a smart suggestion component on the Hub that evaluates my current state and recommends the highest-leverage action, so that I never face decision paralysis or miss time-sensitive opportunities.

#### Acceptance Criteria

1. THE System SHALL create Compass component in src/components/game/Compass.tsx
2. THE Compass component SHALL query profile, today-log, goals-active, my-monsters, and tower data using React Query
3. THE Compass component SHALL define 8 candidate rules (Morning Ritual ready, Evening Reflection ready, Reflection Pull available, Quarterly Boss almost slain, Promotion possible, Stamina full, Wailing Wall reached, Sacred Directives almost done)
4. WHEN isMorningWindow() returns true AND log.am_completed_at is null, THE Compass SHALL create Morning Ritual candidate with score 100 + hoursPast4am, title "Set today's Sacred Directives.", reason "Mornings shape the day. Three tasks earn 1.5× rewards.", cta "Begin Ritual", action onOpenMorning callback, icon "morning", tone "calm"
5. WHEN isEveningWindow() returns true AND log.am_completed_at is not null AND log.pm_completed_at is null, THE Compass SHALL create Evening Reflection candidate with score 90 + hoursPastWindDown, title "Reflect on the day.", reason "Ninety seconds. Builds the ritual streak.", cta "Reflect", action onOpenEvening callback, icon "evening", tone "calm"
6. WHEN log.reflection_pull_granted is true AND log.reflection_pull_used is false, THE Compass SHALL create Reflection Pull candidate with score 95, title "A Reflection Pull is waiting.", reason "Earned tonight. Claim before midnight.", cta "Open the Altar", to "/altar", icon "summon", tone "rare"
7. WHEN active quarterly goal exists AND hp_remaining / hp_total < 0.15, THE Compass SHALL create Quarterly Boss candidate with score 95, title "{goal.title} is close to falling.", reason "{hp_remaining} HP left. Strike now.", cta "View Quests", to "/quests", icon "crown", tone "urgent"
8. WHEN any monster has bond_percent ≥ 60 AND star_level < 5 AND level ≥ 15, THE Compass SHALL create Promotion candidate with score 88 + (newStarLevel \* 2), title "{monster.name} may be ready to promote.", reason "Visit the Chamber to check the stones.", cta "Inspect", to "/compendium", icon "star", tone "calm"
9. WHEN computeCurrentStamina() returns value ≥ stamina_max, THE Compass SHALL create Stamina Full candidate with score 70, title "Stamina is full.", reason "Five expedition runs ready.", cta "Send the team", to "/expeditions", icon "stamina", tone "calm"
10. WHEN tower.highest_floor = 49 AND tower.wailing_wall_cleared_at is null, THE Compass SHALL create Wailing Wall candidate with score 92, title "Floor 50 is the Wailing Wall.", reason "First clear earns 5 Tome Shards and a permanent badge.", cta "Enter the Tower", to "/battle", icon "battle", tone "urgent"
11. WHEN 2 of 3 starred tasks are completed today, THE Compass SHALL create Sacred Directives candidate with score 80, title "Two directives done. One remains.", reason "Perfection earns the triple crown.", cta "View Tasks", to "/", icon "star", tone "calm"
12. WHEN no candidates match, THE Compass SHALL create fallback candidate with score 10, title "Quiet day. Add a small directive.", reason "Small wins compound.", cta "Forge", action empty callback, icon "sparkle", tone "calm"
13. THE Compass component SHALL sort candidates by descending score and select highest
14. THE Compass component SHALL render selected suggestion as motion.div with initial opacity 0 / y -4, animate to opacity 1 / y 0, using trans.cascadeIn transition
15. THE Compass component SHALL render .ss-card container with tone-specific background and border-color (calm: gold rgba 0.06 / 0.22, urgent: red rgba 0.06 / 0.28, rare: violet rgba 0.06 / 0.28)
16. THE Compass component SHALL render shrink-0 icon div with Icon component at size 28, weight "duotone"
17. THE Compass component SHALL render flex-1 content div with .t-h3 title paragraph and .t-lore reason paragraph with 0.5 margin-top
18. THE Compass component SHALL render CTA button with .ss-btn .ss-btn-primary classes, onClick handler calling suggestion.action or navigating to suggestion.to
19. THE Compass component SHALL refresh when ["profile"], ["today-log"], ["goals-active"], ["my-monsters"], or ["tower"] query keys invalidate
20. THE Compass component SHALL accept onOpenMorning and onOpenEvening callback props
21. THE System SHALL mount Compass component at top of Hub route (routes/\_authenticated/index.tsx) as first element after RitualStatusPill removal
22. THE System SHALL remove RitualStatusPill component from Hub when Compass is mounted (Compass replaces its role)
23. THE Compass component SHALL include role="region" and aria-label="Next action" for accessibility
24. THE Compass CTA button SHALL be reachable by keyboard tab navigation
25. WHEN Compass suggestion changes to urgent tone, THE System SHALL announce via aria-live="polite" region
26. WHEN Compass mounts on Hub, THE component SHALL be visible within 200ms of page load
27. WHEN Compass updates suggestion, THE transition SHALL use cascadeIn motion token (duration.measured, ease.weighty)
28. WHEN user clicks CTA and navigates, THE Compass SHALL not cause navigation errors or flash of unstyled content
29. WHEN all acceptance criteria pass, THE Compass SHALL provide single-sentence direction for every returning user session
30. WHEN build completes after Compass implementation, THE System SHALL pass npm run build with no TypeScript errors

### Requirement 7: First-Time Experience Flow

**User Story:** As a new user, I want a guided onboarding flow with welcome carousel, tutorial directive, and free first pull, so that I understand the game loop and experience immediate delight without confusion.

#### Acceptance Criteria

1. THE System SHALL create database migration file supabase/migrations/YYYYMMDD_onboarding.sql
2. THE migration SHALL add onboarding_completed_at column to profiles table with type timestamptz and nullable constraint
3. THE migration SHALL add tutorial_directive_id column to profiles table with type uuid, nullable constraint, and REFERENCES tasks(id) ON DELETE SET NULL foreign key
4. THE System SHALL run supabase db push to apply migration to database
5. THE System SHALL create Onboarding component in src/components/game/Onboarding.tsx
6. THE Onboarding component SHALL define 3 step cards (step 0: "Your habits forge a fantasy world." with body "Every habit you complete strengthens monsters in your collection. Every streak shapes a story. This is not a checklist app." and icon "morning", step 1: "Three rhythms, one game." with body "Daily — tick tasks, earn rewards. Weekly — run expeditions, climb the Tower. Quarterly — slay a Boss, mint a Tome. The deeper rhythms reward consistency." and icon "battle", step 2: "Start with one directive." with body "We've added a tutorial directive to your list. Tap the [+] on it to feel how it ripples through the entire system." and icon "star")
7. THE Onboarding component SHALL render fixed inset-0 z-100 container with rgba(0,0,0,0.92) background and 4px backdrop-filter blur
8. THE Onboarding component SHALL render AnimatePresence with mode="wait" containing motion.div for current step
9. THE motion.div SHALL use initial opacity 0 / y 16, animate to opacity 1 / y 0, exit with opacity 0 / y -8, transition using dur.measured and ease.weighty
10. THE motion.div SHALL render .ss-modal class with max-w-md, text-center, mb-4 icon div, mb-3 .t-h1 title with gold-leaf color, mb-6 .t-body paragraph
11. THE Onboarding component SHALL render progress dots (flex gap-1 justify-center mb-6) with w-2 h-2 rounded-full transition-all, active step colored gold-leaf and scaled 1.2, inactive steps colored tertiary ink
12. THE Onboarding component SHALL render CTA buttons flex gap-3 with Back button (if step > 0) using .ss-btn .ss-btn-secondary, Continue/Begin button using .ss-btn .ss-btn-primary
13. WHEN Continue button is clicked AND step < 2, THE Onboarding component SHALL increment step state
14. WHEN Begin button is clicked on step 2, THE Onboarding component SHALL call onComplete callback prop
15. THE System SHALL create completeOnboarding function in src/lib/game/onboarding-client.ts
16. THE completeOnboarding function SHALL insert tutorial directive task with user_id, type="habit", title="Drink water (first habit)", notes="Tap the [+] to score this habit. Watch what happens.", category="wellness", difficulty="easy", positive_enabled=true, negative_enabled=false, tags=["con"]
17. THE completeOnboarding function SHALL update profile with onboarding_completed_at=current timestamp and tutorial_directive_id=inserted task id
18. THE completeOnboarding function SHALL return taskId
19. THE System SHALL mount Onboarding component in routes/\_authenticated/index.tsx conditionally WHEN profile.onboarding_completed_at is null
20. THE System SHALL pass onComplete={() => completeOnboardingMutation.mutate()} prop to Onboarding component
21. THE System SHALL modify TaskCard component to detect WHEN task.id matches profile.tutorial_directive_id
22. WHEN task is tutorial directive, THE TaskCard SHALL apply .ss-card class with box-shadow: 0 0 24px rgba(255,213,79,0.45) and animation: tutorial-pulse 2s ease-in-out infinite
23. THE System SHALL define @keyframes tutorial-pulse in styles.css with 0%/100% box-shadow 0 0 18px rgba(255,213,79,0.35) and 50% box-shadow 0 0 28px rgba(255,213,79,0.55)
24. WHEN user scores tutorial directive first time, THE System SHALL clear tutorial_directive_id from profile to stop pulse
25. WHEN tutorial directive is scored, THE System SHALL display follow-up modal with Icon "summon" size 48 weight "duotone", .t-h1 title "A summon awaits.", .t-body paragraph "The first pull is on the house. Visit the Altar to summon your starting monster.", .ss-btn .ss-btn-primary button "Open the Altar" with onClick navigating to "/altar"
26. THE System SHALL modify pullBanner function in gacha-client.ts to query pulls table count for user_id
27. WHEN pulls count = 0, THE pullBanner function SHALL set isFirstPull = true, totalCost = 0, and override rolledRarity = "rare" for first pull result
28. WHEN isFirstPull is true, THE pullBanner function SHALL skip cost deduction and guarantee at least one Rare rarity in 10-pull results
29. WHEN onboarding completes, THE System SHALL allow Compass component to take over suggestion logic
30. WHEN user reloads app, THE System SHALL not re-trigger Onboarding if profile.onboarding_completed_at is not null
31. WHEN new user signs up and lands on Hub, THE Onboarding carousel SHALL display within 1 second
32. WHEN user completes carousel, THE tutorial directive SHALL appear in task list with glowing pulse
33. WHEN user scores tutorial directive, THE CascadeCard SHALL fire with gold/xp/growth events
34. WHEN user clicks "Open the Altar" CTA, THE navigation SHALL route to /altar without errors
35. WHEN user performs first pull, THE pull cost SHALL be 0 and results SHALL include ≥ 1 Rare monster
36. WHEN onboarding flow completes, THE database SHALL have onboarding_completed_at timestamp and tutorial_directive_id uuid populated
37. WHEN build completes after onboarding implementation, THE System SHALL pass npm run build with no TypeScript errors

### Requirement 8: Navigation Hierarchy Restructure

**User Story:** As a user, I want navigation organized by usage frequency (daily/weekly/rare tiers), so that high-frequency destinations are prominent and rare features don't clutter the sidebar.

#### Acceptance Criteria

1. THE System SHALL define Tier 1 Daily navigation items (Hub, Quests, Altar, Expeditions) in GameSidebar component
2. THE System SHALL define Tier 2 Weekly navigation items (Battle, Compendium, Codex, Island) in GameSidebar component
3. THE System SHALL define Tier 3 Rare navigation items (Forge, Trial, Guild, Fusion, Shop, Profile) accessible via More button
4. THE System SHALL define .ss-nav-primary CSS class with 10px 14px padding, 22px icon size, 14px font size, 600 font weight, flex items-center, space-3 gap, rounded-md, transition on background/color/border
5. THE System SHALL define .ss-nav-secondary CSS class with 6px 12px padding, 18px icon size, 12px font size, 500 font weight, flex items-center, space-2 gap, rounded-md, transition on background/color/border
6. WHEN nav item is .ss-nav-primary AND active, THE System SHALL apply gold-leaf color, rgba(255,213,79,0.08) background, and 3px solid gold-leaf left border-left
7. WHEN nav item is .ss-nav-secondary AND active, THE System SHALL apply ink-primary color, rgba(255,255,255,0.03) background, and 2px solid ink-secondary left border-left
8. WHEN nav item is .ss-nav-primary AND inactive, THE System SHALL apply ink-secondary color with hover to ink-primary and hover background rgba(255,255,255,0.04)
9. WHEN nav item is .ss-nav-secondary AND inactive, THE System SHALL apply ink-tertiary color with hover to ink-secondary and hover background rgba(255,255,255,0.02)
10. THE System SHALL add More button at bottom of Tier 2 section using .ss-nav-secondary class with "More" label and chevron-down icon
11. WHEN More button is clicked, THE System SHALL open MoreSheet component
12. THE System SHALL create MoreSheet component in src/components/game/MoreSheet.tsx
13. THE MoreSheet component SHALL use ResponsiveDialog wrapper (Vaul drawer on mobile < 768px, popover on desktop ≥ 768px)
14. THE MoreSheet component SHALL render 5 rare destination links (Forge, Trial, Guild, Fusion, Shop) plus Profile link in vertical list
15. THE MoreSheet links SHALL use .ss-nav-secondary class styling with icon, label, and chevron-right indicator
16. THE mobile bottom-nav SHALL render at viewport < 768px with fixed bottom-0 z-40 backdrop-blur, border-top hairline
17. THE mobile bottom-nav SHALL display 5 items (Hub, Quests, Altar, Expeditions, More) with icon above label, center flex-col layout, min-h-44px touch target
18. WHEN mobile bottom-nav item is active, THE System SHALL apply gold-bright color and gold rgba background-color
19. WHEN mobile bottom-nav item is inactive, THE System SHALL apply ink-secondary color with tap to navigate
20. THE System SHALL maintain all 14 routes as accessible (Hub, Quests, Altar, Expeditions, Battle, Compendium, Codex, Island, Forge, Trial, Guild, Fusion, Shop, Profile) - no routes removed
21. THE System SHALL preserve deep-linking to all routes via TanStack Router navigation
22. THE System SHALL add aria-current="page" attribute to active nav links
23. THE GameSidebar SHALL render Tier 1 section with .ss-nav-primary items first, then Tier 2 section with .ss-nav-secondary items, then More button
24. THE GameSidebar SHALL maintain existing Profile link at bottom with avatar/level display
25. WHEN navigation restructure completes, THE desktop sidebar SHALL show 8 direct links + More button
26. WHEN navigation restructure completes, THE mobile bottom-nav SHALL show 4 direct links + More button
27. WHEN user clicks nav item, THE System SHALL navigate without flash of unstyled content or layout shift
28. WHEN user opens MoreSheet and clicks rare destination, THE MoreSheet SHALL close and navigate to chosen route
29. WHEN build completes after nav restructure, THE System SHALL pass npm run build with no TypeScript errors
30. WHEN all acceptance criteria pass, THE navigation SHALL feel less cluttered and high-frequency destinations SHALL be one tap away

### Requirement 9: Empty State Voice Rewrite

**User Story:** As a user, I want empty states to feel evocative, diegetic, and literary, so that every "no X yet" moment has soul and guides me toward action.

#### Acceptance Criteria

1. THE System SHALL create EmptyState component in src/components/ui/EmptyState.tsx
2. THE EmptyState component SHALL accept icon (IconName), title (string), body (string), cta (optional string), onCtaClick (optional callback) props
3. THE EmptyState component SHALL render .ss-card with dashed border-style, center text-center, py-12 padding
4. THE EmptyState component SHALL render Icon component at size 40, opacity 60%, mb-4 margin-bottom
5. THE EmptyState component SHALL render title with .t-h3 class and mb-2 margin-bottom
6. THE EmptyState component SHALL render body with .t-body-sm class and mb-4 margin-bottom IF cta exists
7. THE EmptyState component SHALL render CTA button with .ss-btn .ss-btn-secondary classes IF cta prop is provided
8. WHEN Hub has no tasks, THE System SHALL render EmptyState with icon="sparkle", title="The grove is quiet.", body="Forge one small directive. Even five minutes of intent shapes the world.", cta="Forge Directive", onCtaClick opening directive modal
9. WHEN Quests has no active quarterly/weekly goals, THE System SHALL render EmptyState with icon="crown", title="No boss has been named.", body="Choose one. Three months from now, what will you have slain?", cta="Forge Goal", onCtaClick opening goal creation modal
10. WHEN Quests slain list is empty, THE System SHALL render EmptyState with icon="memorial", title="The wall is bare.", body="When you slay your first quarterly boss, the head hangs here. A trophy earned in discipline."
11. WHEN Codex journal list is empty, THE System SHALL render EmptyState with icon="evening", title="The page hasn't seen ink.", body="Complete your Evening Reflection. The journal remembers what you tell it."
12. WHEN Codex awakening log is empty, THE System SHALL render EmptyState with icon="star", title="Nothing has awakened in your company.", body="Promote a monster to 2-star. The first awakening is the hardest."
13. WHEN Trial memorial is empty, THE System SHALL render EmptyState with icon="memorial", title="No name has been carved.", body="May the wall stay bare. But if you enter the Trial, know that failure is permanent."
14. WHEN Battle history is empty, THE System SHALL render EmptyState with icon="battle", title="No battles fought.", body="The Tower waits. Climb floor by floor. Each victory earns essence and glory."
15. WHEN Compendium filters return no results, THE System SHALL render EmptyState with icon="summon", title="The bestiary is silent on this query.", body="Adjust your filters, or visit the Altar to summon more allies."
16. WHEN Forge recipe list is locked, THE System SHALL render EmptyState with icon="tower", title="The anvil is cold.", body="Reach level 8 to unlock crafting. Forge essence into power."
17. WHEN Bazaar category has no items, THE System SHALL render EmptyState with icon="sparkle", title="The merchant has nothing of that kind today.", body="Check another tab. The market shifts with your level."
18. WHEN Profile equipment slots are empty, THE System SHALL render EmptyState with icon="battle", title="You stand unarmored.", body="Visit the Bazaar or Forge to acquire equipment. Stats compound."
19. WHEN Profile inventory is empty, THE System SHALL render EmptyState with icon="food", title="Your satchel is empty.", body="Complete tasks to earn drops. Essence, stones, potions — all fall from habit."
20. WHEN Profile pets list is empty, THE System SHALL render EmptyState with icon="egg", title="No companion has chosen you.", body="Rare egg drops hatch into pets. They grow as you do."
21. WHEN Guild list is empty, THE System SHALL render EmptyState with icon="crown", title="You walk alone.", body="Browse guilds or forge your own. Shared milestones amplify the journey."
22. WHEN Fusion Matrix is unavailable, THE System SHALL render EmptyState with icon="summon", title="The Matrix is dormant.", body="Unlock at level 12. Fuse duplicate monsters into greater forms."
23. WHERE Proposal D is active, THE System SHALL use modern dramatic cinematic voice (confident, action-verb driven, occasional archaic flavor, evocative without flowery, one-two sentences maximum)
24. THE System SHALL replace "No tasks yet" string in Hub with EmptyState component
25. THE System SHALL replace "No active goals" string in Quests with EmptyState component
26. THE System SHALL replace "No entries yet" string in Codex with EmptyState component
27. THE System SHALL replace "The memorial is empty" string in Trial with EmptyState component
28. THE System SHALL replace "No history" string in Battle with EmptyState component
29. THE System SHALL replace "No monsters found" string in Compendium with EmptyState component
30. THE System SHALL replace "No recipes available" string in Forge with EmptyState component
31. THE System SHALL replace "No items" string in Bazaar with EmptyState component
32. THE System SHALL replace "No equipment" string in Profile with EmptyState component
33. THE System SHALL replace "No inventory" string in Profile with EmptyState component
34. THE System SHALL replace "No pets" string in Profile with EmptyState component
35. THE System SHALL replace "No guilds" string in Guild with EmptyState component
36. THE System SHALL replace "Unavailable" string in Fusion with EmptyState component
37. WHEN migration completes, THE System SHALL have zero bare "No X yet" or "Nothing here" strings in route tsx files
38. WHEN EmptyState components render, THE dashed border AND centered icon SHALL visually distinguish empty state from error or loading state
39. WHEN user sees EmptyState, THE body text SHALL guide them toward the action that populates that space
40. WHEN build completes after empty state migration, THE System SHALL pass npm run build with no TypeScript errors

### Requirement 10: Monster Art Regeneration

**User Story:** As a developer, I want consistent anime portrait monster art with Proposal D style, so that the collection feels like a professional modern gacha game with cohesive visual identity.

#### Acceptance Criteria

1. THE System SHALL create locked monster art prompt in prompts/MONSTER_ART_PROMPT.md
2. THE monster art prompt SHALL specify output format as PNG with transparent background at 1024x1024 resolution
3. THE monster art prompt SHALL specify art style as anime gacha portrait (Genshin Impact, Honkai Star Rail, Arknights visual reference)
4. THE monster art prompt SHALL specify sharp linework with soft cel-shading rendering
5. THE monster art prompt SHALL specify hard rim light from upper-back direction creating dramatic edge highlights
6. THE monster art prompt SHALL specify bold accent color glow matching monster element type (fire: ember orange, water: cyan, earth: moss green, air: lavender, dark: violet, light: gold)
7. THE monster art prompt SHALL specify particle/wisp effects with 5-15 motes maximum, subtle not overwhelming
8. THE monster art prompt SHALL specify confident dramatic stance (weapon raised, hand outstretched casting spell, combat-ready pose, three-quarter view facing slightly off-camera)
9. THE monster art prompt SHALL specify three-quarter body or full-body framing, head to knees minimum, centered composition
10. THE monster art prompt SHALL forbid text on armor/banners/scrolls/weapons/background (no AI-generated text baked into sprite)
11. THE monster art prompt SHALL forbid scene elements, environment props, checker pattern, dialogue bubbles, UI borders, watermarks, signatures
12. THE monster art prompt SHALL include rarity-tier styling hints (common: simple design, rare: ornate details, epic: glowing effects, legendary: particle aura, mythic: double aura with color shift, ex: prismatic multi-glow)
13. THE System SHALL create triage script at scripts/triage_monsters.mjs
14. THE triage script SHALL read all files in public/sprites/monsters/ directory
15. THE triage script SHALL check format (PNG only, reject jpg/webp/svg), alpha channel presence, square aspect ratio (1:1), file size (30-150kb optimal, flag < 20kb or > 300kb)
16. THE triage script SHALL output CSV with columns: filename, format, size_kb, has_alpha, square, verdict (keep/regen), reason
17. THE triage script SHALL write output to scripts/triage_results.csv
18. THE System SHALL create batch generation script at scripts/regen_monsters.mjs
19. THE batch generation script SHALL query monsters table WHERE bestiary_id <= CURRENT_RELEASED_MAX (e.g. 202 for current bestiary)
20. THE batch generation script SHALL select name, rarity, role, element, origin, filename_stub columns
21. THE batch generation script SHALL populate prompt template: "Anime gacha portrait of {name}, {rarity} rarity {role} type, {element} element affinity. {origin} aesthetic. [insert full locked prompt]. PNG transparent background 1024x1024."
22. THE batch generation script SHALL call Google Gemini 2.0 Flash Exp model via API with prompt
23. THE batch generation script SHALL set safety_settings to block_none for creative flexibility
24. THE batch generation script SHALL set generation_config with temperature 0.9, top_p 0.95, top_k 40
25. THE batch generation script SHALL download generated image bytes and save as PNG to public/sprites/monsters/{filename_stub}.png
26. THE batch generation script SHALL rate-limit at 1500ms delay between API requests to respect quota
27. THE batch generation script SHALL log progress (generated N/M) and errors (failed {name}: {error}) to console and scripts/regen_log.txt
28. THE batch generation script SHALL skip monsters WHERE filename already exists in public/sprites/monsters/ directory AND verdict="keep" from triage
29. WHEN batch generation completes, THE System SHALL have PNG-only sprites with transparent backgrounds for all active bestiary entries
30. WHEN batch generation completes, THE public/sprites/monsters/ directory SHALL contain 202+ files (one per released monster)
31. WHEN batch generation completes, THE generated sprites SHALL have consistent anime portrait style across entire collection
32. WHEN batch generation completes, THE generated sprites SHALL have no AI-generated text visible on sprites
33. WHEN batch generation completes, THE file sizes SHALL average 80-120kb per PNG (acceptable for lazy-load)
34. WHEN triage script runs, THE output CSV SHALL identify < 10% of sprites for regeneration (most existing sprites acceptable)
35. WHEN batch generation runs, THE script SHALL handle API errors gracefully (log and continue to next monster)
36. WHEN batch generation runs, THE script SHALL respect Gemini API rate limits without 429 errors
37. WHEN new sprites load in Compendium, THE visual consistency SHALL feel cohesive (same artist, same world)
38. WHEN new sprites load in Altar reveal, THE portrait quality SHALL feel premium (publishable gacha game standard)
39. WHEN user views Compendium grid, THE monster portraits SHALL load with lazy-loading (images below fold defer until scroll)
40. WHEN build completes after monster art implementation, THE System SHALL pass npm run build with assets loading correctly

### Requirement 11: Mobile Responsiveness Optimization

**User Story:** As a mobile user, I want bottom-drawer modals, proper touch targets (≥44px), and mobile-optimized layouts, so that the app feels native on my phone and doesn't require pinch-zoom or awkward tapping.

#### Acceptance Criteria

1. THE System SHALL install vaul package via npm (Emil Kowalski's bottom-sheet drawer primitive)
2. THE System SHALL create ResponsiveDialog component in src/components/ui/ResponsiveDialog.tsx
3. THE ResponsiveDialog component SHALL use useIsMobile hook detecting viewport width < 768px
4. WHEN viewport width < 768px, THE ResponsiveDialog SHALL render Vaul Drawer.Root with open, onOpenChange, shouldScaleBackground props
5. WHEN viewport width < 768px, THE ResponsiveDialog SHALL render Drawer.Portal containing Drawer.Overlay (fixed inset-0 bg-black/80 backdrop-blur-sm) and Drawer.Content
6. WHEN viewport width < 768px, THE Drawer.Content SHALL use .ss-modal class with fixed bottom-0 left-0 right-0, rounded-b-none, mt-24, max-h-92vh, overflow-y-auto
7. WHEN viewport width < 768px, THE Drawer.Content SHALL display drag handle (mx-auto w-12 h-1.5 rounded-full bg-white/20 mb-4)
8. WHEN viewport width < 768px, THE Drawer SHALL allow dismiss by dragging down OR tapping backdrop
9. WHEN viewport width ≥ 768px, THE ResponsiveDialog SHALL render AnimatePresence with fixed inset-0 z-50 modal container
10. WHEN viewport width ≥ 768px, THE ResponsiveDialog SHALL render motion.div backdrop (initial/animate/exit opacity transitions) with rgba(0,0,0,0.78) background and 3px backdrop-filter blur
11. WHEN viewport width ≥ 768px, THE ResponsiveDialog SHALL render motion.div content (initial opacity 0 / y 18 / scale 0.98, animate to opacity 1 / y 0 / scale 1) with .ss-modal class
12. THE ResponsiveDialog component SHALL accept open (boolean), onOpenChange (callback), children (ReactNode), title (optional string) props
13. THE ResponsiveDialog component SHALL render title with .t-h2 class and mb-4 margin IF title prop provided
14. THE System SHALL migrate PromotionChamber component to wrap content in ResponsiveDialog
15. THE System SHALL migrate DailyRitual Morning modal to wrap content in ResponsiveDialog
16. THE System SHALL migrate DailyRitual Evening modal to wrap content in ResponsiveDialog
17. THE System SHALL migrate Trial confirmation modal to wrap content in ResponsiveDialog
18. THE System SHALL migrate Trial results modal to wrap content in ResponsiveDialog
19. THE System SHALL migrate Compendium detail modal to wrap content in ResponsiveDialog
20. THE System SHALL migrate Onboarding carousel to wrap content in ResponsiveDialog
21. THE System SHALL migrate MoreSheet component to use ResponsiveDialog wrapper
22. WHEN TaskCard renders +/− score buttons, THE System SHALL apply min-h-11 (44px) and min-w-11 (44px) touch target classes
23. WHEN GameSidebar mobile bottom-nav renders, THE System SHALL apply min-h-11 (44px) to nav items with flex-col center layout
24. WHEN Compendium detail modal renders close button, THE System SHALL apply w-11 h-11 (44px × 44px) touch target with absolute positioning
25. WHEN Quests renders delete/abandon button, THE System SHALL apply min-h-8 (32px) and px-3 touch target (acceptable for destructive secondary action)
26. WHEN Codex heatmap renders cells, THE System SHALL wrap w-3 h-3 (12px) cells in 44px tap region on mobile via parent div with padding
27. THE System SHALL create MobilePlayerHeader component in src/components/game/MobilePlayerHeader.tsx
28. THE MobilePlayerHeader component SHALL render header.md:hidden.sticky.top-0.z-40.flex.items-center.justify-between.px-4.py-3.border-b.backdrop-blur-md
29. THE MobilePlayerHeader component SHALL display left section with flex items-center gap-2 containing .t-mono Lvl {level} with gold-leaf color, text-xs HP {hp}/{max_hp} with secondary ink color
30. THE MobilePlayerHeader component SHALL display right section with flex items-center gap-3 .t-mono text-sm containing gold/crystal counts with Icon components
31. WHEN viewport width < 768px, THE AppShell SHALL mount MobilePlayerHeader component
32. WHEN viewport width < 768px, THE AppShell SHALL hide desktop PlayerHeader component (apply hidden md:flex class)
33. WHEN viewport width ≥ 768px, THE AppShell SHALL hide MobilePlayerHeader component (apply md:hidden class)
34. WHEN viewport width ≥ 768px, THE AppShell SHALL show desktop PlayerHeader component
35. THE System SHALL add loading="lazy" and decoding="async" attributes to monster portrait <img> tags in Compendium grid
36. THE System SHALL add loading="lazy" attribute to atmosphere background <img> tags OR CSS background-image for non-Hub routes
37. THE System SHALL add pb-20 (80px bottom padding) to scroll containers on routes with mobile bottom-nav to prevent content overlap
38. WHEN mobile optimizations complete, THE System SHALL produce no horizontal scrollbar on 380px viewport width
39. WHEN mobile optimizations complete, THE Codex heatmap SHALL render fully within 380px viewport width without horizontal scroll
40. WHEN mobile optimizations complete, THE Compendium grid SHALL display 2 columns on mobile with 16px gap and readable portrait size (~140-150px)
41. WHEN mobile optimizations complete, THE all modals SHALL open as bottom drawers on mobile with drag handle visible
42. WHEN mobile optimizations complete, THE all primary CTA buttons SHALL have ≥44px touch targets
43. WHEN mobile optimizations complete, THE mobile bottom-nav SHALL remain fixed at bottom with backdrop-blur and not overlap content
44. WHEN mobile optimizations complete, THE MobilePlayerHeader SHALL remain sticky at top and show essential stats (level, HP, gold, crystals)
45. WHEN user taps TaskCard +/− button on mobile, THE touch target SHALL feel comfortable (no missed taps)
46. WHEN user drags down modal on mobile, THE Vaul drawer SHALL follow finger and dismiss smoothly
47. WHEN user views Compendium grid on mobile, THE portrait images below fold SHALL defer loading until scroll (lazy-load working)
48. WHEN user views any route on mobile, THE text SHALL remain readable without pinch-zoom (minimum 13px body text, 4.5:1 contrast)
49. WHEN build completes after mobile optimizations, THE System SHALL pass npm run build with no TypeScript errors
50. WHEN deployed to mobile device, THE app SHALL feel native with no awkward desktop patterns leaking through

### Requirement 12: Build and Integration Preservation

**User Story:** As a developer, I want the redesign to build successfully and preserve all existing mechanical systems, so that no features break during visual transformation and deployment remains stable.

#### Acceptance Criteria

1. WHEN any file migration completes, THE System SHALL pass npm run build without TypeScript errors or missing module errors
2. THE System SHALL preserve all existing motion-tokens duration constants (dur.snap, dur.normal, dur.measured, dur.ceremony) unchanged
3. THE System SHALL preserve all existing motion-tokens easing curves (ease.out, ease.weighty, ease.fluid) unchanged
4. THE System SHALL preserve all existing sound synthesis from lib/ui/sounds.ts (Web Audio synth, no asset files) unchanged
5. THE System SHALL preserve all 12 mechanical systems without backend logic changes (Pick Me Up core: Daily Ritual, Sacred Directives, Whisper, Cascade, Reflection; 5 Pillars: Quests/Goals, Altar/Gacha, Battle/Tower, Expeditions, Compendium/Bonding)
6. THE System SHALL preserve authentication flow (Supabase Auth, email/password, session management) unchanged
7. THE System SHALL preserve database schema unchanged EXCEPT FOR onboarding columns (profiles.onboarding_completed_at, profiles.tutorial_directive_id)
8. THE System SHALL preserve Supabase query patterns in lib/game/supabase-api.ts unchanged EXCEPT FOR completeOnboarding mutation
9. THE System SHALL preserve React Query cache keys (["profile"], ["today-log"], ["my-monsters"], ["goals-active"], ["tower"], etc.) unchanged
10. THE System SHALL preserve TanStack Router navigation patterns and route definitions unchanged
11. THE System SHALL preserve existing component prop interfaces unchanged (CascadeCard, WhisperFeed, PromotionChamber, DailyRitual, TaskCard, PlayerHeader)
12. THE System SHALL preserve existing test suites passing (if test files exist in src/**tests**/)
13. WHEN all 11 implementation files ship, THE System SHALL have visual identity reading consistently across all screens
14. WHEN all 11 implementation files ship, THE System SHALL have zero emoji Unicode literals remaining in UI (< 5 in display-only contexts acceptable)
15. WHEN all 11 implementation files ship, THE System SHALL have atmosphere backgrounds applied to 6 primary routes (Hub, Altar, Expedition, Battle, Codex, Trial)
16. WHEN all 11 implementation files ship, THE System SHALL have Compass component providing smart suggestions on Hub route
17. WHEN all 11 implementation files ship, THE System SHALL have onboarding flow completing for new users (carousel → tutorial directive → free pull → Compass)
18. WHEN all 11 implementation files ship, THE System SHALL have 3-tier navigation implemented (Daily/Weekly/Rare with More drawer)
19. WHEN all 11 implementation files ship, THE System SHALL have all empty states rewritten in Proposal D cinematic voice
20. WHEN all 11 implementation files ship, THE System SHALL have consistent anime portrait monster art across active bestiary
21. WHEN all 11 implementation files ship, THE System SHALL have mobile-optimized dialogs (drawers) and touch targets (≥44px)
22. WHEN deployed to production, THE System SHALL load Hub atmosphere image within 2 seconds on 3G connection
23. WHEN deployed to production, THE System SHALL maintain First Contentful Paint < 1.8 seconds
24. WHEN deployed to production, THE System SHALL maintain Largest Contentful Paint < 2.5 seconds
25. WHEN deployed to production, THE System SHALL maintain Cumulative Layout Shift < 0.1
26. WHEN deployed to production, THE System SHALL have total bundle size increase < 500KB compared to pre-redesign baseline
27. WHEN user completes a habit on production, THE Cascade SHALL fire with gold/xp/bond events identically to pre-redesign behavior
28. WHEN user performs a summon on production, THE gacha roll probabilities SHALL remain identical to pre-redesign probabilities
29. WHEN user climbs Tower on production, THE battle calculations SHALL remain identical to pre-redesign calculations
30. WHEN user reflects in evening on production, THE reflection_pull_granted logic SHALL remain identical to pre-redesign logic

### Requirement 13: Accessibility and Performance Standards

**User Story:** As a user with accessibility needs or slow connection, I want the redesigned interface to maintain readability, keyboard navigation, and fast loading, so that I can use SummonScroll effectively regardless of device or ability.

#### Acceptance Criteria

1. THE System SHALL maintain text contrast ratio ≥ 4.5:1 for body text (13-15px) against all backgrounds (deep/stage/panel/pane with atmosphere overlay)
2. THE System SHALL maintain text contrast ratio ≥ 3:1 for large text (≥18px) against all backgrounds
3. THE System SHALL maintain text contrast ratio ≥ 3:1 for UI controls (buttons, inputs, chips) against their backgrounds
4. THE Compass component SHALL include role="region" attribute for landmark navigation
5. THE Compass component SHALL include aria-label="Next action" attribute for screen reader context
6. THE Compass CTA button SHALL be reachable by keyboard tab navigation in natural DOM order
7. WHEN Compass suggestion changes to urgent tone, THE System SHALL announce update via aria-live="polite" region
8. WHEN Compass suggestion changes to rare tone, THE System SHALL announce update via aria-live="polite" region
9. THE Icon components SHALL include aria-hidden="true" attribute (decorative, semantic meaning conveyed by adjacent text)
10. THE ResponsiveDialog Vaul Drawer SHALL trap focus within drawer when open (tab cycles within drawer, escape closes)
11. THE ResponsiveDialog desktop modal SHALL trap focus within modal when open
12. THE ResponsiveDialog backdrop SHALL close dialog when clicked with mouse OR activated with keyboard Enter/Space key
13. THE EmptyState component SHALL maintain semantic heading hierarchy (h1 for page title, h2 for section, h3 for empty state title)
14. THE GameSidebar navigation links SHALL indicate active state with aria-current="page" attribute
15. THE mobile bottom-nav links SHALL indicate active state with aria-current="page" attribute
16. THE TaskCard +/− buttons SHALL include aria-label="Score positive" and aria-label="Score negative" for screen reader context
17. THE Onboarding carousel progress dots SHALL include aria-hidden="true" (decorative, redundant with step content)
18. THE Onboarding Continue button SHALL include aria-label="Continue to step {N+1}" for screen reader context
19. THE MoreSheet links SHALL be keyboard navigable in natural DOM order (tab to More button, Enter opens sheet, tab through links, Escape closes)
20. WHEN all atmosphere images load, THE System SHALL maintain First Contentful Paint < 1.8 seconds on 4G connection
21. WHEN Hub atmosphere loads, THE image SHALL be preloaded via <link rel="preload" as="image" href="/atmos/hub.png"> in index.html
22. WHEN non-Hub atmospheres load, THE images SHALL use loading="lazy" OR CSS background-image with lazy JavaScript intersection observer
23. WHEN Compendium grid renders 202 monsters, THE portrait images SHALL use loading="lazy" and decoding="async" attributes
24. WHEN Compendium grid renders, THE images below viewport fold SHALL defer loading until user scrolls (lazy-load working)
25. WHEN atmosphere PNGs compress, THE combined size of 6-7 images SHALL be < 3MB total
26. WHEN Typography Google Fonts load, THE System SHALL use font-display: swap in CSS @font-face rules to prevent FOIT (flash of invisible text)
27. WHEN Surface System CSS loads, THE total styles.css file size SHALL be < 150KB uncompressed
28. WHEN Icon system loads, THE lucide-react package SHALL tree-shake to include only imported icons (not entire library)
29. WHEN build bundle analyzes, THE Vaul package SHALL add < 20KB gzip to bundle size
30. WHEN build bundle analyzes, THE Lucide Icons SHALL add < 30KB gzip to bundle size (tree-shaken)
31. WHEN build bundle analyzes, THE Google Fonts SHALL load asynchronously and not block render
32. WHEN user navigates between routes, THE atmosphere background transition SHALL not cause layout shift (fixed dimensions)
33. WHEN user opens ResponsiveDialog on mobile, THE drawer slide-up animation SHALL run at 60fps (no jank)
34. WHEN user scrolls Compendium grid on mobile, THE lazy-loaded images SHALL load smoothly (no scroll jank)
35. WHEN user taps button with .ss-btn class, THE visual feedback SHALL occur within 100ms (hover/active states)
36. WHEN user scores task and Cascade fires, THE animation SHALL run at 60fps without dropped frames
37. WHEN user performs summon at Altar, THE reveal animation SHALL run at 60fps without dropped frames
38. WHEN deployed to production, THE System SHALL achieve Lighthouse Performance score ≥ 85
39. WHEN deployed to production, THE System SHALL achieve Lighthouse Accessibility score ≥ 90
40. WHEN deployed to production, THE System SHALL achieve Lighthouse Best Practices score ≥ 90

### Requirement 14: Implementation Sequencing and Rollout

**User Story:** As a developer, I want a clear implementation sequence with dependency management, so that I can ship the redesign incrementally without breaking changes and roll back safely if needed.

#### Acceptance Criteria

1. THE System SHALL implement File 01 (Visual Identity Decision) first by recording Proposal D choice in file header
2. THE System SHALL implement File 02 (Surface System) after File 01, creating CSS tokens and migrating 19 component files
3. THE System SHALL implement File 03 (Icon System) after File 02, creating Icon component and migrating 12 component files
4. THE System SHALL implement File 04 (Typography System) after File 01, importing Google Fonts and creating typography classes
5. THE System SHALL implement File 05 (Atmosphere) after File 02 and File 04, generating 6-7 background images and applying per-route classes
6. THE System SHALL implement File 06 (Compass) independently (no dependency on Files 02-05), creating Compass component and mounting on Hub
7. THE System SHALL implement File 07 (First-Time Experience) after File 06, creating Onboarding component and completeOnboarding mutation
8. THE System SHALL implement File 08 (Navigation Hierarchy) independently (no dependency), restructuring GameSidebar and creating MoreSheet
9. THE System SHALL implement File 09 (Empty States) after File 03 and File 04, creating EmptyState component and migrating 13 empty state strings
10. THE System SHALL implement File 10 (Monster Art) independently in parallel track (can run during evenings while other files implement during day)
11. THE System SHALL implement File 11 (Mobile-First) after File 02 and File 08, creating ResponsiveDialog and MobilePlayerHeader, migrating 6 modals
12. WHEN each file implementation completes, THE System SHALL run npm run build and verify no TypeScript errors
13. WHEN each file implementation completes, THE System SHALL commit with conventional pattern: "ui: <file number> <short description>\n\nPer prompts/redesign/<file>.md.\n\n- change 1\n- change 2\n- change 3\n\nBuild: pass. Acceptance checks: pass."
14. WHEN each file commits, THE System SHALL push to main branch immediately (trunk-based development) OR batch up to 3 commits then push
15. WHEN File 02 ships, THE visual consistency SHALL improve dramatically (all surfaces use same chrome)
16. WHEN Files 02-05 ship, THE visual identity SHALL read clearly (chrome + icons + typography + atmosphere = coherent world)
17. WHEN Files 06-07 ship, THE new user experience SHALL guide onboarding and reduce day-1 churn
18. WHEN Files 08-09 ship, THE navigation SHALL feel decluttered and empty states SHALL have soul
19. WHEN File 10 ships, THE monster collection SHALL feel like a premium gacha game bestiary
20. WHEN File 11 ships, THE mobile experience SHALL feel native and thumb-friendly
21. WHEN all 11 files ship, THE System SHALL have zero "generic dark theme" feel remaining
22. WHEN all 11 files ship, THE System SHALL have Proposal D identity recognizable from any screen thumbnail
23. WHEN all 11 files ship, THE System SHALL have zero decision-paralysis moments (Compass guides user)
24. WHEN all 11 files ship, THE System SHALL have zero emoji icons in UI (all replaced with Lucide)
25. WHEN all 11 files ship, THE System SHALL have consistent anime portrait monster art across 202+ bestiary entries
26. WHEN rollback is needed for any file, THE System SHALL run git revert <commit-sha> and push (each file is one atomic commit)
27. WHEN rollback is needed for File 07 (onboarding), THE System SHALL write compensating database migration to remove onboarding columns (cannot simple revert due to schema change)
28. WHEN all 11 files deploy to production, THE System SHALL have zero breaking changes to existing user workflows
29. WHEN all 11 files deploy to production, THE System SHALL have zero data loss or corruption
30. WHEN all 11 files deploy to production, THE System SHALL have visual identity feeling like "the game from Pick Me Up, Infinite Gacha"
