/**
 * AthlonIQ PWA Configuration & Workbox Safe Caching Policy
 * 
 * Critical Security Invariant:
 * NEVER cache private data, telemetry, biometrics, credentials, or remote storage objects.
 * Runtime handlers for Supabase, Backend API, Signed URLs, and photo buckets MUST BE NetworkOnly.
 */

export const PWA_MANIFEST = {
  name: "AthlonIQ",
  short_name: "AthlonIQ",
  description: "Personal AI Performance & Physique OS",
  theme_color: "#090A0F",
  background_color: "#090A0F",
  display: "standalone" as const,
  orientation: "portrait" as const,
  start_url: "/",
  scope: "/",
  icons: [
    {
      src: "/pwa-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/pwa-maskable-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
      purpose: "any",
    },
  ],
};

export const PWA_WORKBOX_CONFIG = {
  // Precache the built app shell only (JS, CSS, HTML, Fonts, Icons)
  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
  
  // Navigation fallback to app shell
  navigateFallback: "/index.html",
  navigateFallbackDenylist: [/^\/api\//, /^\/health/],

  // Strict zero-caching rules for sensitive private data & APIs
  runtimeCaching: [
    {
      // 1. ALL *.supabase.co requests (Auth, PostgREST, Realtime, Storage)
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: "NetworkOnly" as const,
      options: {
        cacheName: "supabase-network-only",
      },
    },
    {
      // 2. Anything under API base URL or backend intelligence engine
      urlPattern: ({ url }: { url: URL }) => {
        return (
          url.pathname.startsWith("/api/") ||
          url.pathname.startsWith("/health") ||
          url.port === "8000" ||
          (url.hostname === "localhost" && url.port === "8000")
        );
      },
      handler: "NetworkOnly" as const,
      options: {
        cacheName: "api-network-only",
      },
    },
    {
      // 3. Signed URLs (storage access tokens, expiring links)
      urlPattern: ({ url }: { url: URL }) => {
        return (
          url.searchParams.has("token") ||
          url.searchParams.has("Signature") ||
          url.searchParams.has("X-Amz-Signature") ||
          url.searchParams.has("sig")
        );
      },
      handler: "NetworkOnly" as const,
      options: {
        cacheName: "signed-urls-network-only",
      },
    },
    {
      // 4. Any image from meal-photos or progress-photos buckets
      urlPattern: ({ url }: { url: URL }) => {
        const path = url.pathname.toLowerCase();
        return (
          path.includes("meal-photos") ||
          path.includes("progress-photos") ||
          path.includes("athlete_progress_photos") ||
          path.includes("meal_photos")
        );
      },
      handler: "NetworkOnly" as const,
      options: {
        cacheName: "private-photos-network-only",
      },
    },
  ],
};
