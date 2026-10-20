import { describe, it, expect } from "vitest";
import { PWA_MANIFEST, PWA_WORKBOX_CONFIG } from "@/config/pwaConfig";

describe("PWA Service Worker & Safe Caching Configuration", () => {
  describe("Web App Manifest Validation", () => {
    it("satisfies standalone PWA identity tokens and orientation", () => {
      expect(PWA_MANIFEST.name).toBe("AthlonIQ");
      expect(PWA_MANIFEST.short_name).toBe("AthlonIQ");
      expect(PWA_MANIFEST.display).toBe("standalone");
      expect(PWA_MANIFEST.theme_color).toBe("#090A0F");
      expect(PWA_MANIFEST.background_color).toBe("#090A0F");
      expect(PWA_MANIFEST.start_url).toBe("/");
      expect(PWA_MANIFEST.scope).toBe("/");
      expect(PWA_MANIFEST.orientation).toBe("portrait");
    });

    it("declares standard 192, 512, maskable 512, and apple-touch icons", () => {
      const iconSizes = PWA_MANIFEST.icons.map((i) => i.sizes);
      expect(iconSizes).toContain("192x192");
      expect(iconSizes).toContain("512x512");
      expect(iconSizes).toContain("180x180");

      const maskableIcon = PWA_MANIFEST.icons.find((i) => i.purpose === "maskable");
      expect(maskableIcon).toBeDefined();
      expect(maskableIcon?.sizes).toBe("512x512");
      expect(maskableIcon?.src).toBe("/pwa-maskable-512x512.png");
    });
  });

  describe("Service Worker Policy & Zero-Private-Data Caching Rules", () => {
    it("precaches app shell only and denylists backend APIs from navigation fallback", () => {
      expect(PWA_WORKBOX_CONFIG.navigateFallback).toBe("/index.html");
      expect(PWA_WORKBOX_CONFIG.globPatterns).toEqual([
        "**/*.{js,css,html,ico,png,svg,woff2}",
      ]);

      const denylist = PWA_WORKBOX_CONFIG.navigateFallbackDenylist;
      expect(denylist.some((re) => re.test("/api/v1/coach/chat"))).toBe(true);
      expect(denylist.some((re) => re.test("/health"))).toBe(true);
      expect(denylist.some((re) => re.test("/index.html"))).toBe(false);
    });

    it("enforces NetworkOnly for all *.supabase.co requests (Auth, REST, Storage)", () => {
      const supabaseRule = PWA_WORKBOX_CONFIG.runtimeCaching.find((rule) => {
        if (rule.urlPattern instanceof RegExp) {
          return (
            rule.urlPattern.test("https://xyzcompany.supabase.co/auth/v1/token") &&
            rule.urlPattern.test("https://db.supabase.co/rest/v1/profiles")
          );
        }
        return false;
      });

      expect(supabaseRule).toBeDefined();
      expect(supabaseRule?.handler).toBe("NetworkOnly");

      // Verify pattern matching
      const pattern = supabaseRule?.urlPattern as RegExp;
      expect(pattern.test("https://myproject.supabase.co/auth/v1/signup")).toBe(true);
      expect(pattern.test("https://myproject.supabase.co/storage/v1/object/authenticated/meal-photos")).toBe(true);
      expect(pattern.test("https://api.github.com/repos")).toBe(false);
    });

    it("enforces NetworkOnly for backend API and port 8000 endpoints", () => {
      const apiRule = PWA_WORKBOX_CONFIG.runtimeCaching.find((rule) => {
        if (typeof rule.urlPattern === "function") {
          return rule.urlPattern({ url: new URL("http://localhost:8000/api/v1/coach/chat") });
        }
        return false;
      });

      expect(apiRule).toBeDefined();
      expect(apiRule?.handler).toBe("NetworkOnly");

      const matcher = apiRule?.urlPattern as (params: { url: URL }) => boolean;
      expect(matcher({ url: new URL("http://localhost:8000/health") })).toBe(true);
      expect(matcher({ url: new URL("http://localhost:8000/api/v1/intelligence/recommendations") })).toBe(true);
      expect(matcher({ url: new URL("https://app.athloniq.internal/api/v1/nutrition/targets") })).toBe(true);
      expect(matcher({ url: new URL("https://app.athloniq.internal/static/logo.png") })).toBe(false);
    });

    it("enforces NetworkOnly for temporary signed URLs with security tokens", () => {
      const signedUrlRule = PWA_WORKBOX_CONFIG.runtimeCaching.find((rule) => {
        if (typeof rule.urlPattern === "function") {
          return rule.urlPattern({
            url: new URL("https://storage.cdn.com/object?Signature=abc1234"),
          });
        }
        return false;
      });

      expect(signedUrlRule).toBeDefined();
      expect(signedUrlRule?.handler).toBe("NetworkOnly");

      const matcher = signedUrlRule?.urlPattern as (params: { url: URL }) => boolean;
      expect(matcher({ url: new URL("https://cdn.example.com/file?token=secret-token") })).toBe(true);
      expect(matcher({ url: new URL("https://cdn.example.com/file?X-Amz-Signature=signed99") })).toBe(true);
      expect(matcher({ url: new URL("https://cdn.example.com/file?sig=expires123") })).toBe(true);
      expect(matcher({ url: new URL("https://cdn.example.com/file?version=1.0.0") })).toBe(false);
    });

    it("enforces NetworkOnly for meal-photos and progress-photos storage buckets", () => {
      const photoRule = PWA_WORKBOX_CONFIG.runtimeCaching.find((rule) => {
        if (typeof rule.urlPattern === "function") {
          return rule.urlPattern({
            url: new URL("https://cdn.example.com/storage/v1/object/meal-photos/user-123.jpg"),
          });
        }
        return false;
      });

      expect(photoRule).toBeDefined();
      expect(photoRule?.handler).toBe("NetworkOnly");

      const matcher = photoRule?.urlPattern as (params: { url: URL }) => boolean;
      expect(matcher({ url: new URL("https://storage.com/progress-photos/week-4.png") })).toBe(true);
      expect(matcher({ url: new URL("https://storage.com/athlete_progress_photos/selfie.jpg") })).toBe(true);
      expect(matcher({ url: new URL("https://storage.com/public-assets/illustration.svg") })).toBe(false);
    });

    it("contains zero cache rules that store or stale-revalidate user data", () => {
      for (const rule of PWA_WORKBOX_CONFIG.runtimeCaching) {
        expect(rule.handler).toBe("NetworkOnly");
      }
    });
  });
});
