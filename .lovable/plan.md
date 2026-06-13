# SummonScroll — Fantasy Game UI

A 9-screen, dark-fantasy game companion UI ported from the provided HTML mockups into the TanStack Start app. All screens share the same theme (gold/epic accents on dark, ornate fantasy typography).

## Routes

| Route         | Screen                       | Source |
| ------------- | ---------------------------- | ------ |
| `/` → Hub     | Hub Directives (landing)     | 7.html |
| `/profile`    | CrimsonBlade player profile  | 4.html |
| `/bazaar`     | The Grand Bazaar (shop)      | 1.html |
| `/fusion`     | Fusion Matrix                | 2.html |
| `/guild`      | The Vanguard guild dashboard | 3.html |
| `/battle`     | Battle Selection             | 5.html |
| `/island`     | Ancient Vaults island map    | 6.html |
| `/altar`      | Altar (summoning)            | 8.html |
| `/compendium` | The Compendium               | 9.html |

A persistent top/bottom nav links all 9 screens.

## Implementation

- Pull the full HTML body from each `/tmp/htmls/*.html` file, convert to JSX (className, self-closing tags, inline `style` objects), and drop into the corresponding route file.
- Move the page-level `<style>` blocks (custom fonts, gradients, glow effects, `.text-glow`, `gradient-text-gold`, `font-display-lg`, rarity colors, etc.) into `src/styles.css` as global utilities so all screens share them. Keep Tailwind utility classes from the HTML intact.
- Add Google Fonts link (the mockups use ornate display + body fonts) via the root `head()`.
- Hotlink all images directly from their existing CDN URLs in the HTML — no asset downloads.
- Set `<html class="dark">` is already handled via theming; we'll set the dark theme as default on the root.
- Lucide icons / Material symbols: the HTML uses Material Symbols via CDN — include the stylesheet link in `__root.tsx` head so icon ligatures render.
- Each route gets its own `head()` with the title from the source HTML.
- Add a shared `<GameNav />` component (rendered in `__root.tsx` or each page) with links to all 9 routes.

## Technical notes

- No backend / Lovable Cloud needed — this is a static UI port.
- No interactive game logic — buttons are visual only (matching mockups).
- Replace the placeholder `src/routes/index.tsx` with the Hub screen.
- Keep existing router/root shell intact; only add routes + global CSS additions.
