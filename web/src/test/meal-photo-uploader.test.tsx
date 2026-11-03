import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  MealPhotoUploader,
  formatVisionBadge,
} from "@/features/nutrition/components/MealPhotoUploader";
import * as apiModule from "@/services/api";
import { CandidateFoodItem, MealAnalysisResponse } from "@/types";

// Mock useAthloniqState for isolated component testing
const mockAddFoodEntry = vi.fn();
vi.mock("@/hooks/useAthloniqState", () => ({
  useAthloniqState: () => ({
    addFoodEntry: mockAddFoodEntry,
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

  // =========================================================================
  // 3. Lane B5: Fallback Handling, Demo Labeling, and Live Confirmation
  // =========================================================================

  describe("Lane B5: Vision Fallback, Demo Labeling & Live Confirmation", () => {
    const uploadDummyFile = (container: HTMLElement) => {
      const file = new File(["dummy image bytes"], "meal.jpg", { type: "image/jpeg" });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      fireEvent.change(fileInput, { target: { files: [file] } });
    };

    it("empty fallback shows the message and the manual-entry button", async () => {
      const mockResponse: MealAnalysisResponse = {
        candidates: [],
        detected_item_count: 0,
        provider: "mock",
        mode: "fallback",
        provenance: "ai_estimated",
        message: "Vision unavailable — log manually",
        vision_meta: {
          provider: "mock",
          mode: "fallback",
        },
      };

      vi.spyOn(apiModule, "analyzeMealPhotoApi").mockResolvedValue(mockResponse);

      const onOpenManualEntry = vi.fn();
      const onClose = vi.fn();

      const { container } = render(
        <MealPhotoUploader
          isOpen={true}
          onClose={onClose}
          selectedDate="2026-11-03"
          selectedSlot="lunch"
          onOpenManualEntry={onOpenManualEntry}
        />
      );

      const badge = screen.getByTestId("vision-provider-badge");
      uploadDummyFile(container);

      await waitFor(() => {
        expect(badge).toHaveTextContent("mock (fallback)");
      });

      // Verify the fallback message is rendered
      const emptyMessage = await screen.findByTestId("vision-empty-message");
      expect(emptyMessage).toHaveTextContent("Vision unavailable — log manually");

      // Verify manual entry button is present
      const manualEntryBtn = screen.getByTestId("manual-entry-button");
      expect(manualEntryBtn).toBeInTheDocument();
      expect(manualEntryBtn).toHaveTextContent("Log Manually");

      // Clicking manual entry button invokes callbacks and closes modal
      fireEvent.click(manualEntryBtn);
      expect(onOpenManualEntry).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);

      // Verify NO candidates were prefilled
      expect(screen.queryByText("Detected Foods")).not.toBeInTheDocument();
      expect(screen.queryByText("Whole Wheat Roti")).not.toBeInTheDocument();
    });

    it("handles API error by showing fallback message and manual-entry button without prefilling foods", async () => {
      vi.spyOn(apiModule, "analyzeMealPhotoApi").mockRejectedValue(new Error("Network Error"));

      const onOpenManualEntry = vi.fn();
      const onClose = vi.fn();

      const { container } = render(
        <MealPhotoUploader
          isOpen={true}
          onClose={onClose}
          selectedDate="2026-11-03"
          selectedSlot="lunch"
          onOpenManualEntry={onOpenManualEntry}
        />
      );

      const badge = screen.getByTestId("vision-provider-badge");
      uploadDummyFile(container);

      await waitFor(() => {
        expect(badge).toHaveTextContent("mock (fallback)");
      });

      // Verify fallback message is rendered on error
      const emptyMessage = await screen.findByTestId("vision-empty-message");
      expect(emptyMessage).toHaveTextContent("Vision unavailable — log manually");

      // Verify manual entry button is present
      const manualEntryBtn = screen.getByTestId("manual-entry-button");
      expect(manualEntryBtn).toBeInTheDocument();

      // Verify NO food was prefilled from mock presets
      expect(screen.queryByText("Detected Foods")).not.toBeInTheDocument();
      expect(screen.queryByText("Whole Wheat Roti")).not.toBeInTheDocument();
    });

    it("demo shows labelled samples", async () => {
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

      const { container } = render(
        <MealPhotoUploader
          isOpen={true}
          onClose={vi.fn()}
          selectedDate="2026-11-03"
          selectedSlot="lunch"
        />
      );

      uploadDummyFile(container);

      await waitFor(() => {
        expect(screen.getByTestId("vision-provider-badge")).toHaveTextContent("mock (demo)");
      });

      // Verify demo banner badge
      const demoBadge = await screen.findByTestId("demo-sample-badge");
      expect(demoBadge).toHaveTextContent("DEMO SAMPLES");

      // Verify demo sample label next to candidate food name
      const demoLabels = screen.getAllByTestId("demo-sample-label");
      expect(demoLabels.length).toBeGreaterThan(0);
      expect(demoLabels[0]).toHaveTextContent("DEMO SAMPLE");
    });

    it("live shows candidates needing confirmation (ai_estimated until the user confirms)", async () => {
      const mockResponse: MealAnalysisResponse = {
        candidates: [
          {
            ...mockCandidate,
            is_confirmed: false,
            provenance: "ai_estimated",
          },
        ],
        detected_item_count: 1,
        provider: "gemini",
        mode: "live",
        provenance: "ai_estimated",
        vision_meta: {
          provider: "gemini",
          mode: "live",
        },
      };

      vi.spyOn(apiModule, "analyzeMealPhotoApi").mockResolvedValue(mockResponse);

      const { container } = render(
        <MealPhotoUploader
          isOpen={true}
          onClose={vi.fn()}
          selectedDate="2026-11-03"
          selectedSlot="lunch"
        />
      );

      uploadDummyFile(container);

      await waitFor(() => {
        expect(screen.getByTestId("vision-provider-badge")).toHaveTextContent("gemini (live)");
      });

      // Guardrail active banner
      expect(screen.getByText("AthlonIQ Vision Guardrail Active")).toBeInTheDocument();

      // Demo badges must NOT appear in live mode
      expect(screen.queryByTestId("demo-sample-badge")).not.toBeInTheDocument();
      expect(screen.queryByTestId("demo-sample-label")).not.toBeInTheDocument();

      // Candidate is ai_estimated before confirmation
      const aiBadges = screen.getAllByText(/ai estimated/i);
      expect(aiBadges.length).toBeGreaterThan(0);

      // Find confirm button
      const confirmBtn = screen.getByRole("button", { name: /Confirm & Log/i });
      expect(confirmBtn).toBeInTheDocument();

      // Athlete explicitly confirms
      fireEvent.click(confirmBtn);

      // Verify addFoodEntry was called with confirmed flags
      expect(mockAddFoodEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          foodName: "Whole Wheat Roti",
          isConfirmed: true,
          is_confirmed: true,
          provenance: "ai_estimated",
        })
      );
    });
  });
});
