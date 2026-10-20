import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { PWA_MANIFEST, PWA_WORKBOX_CONFIG } from "./src/config/pwaConfig";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "athloniq-icon.svg",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-maskable-512x512.png",
      ],
      manifest: PWA_MANIFEST,
      workbox: PWA_WORKBOX_CONFIG,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
