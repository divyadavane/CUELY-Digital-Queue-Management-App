const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/fonts');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Minimal valid TTF header converted or tiny woff2 header
// Standard woff2 signature: 'wOF2' (0x774F4632)
const tinyWoff2 = Buffer.from([
  0x77, 0x4F, 0x46, 0x32, // wOF2
  0x00, 0x01, 0x00, 0x00, // flavor
  0x00, 0x00, 0x00, 0x40, // length
  0x00, 0x00,             // numTables
  0x00, 0x00,             // reserved
  0x00, 0x00, 0x00, 0x00, // totalSfntSize
  0x00, 0x00, 0x00, 0x00, // totalCompressedSize
  0x00, 0x00,             // majorVersion
  0x00, 0x00              // minorVersion
]);

fs.writeFileSync(path.join(dir, 'BaticaSans-Regular.woff2'), tinyWoff2);
console.log("Created placeholder font at public/fonts/BaticaSans-Regular.woff2");
