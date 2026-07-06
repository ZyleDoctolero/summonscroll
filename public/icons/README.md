# PWA Icons

Place the following PNG icon files in this directory:

| File                   | Size    | Purpose                                      |
|------------------------|---------|----------------------------------------------|
| `icon-192.png`         | 192×192 | Standard app icon                            |
| `icon-512.png`         | 512×512 | High-res app icon                            |
| `icon-512-maskable.png`| 512×512 | Maskable icon (safe zone = center 80%)       |

## Generating Icons

Use the `favicon.svg` as the source. Tools:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator): `npx pwa-asset-generator favicon.svg ./public/icons`
- [RealFaviconGenerator](https://realfavicongenerator.net)
- Figma / Inkscape export

The SVG icon (`/favicon.svg`) is used as a fallback for browsers that support SVG icons.
