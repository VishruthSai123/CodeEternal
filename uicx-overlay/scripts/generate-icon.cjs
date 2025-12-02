const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '../assets/icon.png');
const outputDir = path.join(__dirname, '../assets');

// Create rounded corners mask (25% radius)
async function createRoundedIcon() {
  const pngToIco = (await import('png-to-ico')).default;
  const sizes = [16, 32, 48, 64, 128, 256];
  
  console.log('Creating rounded corner icons...');
  
  for (const size of sizes) {
    const cornerRadius = Math.round(size * 0.25); // 25% corner radius
    
    // Create SVG mask for rounded corners
    const roundedMask = Buffer.from(
      `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/></svg>`
    );
    
    await sharp(inputPath)
      .resize(size, size)
      .composite([{
        input: roundedMask,
        blend: 'dest-in'
      }])
      .png()
      .toFile(path.join(outputDir, `icon-${size}.png`));
    
    console.log(`Created ${size}x${size} icon`);
  }
  
  // Create the main rounded icon for the app
  const mainSize = 512;
  const mainRadius = Math.round(mainSize * 0.25);
  const mainMask = Buffer.from(
    `<svg><rect x="0" y="0" width="${mainSize}" height="${mainSize}" rx="${mainRadius}" ry="${mainRadius}"/></svg>`
  );
  
  await sharp(inputPath)
    .resize(mainSize, mainSize)
    .composite([{
      input: mainMask,
      blend: 'dest-in'
    }])
    .png()
    .toFile(path.join(outputDir, 'icon-rounded.png'));
  
  console.log('Created main rounded icon (512x512)');
  
  // Use png-to-ico to create ICO from the rounded 256px version
  const icoBuffer = await pngToIco(path.join(outputDir, 'icon-256.png'));
  fs.writeFileSync(path.join(outputDir, 'icon.ico'), icoBuffer);
  
  console.log('Created icon.ico');
  
  // Cleanup intermediate files
  for (const size of sizes) {
    fs.unlinkSync(path.join(outputDir, `icon-${size}.png`));
  }
  
  console.log('Cleaned up intermediate files');
  console.log('Done! Icon files created successfully.');
}

createRoundedIcon().catch(console.error);
