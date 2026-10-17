"""AthlonIQ Phase 2 Tracking — Unit & Integration Tests

Tests:
  1. Indian food catalog search (roti, dal, paneer, chicken, idli, dosa)
  2. calculate_daily_nutrition_totals — confirmed vs unconfirmed guardrail
  3. calculate_running_pace(5.0, 27.5) → "5:30 /km"
  4. evaluate_progression_suggestion — increase load, at-cap reps, equipment block, deload
  5. calculate_weight_trend — insufficient data gate & rolling averages
  6. API endpoint smoke tests (GET /foods, POST /nutrition-summary, etc.)
"""

import pytest
from fastapi.testclient import TestClient

from app.domain.tracking import (
    FoodEntryInput,
    PreviousSet,
    WeightPoint,
    calculate_daily_nutrition_totals,
    calculate_running_pace,
    calculate_weight_trend,
    evaluate_progression_suggestion,
    search_food_catalog,
)
from app.main import app


# =============================================================================
# Helpers
# =============================================================================

TEST_AUTH_HEADERS = {"Authorization": "Bearer test-token-phase2-user"}

client = TestClient(app)


# =============================================================================
# 1. Indian Food Catalog Search
# =============================================================================

class TestFoodCatalogSearch:

    def test_search_roti_returns_result(self):
        results = search_food_catalog(query="roti")
        assert any("Roti" in r["name"] for r in results), "Expected Roti in catalog"

    def test_search_dal_returns_result(self):
        results = search_food_catalog(query="dal")
        assert any("Dal" in r["name"] for r in results), "Expected Dal in catalog"

    def test_search_paneer_returns_result(self):
        results = search_food_catalog(query="paneer")
        assert len(results) >= 1, "Expected Paneer entries"
        assert all("Paneer" in r["name"] for r in results)

    def test_search_chicken_returns_result(self):
        results = search_food_catalog(query="chicken")
        assert len(results) >= 1, "Expected Chicken entries"

    def test_search_idli_returns_result(self):
        results = search_food_catalog(query="idli")
        assert any("Idli" in r["name"] for r in results)

    def test_search_dosa_returns_multiple(self):
        results = search_food_catalog(query="dosa")
        assert len(results) >= 2, "Expected both Plain Dosa and Masala Dosa"

    def test_catalog_has_22_plus_items(self):
        results = search_food_catalog()
        assert len(results) >= 22, f"Expected >= 22 catalog items, got {len(results)}"

    def test_all_items_have_verified_provenance(self):
        results = search_food_catalog()
        for item in results:
            assert item["provenance"] == "verified_reference", (
                f"Item '{item['name']}' has provenance '{item['provenance']}', expected 'verified_reference'"
            )

    def test_filter_by_category_protein(self):
        results = search_food_catalog(category="protein")
        assert len(results) >= 5
        assert all(r["category"] == "protein" for r in results)

    def test_search_empty_query_returns_all(self):
        results = search_food_catalog(query=None, category=None)
        assert len(results) >= 22

    def test_search_egg_returns_results(self):
        results = search_food_catalog(query="egg")
        assert len(results) >= 1

    def test_search_whey_protein(self):
        results = search_food_catalog(query="whey")
        assert len(results) >= 1
        assert results[0]["protein_g"] >= 20.0  # Whey should be high protein

    def test_search_ghee_returns_fat_entry(self):
        results = search_food_catalog(query="ghee")
        assert len(results) >= 1
        assert results[0]["fat_g"] > 0

    def test_search_nonexistent_returns_empty(self):
        results = search_food_catalog(query="xyz_nonexistent_food_999")
        assert results == []


# =============================================================================
# 2. calculate_daily_nutrition_totals — Confirmed / Unconfirmed Guardrail
# =============================================================================

