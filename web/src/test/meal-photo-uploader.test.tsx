import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  MealPhotoUploader,
  formatVisionBadge,
} from "@/features/nutrition/components/MealPhotoUploader";
import * as apiModule from "@/services/api";
import { CandidateFoodItem, MealAnalysisResponse } from "@/types";

// Mock useAthloniqState for isolated component testing
vi.mock("@/hooks/useAthloniqState", () => ({
  useAthloniqState: () => ({
    addFoodEntry: vi.fn(),
  }),
}));

const mockCandidate: CandidateFoodItem = {
  id: "test-cand-1",
  food_name: "Whole Wheat Roti",
  matched_catalog_name: "Whole Wheat Roti",
  catalog_id: "roti-wheat",
  estimated_serving: "2 rotis",
  serving_label: "1 medium (40g)",
  quantity: 2,
  calories_kcal: 208,
  protein_g: 7,
  carbs_g: 40,
  fat_g: 3,
  confidence: "high",
  provenance: "ai_estimated",
  is_confirmed: false,
};

describe("Lane B4: MealPhotoUploader Provider & Mode Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-image-url");
    } else {
      vi.spyOn(globalThis.URL, "createObjectURL").mockReturnValue("blob:mock-image-url");
    }
  });

  // =========================================================================
  // 1. formatVisionBadge Unit Tests
  // =========================================================================

  describe("formatVisionBadge helper", () => {
    it("formats live provider and mode correctly", () => {
      expect(formatVisionBadge("gemini", "live")).toBe("gemini (live)");
    });

    it("formats fallback provider and mode correctly", () => {
      expect(formatVisionBadge("mock", "fallback")).toBe("mock (fallback)");
    });

    it("formats demo provider and mode correctly", () => {
      expect(formatVisionBadge("mock", "demo")).toBe("mock (demo)");
    });

    it("returns 'Provider not reported' when both provider and mode are undefined", () => {
      expect(formatVisionBadge(undefined, undefined)).toBe("Provider not reported");
    });

    it("returns 'Provider not reported' when both provider and mode are null", () => {
      expect(formatVisionBadge(null, null)).toBe("Provider not reported");
    });

    it("returns 'Provider not reported' when both provider and mode are empty or whitespace", () => {
      expect(formatVisionBadge("", "")).toBe("Provider not reported");
      expect(formatVisionBadge("   ", "   ")).toBe("Provider not reported");
    });

    it("handles partial availability gracefully", () => {
      expect(formatVisionBadge("gemini", undefined)).toBe("gemini");
      expect(formatVisionBadge(undefined, "live")).toBe("live");
    });
  });

  // =========================================================================
  // 2. Component Integration Tests: Live, Fallback, Demo, and Missing
  // =========================================================================

  describe("MealPhotoUploader UI badge updates from API result", () => {
    const renderUploader = () => {
      return render(
        <MealPhotoUploader
          isOpen={true}
          onClose={vi.fn()}
          selectedDate="2026-11-03"
          selectedSlot="lunch"
        />
      );
    };

    const uploadDummyFile = (container: HTMLElement) => {
      const file = new File(["dummy image bytes"], "meal.jpg", { type: "image/jpeg" });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      fireEvent.change(fileInput, { target: { files: [file] } });
    };

    it("displays live provider and mode when API returns gemini/live", async () => {
      const mockResponse: MealAnalysisResponse = {
        candidates: [mockCandidate],
        detected_item_count: 1,
        provider: "gemini",
        mode: "live",
        model_name: "gemini-2.5-flash",
        provenance: "ai_estimated",
        vision_meta: {
          provider: "gemini",
          mode: "live",
          model_name: "gemini-2.5-flash",
        },
      };

      vi.spyOn(apiModule, "analyzeMealPhotoApi").mockResolvedValue(mockResponse);

      const { container } = renderUploader();

      // Initial state
      const badge = screen.getByTestId("vision-provider-badge");
      expect(badge).toHaveTextContent("Vision Engine");

      // Upload image
      uploadDummyFile(container);

      // Verify badge updates to typed live provider & mode
      await waitFor(() => {
        expect(badge).toHaveTextContent("gemini (live)");
      });

      expect(badge.textContent).not.toContain("Live Vision API");
    });

    it("displays fallback provider and mode when API returns mock/fallback", async () => {
      const mockResponse: MealAnalysisResponse = {
        candidates: [mockCandidate],
        detected_item_count: 1,
        provider: "mock",
        mode: "fallback",
        provenance: "ai_estimated",
        vision_meta: {
          provider: "mock",
          mode: "fallback",
        },
      };

      vi.spyOn(apiModule, "analyzeMealPhotoApi").mockResolvedValue(mockResponse);

      const { container } = renderUploader();
      const badge = screen.getByTestId("vision-provider-badge");

      uploadDummyFile(container);

      await waitFor(() => {
        expect(badge).toHaveTextContent("mock (fallback)");
      });
    });

    it("displays demo provider and mode when API returns mock/demo", async () => {
      const mockResponse: MealAnalysisResponse = {
        candidates: [mockCandidate],
        detected_item_count: 1,
        provider: "mock",
        mode: "demo",
        provenance: "ai_estimated",
        vision_meta: {
          provider: "mock",
          mode: "demo",
        },
      };

      vi.spyOn(apiModule, "analyzeMealPhotoApi").mockResolvedValue(mockResponse);

      const { container } = renderUploader();
      const badge = screen.getByTestId("vision-provider-badge");

      uploadDummyFile(container);

      await waitFor(() => {
        expect(badge).toHaveTextContent("mock (demo)");
      });
    });

    it("displays 'Provider not reported' when API response omits provider and mode", async () => {
      const mockResponse: MealAnalysisResponse = {
        candidates: [mockCandidate],
        detected_item_count: 1,
        provenance: "ai_estimated",
        // provider, mode, vision_meta are absent/undefined
      };

      vi.spyOn(apiModule, "analyzeMealPhotoApi").mockResolvedValue(mockResponse);

      const { container } = renderUploader();
      const badge = screen.getByTestId("vision-provider-badge");

      uploadDummyFile(container);

      await waitFor(() => {
        expect(badge).toHaveTextContent("Provider not reported");
      });

      // Must not fall back to "Live Vision API"
      expect(badge.textContent).not.toContain("Live Vision API");
    });

    it("displays 'mock (demo)' when user selects a preset demo meal", async () => {
      renderUploader();
      const badge = screen.getByTestId("vision-provider-badge");

      // Find and click the demo preset button
      const demoBtn = screen.getByText(/Demo: 2 Rotis \+ Dal Tadka/i);
      fireEvent.click(demoBtn);

      expect(badge).toHaveTextContent("mock (demo)");
    });
  });
});
