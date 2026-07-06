/**
 * Favicon Generation Script
 * 
 * This script generates PNG favicons from the SVG source.
 * Requires: sharp package (npm install sharp)
 * 
 * Usage: node generate-favicons.js
 */

const fs = require('fs');
const path = require('path');

console.log('⚠️  PNG Favicon Generation Required');
console.log('');
console.log('This project needs the following PNG assets generated from favicon.svg:');
console.log('');
console.log('1. favicon-16.png (16×16)');
console.log('2. apple-touch-icon.png (180×180)');
console.log('3. og-image.png (1200×630)');
console.log('');
console.log('Options to generate these:');
console.log('');
console.log('A) Install sharp and use this script:');
console.log('   npm install sharp');
console.log('   node generate-favicons.js');
console.log('');
console.log('B) Use ImageMagick:');
console.log('   convert -background none -resize 16x16 public/favicon.svg public/favicon-16.png');
console.log('   convert -background none -resize 180x180 public/favicon.svg public/apple-touch-icon.png');
console.log('');
console.log('C) Use online tool:');
console.log('   https://realfavicongenerator.net/');
console.log('');

// Check if sharp is available
try {
  const sharp = require('sharp');
  
  async function generateFavicons() {
    const svgPath = path.join(__dirname, 'public', 'favicon.svg');
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Generate 16x16 favicon
    await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toFile(path.join(__dirname, 'public', 'favicon-16.png'));
    console.log('✓ Generated favicon-16.png');
    
    // Generate 180x180 Apple touch icon
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon.png');
    
    console.log('');
    console.log('⚠️  Note: og-image.png (1200×630) needs custom design');
    console.log('   Create this manually with your design tool');
  }
  
  generateFavicons().catch(console.error);
  
} catch (err) {
  console.log('ℹ️  Sharp not installed. Install it to auto-generate PNGs:');
  console.log('   npm install sharp');
  console.log('');
  process.exit(0);
}