class TestDailyNutritionTotals:

    def _make_entry(self, kcal, protein, carbs, fat, qty=1.0, confirmed=True) -> FoodEntryInput:
        return FoodEntryInput(
            food_name="Test Food",
            calories_kcal=kcal,
            protein_g=protein,
            carbs_g=carbs,
            fat_g=fat,
            quantity=qty,
            is_confirmed=confirmed,
        )

    def test_confirmed_entries_sum_correctly(self):
        entries = [
            self._make_entry(195.0, 4.0, 43.0, 0.5),   # rice
            self._make_entry(104.0, 3.5, 20.0, 1.5),   # roti
        ]
        summary = calculate_daily_nutrition_totals(entries)
        ct = summary.confirmed_totals
        assert ct.calories_kcal == 299.0
        assert ct.protein_g == 7.5
        assert ct.entry_count == 2

    def test_unconfirmed_entries_excluded_from_confirmed_totals(self):
        """CRITICAL: Unconfirmed photo estimates must NEVER pollute confirmed totals."""
        entries = [
            self._make_entry(200.0, 20.0, 10.0, 5.0, confirmed=True),
            self._make_entry(500.0, 50.0, 60.0, 20.0, confirmed=False),  # photo estimate
        ]
        summary = calculate_daily_nutrition_totals(entries)

        # Confirmed totals: only first entry
        assert summary.confirmed_totals.calories_kcal == 200.0
        assert summary.confirmed_totals.protein_g == 20.0
        assert summary.confirmed_totals.entry_count == 1

        # Unconfirmed separately tracked
        assert summary.unconfirmed_estimates.calories_kcal == 500.0
        assert summary.unconfirmed_estimates.protein_g == 50.0
        assert summary.unconfirmed_estimates.entry_count == 1

    def test_quantity_multiplier_applied_correctly(self):
        # 1.5 portions of chicken breast (247 kcal, 46.5g protein each)
        entries = [self._make_entry(247.0, 46.5, 0.0, 5.5, qty=1.5)]
        summary = calculate_daily_nutrition_totals(entries)
        ct = summary.confirmed_totals
        assert ct.calories_kcal == round(247.0 * 1.5, 1)
        assert ct.protein_g == round(46.5 * 1.5, 1)

    def test_empty_entries_returns_zero_totals(self):
        summary = calculate_daily_nutrition_totals([])
        assert summary.confirmed_totals.calories_kcal == 0.0
        assert summary.confirmed_totals.entry_count == 0

    def test_all_unconfirmed_gives_zero_confirmed_totals(self):
        entries = [self._make_entry(300.0, 30.0, 40.0, 10.0, confirmed=False)]
        summary = calculate_daily_nutrition_totals(entries)
        assert summary.confirmed_totals.calories_kcal == 0.0
        assert summary.confirmed_totals.entry_count == 0

    def test_half_quantity_rounds_correctly(self):
        entries = [self._make_entry(195.0, 4.0, 43.0, 0.5, qty=0.5)]
        summary = calculate_daily_nutrition_totals(entries)
        ct = summary.confirmed_totals
        assert ct.calories_kcal == 97.5
        assert ct.protein_g == 2.0


# =============================================================================
# 3. calculate_running_pace
# =============================================================================

class TestRunningPace:

    def test_5km_in_27_5min_returns_5_30(self):
        """5.0 km in 27.5 min → 5.5 min/km → formatted "5:30 /km"."""
        result = calculate_running_pace(5.0, 27.5)
        assert result.pace_decimal == 5.5
        assert result.pace_formatted == "5:30 /km"

    def test_10km_in_60min_returns_6_00(self):
        result = calculate_running_pace(10.0, 60.0)
        assert result.pace_formatted == "6:00 /km"

    def test_5km_in_25min_returns_5_00(self):
        result = calculate_running_pace(5.0, 25.0)
        assert result.pace_formatted == "5:00 /km"

    def test_negative_distance_raises_value_error(self):
        with pytest.raises(ValueError, match="distance_km"):
            calculate_running_pace(-1.0, 30.0)

    def test_zero_distance_raises_value_error(self):
        with pytest.raises(ValueError, match="distance_km"):
            calculate_running_pace(0.0, 30.0)

    def test_zero_duration_raises_value_error(self):
        with pytest.raises(ValueError, match="duration_minutes"):
            calculate_running_pace(5.0, 0.0)

    def test_pace_decimal_correct(self):
        result = calculate_running_pace(3.0, 18.0)
        assert result.pace_decimal == 6.0

    def test_pace_formatted_is_string(self):
        result = calculate_running_pace(5.0, 27.5)
        assert isinstance(result.pace_formatted, str)
        assert "/km" in result.pace_formatted


# =============================================================================
# 4. evaluate_progression_suggestion
# =============================================================================

