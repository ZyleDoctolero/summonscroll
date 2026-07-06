# Favicon Setup Instructions

## Status: Tasks 26-28 Require Manual PNG Generation

The SVG favicon has been created (`public/favicon.svg`), but PNG variants need to be generated.

## Quick Setup (Recommended)

### Option 1: Using Sharp (Automated)

```bash
# Install sharp
npm install --save-dev sharp

# Run generation script
node generate-favicons.js
```

This will create:
- ✓ `public/favicon-16.png` (16×16)
- ✓ `public/apple-touch-icon.png` (180×180)

### Option 2: Using ImageMagick

```bash
cd public

# Generate 16x16 favicon
convert -background none -resize 16x16 favicon.svg favicon-16.png

# Generate 180x180 Apple touch icon  
convert -background none -resize 180x180 favicon.svg apple-touch-icon.png
```

### Option 3: Online Tool

Visit [RealFaviconGenerator](https://realfavicongenerator.net/):
1. Upload `public/favicon.svg`
2. Download generated package
3. Extract `favicon-16.png` and `apple-touch-icon.png` to `public/`

## OG Image (Task 28)

The OG image (`og-image.png`, 1200×630) requires custom design:

### Design Requirements:
- **Size:** 1200×630 pixels
- **Format:** PNG
- **Content:**
  - SummonScroll logo (from `src/assets/logos/summonscroll.svg`)
  - Tagline or game description
  - Background: `#1A1E2A` (dark theme)
  - Accent: `#C89A3E` (gold)

### Tools:
- **Figma:** Use OG image template
- **Canva:** Search "Open Graph" template
- **Photoshop:** Create 1200×630 canvas

### Quick Template:
```
┌─────────────────────────────────────┐
│                                     │
│         [SummonScroll Logo]         │
│                                     │
│    Summon Monsters, Build Teams,   │
│         Conquer Challenges          │
│                                     │
└─────────────────────────────────────┘
```

## After Generation

Once all PNG files are created, verify they exist:

```bash
ls -la public/favicon-16.png
ls -la public/apple-touch-icon.png  
ls -la public/og-image.png
```

Then update `index.html` with proper meta tags (see next section).

## HTML Meta Tags

Add to `<head>` in `index.html`:

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

<!-- Open Graph -->
<meta property="og:image" content="/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:title" content="SummonScroll" />
<meta property="og:description" content="Summon monsters, build teams, and conquer challenges" />
```

## Verification

After setup, test favicons:
1. Open app in browser
2. Check browser tab icon
3. Add to iOS home screen (test Apple touch icon)
4. Share link on social media (test OG image)

## Files Created

- ✓ `public/favicon.svg` - Main SVG favicon (32×32)
- ⏳ `public/favicon-16.png` - PNG fallback (16×16) - **NEEDS GENERATION**
- ⏳ `public/apple-touch-icon.png` - iOS icon (180×180) - **NEEDS GENERATION**
- ⏳ `public/og-image.png` - Social preview (1200×630) - **NEEDS DESIGN**

## Next Steps

1. Choose generation method (Sharp, ImageMagick, or online tool)
2. Generate PNG files
3. Design OG image
4. Update `index.html` with meta tags
5. Test in browser and on mobile devices
