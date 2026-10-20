import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, "../web/public");

// 1. High-precision lime-on-graphite AthlonIQ Source SVG
const sourceSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background graphite gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="30%" r="70%" fx="50%" fy="30%">
      <stop offset="0%" stop-color="#161B26" />
      <stop offset="60%" stop-color="#0F1219" />
      <stop offset="100%" stop-color="#090A0F" />
    </radialGradient>

    <!-- Electric lime to emerald metallic gradient -->
    <linearGradient id="limeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D9F99D" />
      <stop offset="35%" stop-color="#BEF264" />
      <stop offset="85%" stop-color="#84CC16" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>

    <!-- Subdued accent outline gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#BEF264" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#10B981" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.1" />
    </linearGradient>

    <!-- Neon Glow Filter -->
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Solid Graphite Base Canvas (prevents white mask leakage in maskable mode) -->
  <rect width="512" height="512" fill="#090A0F" />
  
  <!-- Subtle inner radial ambient glow -->
  <circle cx="256" cy="240" r="190" fill="#BEF264" fill-opacity="0.06" />

  <!-- Outer Shield Badge Container -->
  <rect 
    x="56" y="56" width="400" height="400" rx="92" 
    fill="url(#bgGrad)" 
    stroke="url(#borderGrad)" 
    stroke-width="5" 
  />

  <!-- Subtle Inner Grid / Core Accent -->
  <rect 
    x="74" y="74" width="364" height="364" rx="74" 
    fill="none" 
    stroke="#ffffff" 
    stroke-opacity="0.04" 
    stroke-width="2" 
  />

  <!-- Core AQ Monogram Geometric Mark -->
  <g transform="translate(100, 126)">
    <!-- Letter 'A': Dynamic Angled Trapezoid / Chevron -->
    <!-- Left Leg -->
    <path 
      d="M 60 250 L 115 40 L 165 40 L 220 250 L 175 250 L 160 190 L 105 190 L 92 250 Z M 115 150 L 150 150 L 138 95 L 128 95 Z" 
      fill="url(#limeGrad)" 
      filter="url(#neonGlow)"
    />

    <!-- Letter 'Q': Minimalist Athletic Octagon with Cybernetic Slash Tail -->
    <g transform="translate(145, 10)">
      <!-- Outer Ring -->
      <path 
        d="M 65 30 L 125 30 L 160 70 L 160 170 L 125 210 L 65 210 L 30 170 L 30 70 Z" 
        fill="none" 
        stroke="url(#limeGrad)" 
        stroke-width="32" 
        stroke-linejoin="miter" 
        stroke-miterlimit="4"
        filter="url(#neonGlow)"
      />
      <!-- Q Diagonal Tail Slice -->
      <path 
        d="M 105 160 L 170 238 L 140 238 L 85 175 Z" 
        fill="url(#limeGrad)" 
        filter="url(#neonGlow)"
      />
      <!-- Small Precision Core Dot -->
      <circle cx="95" cy="120" r="10" fill="#BEF264" fill-opacity="0.9" />
    </g>
  </g>

  <!-- Telemetry Accents: Top Right System Indicator -->
  <circle cx="396" cy="116" r="8" fill="#BEF264" />
  <circle cx="396" cy="116" r="16" fill="none" stroke="#BEF264" stroke-opacity="0.4" stroke-width="2" />
</svg>
`;

async function generateAllIcons() {
  console.log("Generating AthlonIQ PWA Icons...");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Save master SVG
  const svgPath = path.join(outputDir, "athloniq-icon.svg");
  fs.writeFileSync(svgPath, sourceSvg.trim());
  console.log(`✓ Saved master SVG: ${svgPath}`);

  // 2. Generate standard 192x192
  await sharp(Buffer.from(sourceSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(outputDir, "pwa-192x192.png"));
  console.log("✓ Generated web/public/pwa-192x192.png (192x192)");

  // 3. Generate standard 512x512
  await sharp(Buffer.from(sourceSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, "pwa-512x512.png"));
  console.log("✓ Generated web/public/pwa-512x512.png (512x512)");

  // 4. Generate maskable 512x512 (with safe-zone inset padding on solid #090A0F)
  await sharp(Buffer.from(sourceSvg))
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: "#090A0F",
    })
    .png()
    .toFile(path.join(outputDir, "pwa-maskable-512x512.png"));
  console.log("✓ Generated web/public/pwa-maskable-512x512.png (512x512 maskable with safe margin)");

  // 5. Generate apple-touch-icon 180x180
  await sharp(Buffer.from(sourceSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, "apple-touch-icon.png"));
  console.log("✓ Generated web/public/apple-touch-icon.png (180x180)");

  // 6. Generate favicon-32x32.png and favicon.svg
  await sharp(Buffer.from(sourceSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(outputDir, "favicon-32x32.png"));
  console.log("✓ Generated web/public/favicon-32x32.png");

  console.log("All PWA icons generated successfully!");
}

generateAllIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