class TestProgressionSuggestion:

    def _sets(self, reps=10, load=60.0, rpe=8.0, bodyweight=False):
        return [PreviousSet(reps=reps, load_kg=load, rpe=rpe, is_bodyweight=bodyweight)]

    def test_increase_load_when_under_cap_all_sets_hit_target(self):
        """All sets hit target reps at <= 8.5 RPE, under 70 kg cap → increase_load."""
        suggestion = evaluate_progression_suggestion(
            exercise_name="Bench Press",
            previous_sets=self._sets(reps=10, load=60.0, rpe=7.5),
            equipment_max_load_kg=70.0,
            equipment_min_increment_kg=2.5,
            equipment_confirmed=True,
            readiness_status="Prime",
            target_reps_max=10,
        )
        assert suggestion.action == "increase_load"
        assert suggestion.new_load_kg == 62.5
        assert suggestion.requires_user_confirmation is True

    def test_increase_reps_when_at_70kg_cap(self):
        """At 70 kg home cap → suggest reps/tempo instead of load increase."""
        suggestion = evaluate_progression_suggestion(
            exercise_name="Bench Press",
            previous_sets=self._sets(reps=12, load=70.0, rpe=7.0),
            equipment_max_load_kg=70.0,
            equipment_min_increment_kg=2.5,
            equipment_confirmed=True,
            readiness_status="Prime",
            target_reps_max=12,
        )
        assert suggestion.action == "increase_reps_or_tempo"
        assert suggestion.requires_user_confirmation is True

    def test_increase_reps_for_bodyweight_exercise(self):
        """Bodyweight exercises always go to reps/tempo suggestion."""
        suggestion = evaluate_progression_suggestion(
            exercise_name="Pull-ups",
            previous_sets=self._sets(reps=12, load=0.0, rpe=7.0, bodyweight=True),
            equipment_max_load_kg=70.0,
            equipment_min_increment_kg=2.5,
            equipment_confirmed=True,
            readiness_status="Prime",
            target_reps_max=12,
        )
        assert suggestion.action == "increase_reps_or_tempo"

    def test_blocks_progression_when_equipment_unconfirmed(self):
        """Equipment not confirmed → confirm_equipment_first, regardless of performance."""
        suggestion = evaluate_progression_suggestion(
            exercise_name="Deadlift",
            previous_sets=self._sets(reps=10, load=60.0, rpe=7.0),
            equipment_max_load_kg=70.0,
            equipment_min_increment_kg=2.5,
            equipment_confirmed=False,   # <- unconfirmed
            readiness_status="Prime",
            target_reps_max=10,
        )
        assert suggestion.action == "confirm_equipment_first"
        assert suggestion.requires_user_confirmation is True

    def test_deload_when_readiness_is_recover(self):
        """Recover status → maintain_or_deload, regardless of performance."""
        suggestion = evaluate_progression_suggestion(
            exercise_name="Squat",
            previous_sets=self._sets(reps=10, load=60.0, rpe=7.0),
            equipment_max_load_kg=70.0,
            equipment_min_increment_kg=2.5,
            equipment_confirmed=True,
            readiness_status="Recover",  # <- recover
            target_reps_max=10,
        )
        assert suggestion.action == "maintain_or_deload"
        assert suggestion.requires_user_confirmation is True

    def test_deload_when_avg_rpe_too_high(self):
        """Avg RPE >= 9.5 → maintain_or_deload."""
        sets = [
            PreviousSet(reps=8, load_kg=60.0, rpe=9.5),
            PreviousSet(reps=7, load_kg=60.0, rpe=9.8),
        ]
        suggestion = evaluate_progression_suggestion(
            exercise_name="Overhead Press",
            previous_sets=sets,
            equipment_max_load_kg=70.0,
            equipment_min_increment_kg=2.5,
            equipment_confirmed=True,
            readiness_status="Moderate",
            target_reps_max=10,
        )
        assert suggestion.action == "maintain_or_deload"

    def test_maintain_when_not_all_sets_hit_target(self):
        """Not all sets hit reps target → maintain."""
        sets = [
            PreviousSet(reps=8, load_kg=60.0, rpe=8.0),  # missed target of 10
            PreviousSet(reps=7, load_kg=60.0, rpe=8.0),
        ]
        suggestion = evaluate_progression_suggestion(
            exercise_name="Row",
            previous_sets=sets,
            equipment_max_load_kg=70.0,
            equipment_min_increment_kg=2.5,
            equipment_confirmed=True,
            readiness_status="Moderate",
            target_reps_max=10,
        )
        assert suggestion.action == "maintain"

    def test_requires_user_confirmation_always_true(self):
        """requires_user_confirmation must always be True — auto-mutation is forbidden."""
        for readiness in ["Prime", "Moderate", "Recover"]:
            s = evaluate_progression_suggestion(
                exercise_name="Curl",
                previous_sets=self._sets(reps=10, load=20.0, rpe=7.0),
                equipment_max_load_kg=70.0,
                equipment_min_increment_kg=2.5,
                equipment_confirmed=True,
                readiness_status=readiness,
                target_reps_max=10,
            )
            assert s.requires_user_confirmation is True, (
                f"requires_user_confirmation must be True for readiness={readiness}"
            )


