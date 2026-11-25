"""Cross-platform golden fixture validation for AthlonIQ deterministic domain calculations.

Validates that Python implementations match tests/fixtures/calculations-golden.json
identically to the TypeScript/Vitest implementations in web/src/test/calculations-golden.test.ts.
"""

import json
from pathlib import Path
import pytest

from app.domain.performance import (
    calculate_bmi,
    calculate_one_rep_max_epley,
    calculate_protein_reference,
)
from app.domain.tracking import (
    calculate_running_pace,
    calculate_weight_trend,
    calculate_daily_nutrition_totals,
    FoodEntryInput,
    WeightPoint,
)

FIXTURES_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "tests"
    / "fixtures"
    / "calculations-golden.json"
)

with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
    GOLDEN = json.load(f)


@pytest.mark.parametrize("case", GOLDEN["bmi"], ids=lambda c: c["description"])
def test_golden_bmi(case: dict) -> None:
    """Verify BMI calculation and classification against shared golden fixtures."""
    result = calculate_bmi(
        weight_kg=case["weight_kg"],
        height_cm=case["height_cm"],
    )
    assert result["bmi"] == case["expected_bmi"]
    assert result["category"] == case["expected_category"]
    assert result["provenance"] == "calculated_estimate"


@pytest.mark.parametrize("case", GOLDEN["protein_band"], ids=lambda c: c["description"])
def test_golden_protein_band(case: dict) -> None:
    """Verify protein intake reference band against shared golden fixtures."""
    result = calculate_protein_reference(
        weight_kg=case["weight_kg"],
        custom_target_g=case["custom_target_g"],
    )
    assert result["protein_min_g"] == case["expected_min_g"]
    assert result["protein_max_g"] == case["expected_max_g"]
    assert result["protein_target_g"] == case["expected_target_g"]
    assert result["provenance"] == case["expected_provenance"]


@pytest.mark.parametrize("case", GOLDEN["weight_trend"], ids=lambda c: c["description"])
def test_golden_weight_trend(case: dict) -> None:
    """Verify rolling 7-day weight trend against shared golden fixtures."""
    points = [
        WeightPoint(logged_date=e["logged_date"], weight_kg=e["weight_kg"])
        for e in case["entries"]
    ]
    summary = calculate_weight_trend(points)

    assert summary.status == case["expected_status"]
    assert summary.rolling_7d_kg == case["expected_rolling_7d_kg"]
    assert summary.weekly_delta_kg == case["expected_weekly_delta_kg"]


@pytest.mark.parametrize("case", GOLDEN["pace"], ids=lambda c: c["description"])
def test_golden_pace(case: dict) -> None:
    """Verify running pace decimal and MM:SS formatting against shared golden fixtures."""
    result = calculate_running_pace(
        distance_km=case["distance_km"],
        duration_minutes=case["duration_minutes"],
    )
    assert result.pace_decimal == case["expected_pace_decimal"]
    assert result.pace_formatted == case["expected_pace_formatted"]


@pytest.mark.parametrize(
    "case", GOLDEN["nutrition_totals"], ids=lambda c: c["description"]
)
def test_golden_nutrition_totals(case: dict) -> None:
    """Verify daily nutrition totals with confirmed/unconfirmed separation against shared golden fixtures."""
    entries = [
        FoodEntryInput(
            food_name=e["name"],
            calories_kcal=e["calories_kcal"],
            protein_g=e["protein_g"],
            carbs_g=e["carbs_g"],
            fat_g=e["fat_g"],
            quantity=e["quantity"],
            is_confirmed=e["is_confirmed"],
        )
        for e in case["entries"]
    ]
    summary = calculate_daily_nutrition_totals(entries)

    exp_conf = case["expected_confirmed"]
    assert summary.confirmed_totals.calories_kcal == exp_conf["calories_kcal"]
    assert summary.confirmed_totals.protein_g == exp_conf["protein_g"]
    assert summary.confirmed_totals.carbs_g == exp_conf["carbs_g"]
    assert summary.confirmed_totals.fat_g == exp_conf["fat_g"]
    assert summary.confirmed_totals.entry_count == exp_conf["entry_count"]

    exp_unconf = case["expected_unconfirmed"]
    assert summary.unconfirmed_estimates.calories_kcal == exp_unconf["calories_kcal"]
    assert summary.unconfirmed_estimates.protein_g == exp_unconf["protein_g"]
    assert summary.unconfirmed_estimates.carbs_g == exp_unconf["carbs_g"]
    assert summary.unconfirmed_estimates.fat_g == exp_unconf["fat_g"]
    assert summary.unconfirmed_estimates.entry_count == exp_unconf["entry_count"]


@pytest.mark.parametrize(
    "case", GOLDEN["one_rep_max"], ids=lambda c: c["description"]
)
def test_golden_one_rep_max(case: dict) -> None:
    """Verify Epley 1RM rules (1 rep returns load; 30+ reps returns None) against shared golden fixtures."""
    result = calculate_one_rep_max_epley(
        weight_kg=case["weight_kg"],
        reps=case["reps"],
    )
    assert result == case["expected_estimated_1rm_kg"]
