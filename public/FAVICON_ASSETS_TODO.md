# Favicon Assets - Manual Generation Required

The following PNG assets need to be generated from the SVG favicon (`favicon.svg`):

## Task 26: PNG Favicon Fallback
**File:** `favicon-16.png`
**Size:** 16×16 pixels
**Format:** PNG with transparency
**Source:** Convert `favicon.svg` to 16×16 PNG
**Tool:** Use any SVG-to-PNG converter (e.g., Inkscape, ImageMagick, online converter)
**Command (ImageMagick):**
```bash
convert -background none -resize 16x16 favicon.svg favicon-16.png
```

## Task 27: Apple Touch Icon
**File:** `apple-touch-icon.png`
**Size:** 180×180 pixels
**Format:** PNG with transparency
**Source:** Convert `favicon.svg` to 180×180 PNG
**Tool:** Use any SVG-to-PNG converter
**Command (ImageMagick):**
```bash
convert -background none -resize 180x180 favicon.svg apple-touch-icon.png
```

## Task 28: OG Image
**File:** `og-image.png`
**Size:** 1200×630 pixels
**Format:** PNG
**Source:** Create social media preview image with SummonScroll branding
**Content:** Should include:
- SummonScroll logo (from `src/assets/logos/summonscroll.svg`)
- Tagline or description
- Brand colors (#1A1E2A background, #C89A3E gold accents)
**Tool:** Design in Figma/Photoshop or use a template generator

## Quick Generation Script

If you have ImageMagick installed, run:

```bash
cd SummonScroll/public

# Generate 16x16 favicon
convert -background none -resize 16x16 favicon.svg favicon-16.png

# Generate 180x180 Apple touch icon
convert -background none -resize 180x180 favicon.svg apple-touch-icon.png

# For OG image, you'll need to create a custom design
# Recommended: Use Figma or Canva with 1200x630 template
```

## Alternative: Online Tools

- **Favicon Generator:** https://realfavicongenerator.net/
- **OG Image Generator:** https://www.opengraph.xyz/
- **SVG to PNG:** https://cloudconvert.com/svg-to-png

## After Generation

Once these files are created, update `index.html` with the proper meta tags (see design.md Section 4.3).