# =============================================================================
# 5. calculate_weight_trend
# =============================================================================

class TestWeightTrend:

    def test_insufficient_data_for_one_entry(self):
        entries = [WeightPoint("2026-10-01", 55.0)]
        result = calculate_weight_trend(entries)
        assert result.status == "insufficient_data"
        assert result.rolling_7d_kg is None
        assert "1 of 3 minimum" in result.explanation or "1 weigh" in result.explanation or "insufficient" in result.explanation.lower()

    def test_insufficient_data_for_two_entries(self):
        entries = [
            WeightPoint("2026-10-01", 55.0),
            WeightPoint("2026-10-02", 55.2),
        ]
        result = calculate_weight_trend(entries)
        assert result.status == "insufficient_data"

    def test_insufficient_data_for_empty(self):
        result = calculate_weight_trend([])
        assert result.status == "insufficient_data"

    def test_three_entries_returns_ok(self):
        entries = [
            WeightPoint("2026-10-01", 55.0),
            WeightPoint("2026-10-02", 55.2),
            WeightPoint("2026-10-03", 55.4),
        ]
        result = calculate_weight_trend(entries)
        assert result.status == "ok"
        assert result.rolling_7d_kg is not None
        assert result.weekly_delta_kg is not None

    def test_rolling_average_correct_for_simple_window(self):
        """With 3 equal weights the rolling avg equals that weight."""
        entries = [
            WeightPoint("2026-10-01", 60.0),
            WeightPoint("2026-10-02", 60.0),
            WeightPoint("2026-10-03", 60.0),
        ]
        result = calculate_weight_trend(entries)
        assert result.rolling_7d_kg == 60.0
        assert result.weekly_delta_kg == 0.0

    def test_entries_sorted_ascending(self):
        """Out-of-order entries should be sorted before processing."""
        entries = [
            WeightPoint("2026-10-03", 56.0),
            WeightPoint("2026-10-01", 55.0),
            WeightPoint("2026-10-02", 55.5),
        ]
        result = calculate_weight_trend(entries)
        assert result.status == "ok"
        assert result.entries[0]["logged_date"] == "2026-10-01"

    def test_chart_entries_include_rolling_avg(self):
        entries = [
            WeightPoint(f"2026-10-0{i+1}", 55.0 + i * 0.1)
            for i in range(5)
        ]
        result = calculate_weight_trend(entries)
        for entry in result.entries:
            assert "rolling_7d_kg" in entry
            assert "weight_kg" in entry
            assert "logged_date" in entry


# =============================================================================
# 6. API Endpoint Smoke Tests
# =============================================================================

class TestTrackingAPIEndpoints:

    def test_get_foods_no_auth_returns_200(self):
        """Food catalog is public — no auth required."""
        resp = client.get("/api/v1/tracking/foods")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        assert len(data["data"]) >= 22

    def test_get_foods_search_query(self):
        resp = client.get("/api/v1/tracking/foods?query=roti")
        assert resp.status_code == 200
        results = resp.json()["data"]
        assert any("Roti" in r["name"] for r in results)

    def test_get_foods_category_filter(self):
        resp = client.get("/api/v1/tracking/foods?category=protein")
        assert resp.status_code == 200
        results = resp.json()["data"]
        assert all(r["category"] == "protein" for r in results)

    def test_nutrition_summary_requires_auth(self):
        resp = client.post("/api/v1/tracking/nutrition-summary", json={"entries": []})
        assert resp.status_code == 401

    def test_nutrition_summary_with_auth(self):
        payload = {
            "entries": [
                {
                    "food_name": "Chicken Breast",
                    "calories_kcal": 247.0,
                    "protein_g": 46.5,
                    "carbs_g": 0.0,
                    "fat_g": 5.5,
                    "quantity": 1.0,
                    "is_confirmed": True,
                    "provenance": "verified_reference",
                }
            ]
        }
        resp = client.post(
            "/api/v1/tracking/nutrition-summary",
            json=payload,
            headers=TEST_AUTH_HEADERS,
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["confirmed_totals"]["protein_g"] == 46.5
        assert data["unconfirmed_estimates"]["entry_count"] == 0

    def test_nutrition_summary_unconfirmed_excluded(self):
        payload = {
            "entries": [
                {
                    "food_name": "Confirmed Meal",
                    "calories_kcal": 200.0,
                    "protein_g": 20.0,
                    "carbs_g": 10.0,
                    "fat_g": 5.0,
                    "quantity": 1.0,
                    "is_confirmed": True,
                    "provenance": "verified_reference",
                },
                {
                    "food_name": "Photo Estimate",
                    "calories_kcal": 800.0,
                    "protein_g": 50.0,
                    "carbs_g": 80.0,
                    "fat_g": 30.0,
                    "quantity": 1.0,
                    "is_confirmed": False,   # <- unconfirmed
                    "provenance": "ai_estimated",
                },
            ]
        }
        resp = client.post(
            "/api/v1/tracking/nutrition-summary",
            json=payload,
            headers=TEST_AUTH_HEADERS,
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        # Confirmed totals must NOT include the photo estimate
        assert data["confirmed_totals"]["calories_kcal"] == 200.0
        assert data["confirmed_totals"]["protein_g"] == 20.0
        # Unconfirmed totals should capture it
        assert data["unconfirmed_estimates"]["calories_kcal"] == 800.0

    def test_running_pace_requires_auth(self):
        resp = client.post(
            "/api/v1/tracking/running-pace",
            json={"distance_km": 5.0, "duration_minutes": 27.5},
        )
        assert resp.status_code == 401

    def test_running_pace_5km_27_5min(self):
        resp = client.post(
            "/api/v1/tracking/running-pace",
            json={"distance_km": 5.0, "duration_minutes": 27.5},
            headers=TEST_AUTH_HEADERS,
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["pace_formatted"] == "5:30 /km"
        assert data["pace_decimal_min_per_km"] == 5.5

    def test_progression_suggestion_requires_auth(self):
        resp = client.post(
            "/api/v1/tracking/progression-suggestion",
            json={
                "exercise_name": "Bench Press",
                "previous_sets": [],
                "equipment_confirmed": True,
                "readiness_status": "Prime",
            },
        )
        assert resp.status_code == 401

    def test_progression_suggestion_blocks_unconfirmed_equipment(self):
        resp = client.post(
            "/api/v1/tracking/progression-suggestion",
            json={
                "exercise_name": "Bench Press",
                "previous_sets": [{"reps": 10, "load_kg": 60.0, "rpe": 7.5}],
                "equipment_max_load_kg": 70.0,
                "equipment_min_increment_kg": 2.5,
                "equipment_confirmed": False,
                "readiness_status": "Prime",
                "target_reps_max": 10,
            },
            headers=TEST_AUTH_HEADERS,
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["action"] == "confirm_equipment_first"

    def test_weight_trend_requires_auth(self):
        resp = client.post("/api/v1/tracking/weight-trend", json={"entries": []})
        assert resp.status_code == 401

    def test_weight_trend_insufficient_data(self):
        resp = client.post(
            "/api/v1/tracking/weight-trend",
            json={"entries": [{"logged_date": "2026-10-01", "weight_kg": 55.0}]},
            headers=TEST_AUTH_HEADERS,
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "insufficient_data"

    def test_weight_trend_three_entries_ok(self):
        resp = client.post(
            "/api/v1/tracking/weight-trend",
            json={
                "entries": [
                    {"logged_date": "2026-10-01", "weight_kg": 55.0},
                    {"logged_date": "2026-10-02", "weight_kg": 55.2},
                    {"logged_date": "2026-10-03", "weight_kg": 55.4},
                ]
            },
            headers=TEST_AUTH_HEADERS,
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "ok"
