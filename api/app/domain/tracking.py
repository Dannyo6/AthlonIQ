"""AthlonIQ Phase 2 — Deterministic Tracking Domain

Provides:
  - Indian & Athletic Food Reference Catalog (22+ verified staples)
  - calculate_daily_nutrition_totals  (confirmed vs unconfirmed guardrail)
  - calculate_running_pace            (validated MM:SS /km formatter)
  - evaluate_progression_suggestion   (rules-based home-gym overload engine)
  - calculate_weight_trend            (7-day rolling average with data gate)

Zero fabricated numbers. All math is explicit, auditable, and unit-tested.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# =============================================================================
# Indian & Athletic Food Reference Catalog
# 22+ verified staple items with per-serving macros.
# provenance = "verified_reference" for all entries.
# Macro values sourced from ICMR Nutritive Value of Indian Foods (2017)
# and standard sports nutrition references.
# =============================================================================

INDIAN_FOOD_CATALOG: List[Dict[str, Any]] = [
    # ── Staples / Carbohydrate Sources ──────────────────────────────────────
    {
        "id": "rice-steamed",
        "name": "Cooked Steamed Rice",
        "category": "staple",
        "serving_label": "1 katori (150g)",
        "serving_weight_g": 150.0,
        "calories_kcal": 195.0,
        "protein_g": 4.0,
        "carbs_g": 43.0,
        "fat_g": 0.5,
        "provenance": "verified_reference",
    },
    {
        "id": "roti-wheat",
        "name": "Whole Wheat Roti",
        "category": "staple",
        "serving_label": "1 medium (40g)",
        "serving_weight_g": 40.0,
        "calories_kcal": 104.0,
        "protein_g": 3.5,
        "carbs_g": 20.0,
        "fat_g": 1.5,
        "provenance": "verified_reference",
    },
    {
        "id": "idli",
        "name": "Idli",
        "category": "staple",
        "serving_label": "2 pieces (120g)",
        "serving_weight_g": 120.0,
        "calories_kcal": 132.0,
        "protein_g": 4.0,
        "carbs_g": 28.0,
        "fat_g": 0.5,
        "provenance": "verified_reference",
    },
    {
        "id": "dosa-plain",
        "name": "Plain Dosa",
        "category": "staple",
        "serving_label": "1 medium (100g)",
        "serving_weight_g": 100.0,
        "calories_kcal": 168.0,
        "protein_g": 3.5,
        "carbs_g": 26.0,
        "fat_g": 5.5,
        "provenance": "verified_reference",
    },
    {
        "id": "dosa-masala",
        "name": "Masala Dosa",
        "category": "staple",
        "serving_label": "1 standard (180g)",
        "serving_weight_g": 180.0,
        "calories_kcal": 302.0,
        "protein_g": 6.0,
        "carbs_g": 45.0,
        "fat_g": 10.0,
        "provenance": "verified_reference",
    },
    {
        "id": "oats-rolled",
        "name": "Rolled Oats",
        "category": "staple",
        "serving_label": "50g raw",
        "serving_weight_g": 50.0,
        "calories_kcal": 190.0,
        "protein_g": 6.5,
        "carbs_g": 33.5,
        "fat_g": 3.5,
        "provenance": "verified_reference",
    },
    {
        "id": "banana",
        "name": "Banana",
        "category": "fruit",
        "serving_label": "1 medium (118g)",
        "serving_weight_g": 118.0,
        "calories_kcal": 105.0,
        "protein_g": 1.3,
        "carbs_g": 27.0,
        "fat_g": 0.4,
        "provenance": "verified_reference",
    },
    # ── Protein Sources — Non-Vegetarian ────────────────────────────────────
    {
        "id": "egg-whole-boiled",
        "name": "Whole Boiled Egg",
        "category": "protein",
        "serving_label": "1 large (50g)",
        "serving_weight_g": 50.0,
        "calories_kcal": 78.0,
        "protein_g": 6.3,
        "carbs_g": 0.6,
        "fat_g": 5.3,
        "provenance": "verified_reference",
    },
    {
        "id": "egg-whites",
        "name": "Egg Whites",
        "category": "protein",
        "serving_label": "3 large whites (100g)",
        "serving_weight_g": 100.0,
        "calories_kcal": 52.0,
        "protein_g": 10.9,
        "carbs_g": 0.7,
        "fat_g": 0.2,
        "provenance": "verified_reference",
    },
    {
        "id": "egg-bhurji",
        "name": "Egg Bhurji / Omelette",
        "category": "protein",
        "serving_label": "2 eggs + 1 tsp oil (120g)",
        "serving_weight_g": 120.0,
        "calories_kcal": 196.0,
        "protein_g": 12.6,
        "carbs_g": 1.5,
        "fat_g": 15.5,
        "provenance": "verified_reference",
    },
    {
        "id": "chicken-breast-cooked",
        "name": "Grilled Chicken Breast",
        "category": "protein",
        "serving_label": "150g cooked",
        "serving_weight_g": 150.0,
        "calories_kcal": 247.0,
        "protein_g": 46.5,
        "carbs_g": 0.0,
        "fat_g": 5.5,
        "provenance": "verified_reference",
    },
    {
        "id": "chicken-curry",
        "name": "Chicken Curry (Home-Style)",
        "category": "protein",
        "serving_label": "1 bowl (200g)",
        "serving_weight_g": 200.0,
        "calories_kcal": 290.0,
        "protein_g": 28.0,
        "carbs_g": 6.0,
        "fat_g": 17.0,
        "provenance": "verified_reference",
    },
    {
        "id": "fish-rohu-cooked",
        "name": "Grilled Fish (Rohu / Surmai)",
        "category": "protein",
        "serving_label": "150g cooked",
        "serving_weight_g": 150.0,
        "calories_kcal": 193.0,
        "protein_g": 31.5,
        "carbs_g": 0.0,
        "fat_g": 7.0,
        "provenance": "verified_reference",
    },
    # ── Protein Sources — Vegetarian ─────────────────────────────────────────
    {
        "id": "paneer-raw",
        "name": "Paneer (Raw / Cubed)",
        "category": "protein",
        "serving_label": "100g",
        "serving_weight_g": 100.0,
        "calories_kcal": 265.0,
        "protein_g": 18.3,
        "carbs_g": 1.2,
        "fat_g": 20.8,
        "provenance": "verified_reference",
    },
    {
        "id": "paneer-bhurji",
        "name": "Paneer Bhurji",
        "category": "protein",
        "serving_label": "150g",
        "serving_weight_g": 150.0,
        "calories_kcal": 340.0,
        "protein_g": 22.0,
        "carbs_g": 4.5,
        "fat_g": 26.0,
        "provenance": "verified_reference",
    },
    {
        "id": "dal-tadka",
        "name": "Toor / Moong Dal Tadka",
        "category": "protein",
        "serving_label": "1 katori (150g)",
        "serving_weight_g": 150.0,
        "calories_kcal": 150.0,
        "protein_g": 9.0,
        "carbs_g": 23.0,
        "fat_g": 3.5,
        "provenance": "verified_reference",
    },
    {
        "id": "whey-protein",
        "name": "Whey Protein (Isolate / Concentrate)",
        "category": "supplement",
        "serving_label": "1 scoop (30g)",
        "serving_weight_g": 30.0,
        "calories_kcal": 120.0,
        "protein_g": 24.0,
        "carbs_g": 3.0,
        "fat_g": 1.5,
        "provenance": "verified_reference",
    },
    {
        "id": "curd-dahi",
        "name": "Curd / Dahi",
        "category": "protein",
        "serving_label": "1 katori (150g)",
        "serving_weight_g": 150.0,
        "calories_kcal": 84.0,
        "protein_g": 7.5,
        "carbs_g": 6.0,
        "fat_g": 3.0,
        "provenance": "verified_reference",
    },
    {
        "id": "toned-milk",
        "name": "Toned Milk",
        "category": "dairy",
        "serving_label": "250ml glass",
        "serving_weight_g": 250.0,
        "calories_kcal": 120.0,
        "protein_g": 8.8,
        "carbs_g": 12.0,
        "fat_g": 3.0,
        "provenance": "verified_reference",
    },
    # ── Fats / Oils / Snacks ─────────────────────────────────────────────────
    {
        "id": "peanut-butter",
        "name": "Peanut Butter",
        "category": "fats",
        "serving_label": "1 tbsp (16g)",
        "serving_weight_g": 16.0,
        "calories_kcal": 94.0,
        "protein_g": 4.0,
        "carbs_g": 3.5,
        "fat_g": 8.0,
        "provenance": "verified_reference",
    },
    {
        "id": "roasted-chana",
        "name": "Roasted Chana / Peanuts",
        "category": "snack",
        "serving_label": "30g",
        "serving_weight_g": 30.0,
        "calories_kcal": 113.0,
        "protein_g": 5.5,
        "carbs_g": 14.0,
        "fat_g": 3.5,
        "provenance": "verified_reference",
    },
    {
        "id": "ghee-tsp",
        "name": "Ghee",
        "category": "fats",
        "serving_label": "1 tsp (5g)",
        "serving_weight_g": 5.0,
        "calories_kcal": 45.0,
        "protein_g": 0.0,
        "carbs_g": 0.0,
        "fat_g": 5.0,
        "provenance": "verified_reference",
    },
    {
        "id": "cooking-oil-tbsp",
        "name": "Cooking Oil",
        "category": "fats",
        "serving_label": "1 tbsp (14g)",
        "serving_weight_g": 14.0,
        "calories_kcal": 124.0,
        "protein_g": 0.0,
        "carbs_g": 0.0,
        "fat_g": 14.0,
        "provenance": "verified_reference",
    },
]


# =============================================================================
# Pydantic-free input dataclasses (pure Python for unit-test portability)
# =============================================================================

@dataclass
class FoodEntryInput:
    food_name: str
    calories_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    quantity: float = 1.0
    is_confirmed: bool = True
    provenance: str = "verified_reference"


@dataclass
class MacroTotals:
    calories_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    entry_count: int


@dataclass
class DailyNutritionSummary:
    confirmed_totals: MacroTotals
    unconfirmed_estimates: MacroTotals


@dataclass
class PaceResult:
    distance_km: float
    duration_minutes: float
    pace_decimal: float         # e.g. 5.5 min/km
    pace_formatted: str         # e.g. "5:30 /km"


@dataclass
class PreviousSet:
    reps: int
    load_kg: float
    rpe: Optional[float] = None
    is_bodyweight: bool = False


@dataclass
class ProgressionSuggestion:
    action: str                     # "increase_load" | "increase_reps_or_tempo" |
                                    # "maintain_or_deload" | "confirm_equipment_first"
    explanation: str
    new_load_kg: Optional[float] = None
    new_reps_suggestion: Optional[str] = None
    requires_user_confirmation: bool = True
    provenance: str = "rules_based_progression"


@dataclass
class WeightPoint:
    logged_date: str    # ISO date string "YYYY-MM-DD"
    weight_kg: float


@dataclass
class WeightTrendSummary:
    status: str                                 # "insufficient_data" | "ok"
    entries: List[Dict[str, Any]] = field(default_factory=list)
    rolling_7d_kg: Optional[float] = None
    weekly_delta_kg: Optional[float] = None
    explanation: str = ""


# =============================================================================
# 1. calculate_daily_nutrition_totals
# =============================================================================

def calculate_daily_nutrition_totals(
    entries: List[FoodEntryInput],
) -> DailyNutritionSummary:
    """Sum macros per entry, separating confirmed from unconfirmed estimates.

    CRITICAL GUARDRAIL: is_confirmed=False items (e.g. Phase 3 photo estimates)
    are tabulated separately and NEVER included in confirmed_totals.
    Multiplies unit macros by quantity and rounds each total to 1 decimal place.
    """

    def _blank() -> MacroTotals:
        return MacroTotals(
            calories_kcal=0.0, protein_g=0.0, carbs_g=0.0, fat_g=0.0, entry_count=0
        )

    confirmed = _blank()
    unconfirmed = _blank()

    for entry in entries:
        q = max(0.0, entry.quantity)
        cal = round(entry.calories_kcal * q, 1)
        pro = round(entry.protein_g * q, 1)
        cho = round(entry.carbs_g * q, 1)
        fat = round(entry.fat_g * q, 1)

        if entry.is_confirmed:
            confirmed.calories_kcal = round(confirmed.calories_kcal + cal, 1)
            confirmed.protein_g = round(confirmed.protein_g + pro, 1)
            confirmed.carbs_g = round(confirmed.carbs_g + cho, 1)
            confirmed.fat_g = round(confirmed.fat_g + fat, 1)
            confirmed.entry_count += 1
        else:
            unconfirmed.calories_kcal = round(unconfirmed.calories_kcal + cal, 1)
            unconfirmed.protein_g = round(unconfirmed.protein_g + pro, 1)
            unconfirmed.carbs_g = round(unconfirmed.carbs_g + cho, 1)
            unconfirmed.fat_g = round(unconfirmed.fat_g + fat, 1)
            unconfirmed.entry_count += 1

    return DailyNutritionSummary(
        confirmed_totals=confirmed,
        unconfirmed_estimates=unconfirmed,
    )


# =============================================================================
# 2. calculate_running_pace
# =============================================================================

def calculate_running_pace(
    distance_km: float,
    duration_minutes: float,
) -> PaceResult:
    """Calculate running pace from distance and duration.

    Validates both inputs are strictly positive, then computes:
      pace_decimal  = round(duration_minutes / distance_km, 2)   e.g. 5.5
      pace_formatted = "MM:SS /km"                                e.g. "5:30 /km"

    Example: 5.0 km in 27.5 min → 5.5 min/km → "5:30 /km"
    """
    if distance_km <= 0:
        raise ValueError(f"distance_km must be strictly positive, got {distance_km}")
    if duration_minutes <= 0:
        raise ValueError(f"duration_minutes must be strictly positive, got {duration_minutes}")

    pace_decimal = round(duration_minutes / distance_km, 2)

    # Convert decimal minutes to MM:SS
    minutes_part = int(pace_decimal)
    seconds_part = round((pace_decimal - minutes_part) * 60)
    # Guard against floating-point spill (e.g. 59.999... → 60)
    if seconds_part == 60:
        minutes_part += 1
        seconds_part = 0

    pace_formatted = f"{minutes_part}:{seconds_part:02d} /km"

    return PaceResult(
        distance_km=distance_km,
        duration_minutes=duration_minutes,
        pace_decimal=pace_decimal,
        pace_formatted=pace_formatted,
    )


# =============================================================================
# 3. evaluate_progression_suggestion
# =============================================================================

def evaluate_progression_suggestion(
    exercise_name: str,
    previous_sets: List[PreviousSet],
    equipment_max_load_kg: float,
    equipment_min_increment_kg: float,
    equipment_confirmed: bool,
    readiness_status: str,          # "Prime" | "Moderate" | "Recover"
    target_reps_max: int,
) -> ProgressionSuggestion:
    """Rules-based progression engine for home-gym constrained training.

    Rules evaluated in priority order:
    1. If equipment_confirmed is False → return confirm_equipment_first.
    2. If readiness_status == "Recover" OR avg RPE >= 9.5 → maintain_or_deload.
    3. If all sets hit >= target_reps_max with avg RPE <= 8.5:
       a. If current_load + increment <= equipment_max → increase_load.
       b. If at equipment cap OR is_bodyweight → increase_reps_or_tempo.
    4. Default → maintain load (no change warranted yet).

    requires_user_confirmation is always True — the user must explicitly
    apply any suggestion; auto-mutation of weights is strictly forbidden.
    """
    if not equipment_confirmed:
        return ProgressionSuggestion(
            action="confirm_equipment_first",
            explanation=(
                f"Home gym equipment must be verified in Profile → Equipment before "
                f"load progressions can be prescribed for '{exercise_name}'. "
                "Confirm your 70 kg free-weight setup and all equipment max loads "
                "to unlock equipment-specific auto-regulation."
            ),
            requires_user_confirmation=True,
        )

    if readiness_status == "Recover":
        return ProgressionSuggestion(
            action="maintain_or_deload",
            explanation=(
                f"Recovery deficit detected (status=Recover). "
                f"Hold current load for '{exercise_name}' or reduce by 5–10% "
                "to allow systemic fatigue to resolve before progressing."
            ),
            requires_user_confirmation=True,
        )

    # Compute average RPE from sets that have an explicit value
    rpe_values = [s.rpe for s in previous_sets if s.rpe is not None]
    avg_rpe = sum(rpe_values) / len(rpe_values) if rpe_values else 0.0

    if avg_rpe >= 9.5:
        return ProgressionSuggestion(
            action="maintain_or_deload",
            explanation=(
                f"Average RPE {avg_rpe:.1f} >= 9.5 for '{exercise_name}'. "
                "High proximity to failure across all sets signals accumulated fatigue. "
                "Maintain current load or reduce by 5–10% this session."
            ),
            requires_user_confirmation=True,
        )

    if not previous_sets:
        return ProgressionSuggestion(
            action="maintain_or_deload",
            explanation="No previous set data provided. Maintain current load and log sets to enable progression tracking.",
            requires_user_confirmation=True,
        )

    # Determine current load and bodyweight status from the last set
    current_load_kg = previous_sets[-1].load_kg
    is_bodyweight = previous_sets[-1].is_bodyweight

    # Check if all sets hit >= target_reps_max
    all_hit_target = all(s.reps >= target_reps_max for s in previous_sets)

    if all_hit_target and avg_rpe <= 8.5:
        if is_bodyweight or current_load_kg >= equipment_max_load_kg:
            return ProgressionSuggestion(
                action="increase_reps_or_tempo",
                explanation=(
                    f"All sets hit ≥ {target_reps_max} reps with avg RPE {avg_rpe:.1f} for '{exercise_name}'. "
                    + (
                        f"Current load ({current_load_kg:.1f} kg) is at or above the "
                        f"{equipment_max_load_kg:.0f} kg home-gym cap. "
                        if not is_bodyweight
                        else "Bodyweight movement — no external load to add. "
                    )
                    + "Suggested: add +1–2 reps per set OR apply a slower 3-second eccentric to increase time-under-tension."
                ),
                new_reps_suggestion=f"+1 to +2 reps per set, or 3s eccentric",
                requires_user_confirmation=True,
            )
        else:
            new_load = round(current_load_kg + equipment_min_increment_kg, 2)
            if new_load > equipment_max_load_kg:
                new_load = equipment_max_load_kg
            return ProgressionSuggestion(
                action="increase_load",
                explanation=(
                    f"All sets hit ≥ {target_reps_max} reps with avg RPE {avg_rpe:.1f} for '{exercise_name}'. "
                    f"Suggested load increase: {current_load_kg:.1f} kg → {new_load:.1f} kg "
                    f"(+{equipment_min_increment_kg:.2f} kg minimum increment). "
                    "Apply next session after user confirmation."
                ),
                new_load_kg=new_load,
                requires_user_confirmation=True,
            )

    # Default: maintain
    return ProgressionSuggestion(
        action="maintain",
        explanation=(
            f"Not all sets for '{exercise_name}' have reached ≥ {target_reps_max} reps "
            f"(avg RPE: {avg_rpe:.1f}). Continue at current load and aim to complete "
            "all target sets before progressing."
        ),
        requires_user_confirmation=True,
    )


# =============================================================================
# 4. calculate_weight_trend
# =============================================================================

def calculate_weight_trend(
    entries: List[WeightPoint],
) -> WeightTrendSummary:
    """Compute 7-day rolling average and weekly delta from sorted weigh-ins.

    Insufficient data gate: < 3 entries returns status='insufficient_data'
    with a clear explanation that single-day fluctuations reflect water and
    glycogen, not tissue change.

    For >= 3 entries, sorts ascending by date and computes:
      - rolling_7d_kg: 7-day rolling mean of the most recent window
      - weekly_delta_kg: difference between first and last rolling-7d values
        across available windows (or simple first-to-last if < 7 entries)
    """
    if len(entries) < 3:
        return WeightTrendSummary(
            status="insufficient_data",
            rolling_7d_kg=None,
            weekly_delta_kg=None,
            explanation=(
                f"At least 3 weigh-ins are required to establish a reliable rolling weight trend. "
                f"Currently recorded: {len(entries)} of 3 minimum. "
                "Single-day fluctuations reflect water retention, glycogen loading, and bowel content — "
                "not adipose or muscle tissue change."
            ),
        )

    # Sort by date string ascending (ISO format sorts lexicographically)
    sorted_entries = sorted(entries, key=lambda e: e.logged_date)
    weights = [e.weight_kg for e in sorted_entries]
    dates = [e.logged_date for e in sorted_entries]

    # Compute rolling 7-day averages at each position
    rolling_avgs: List[Optional[float]] = []
    for i, _ in enumerate(sorted_entries):
        window_start = max(0, i - 6)  # up to 7 days including today
        window = weights[window_start : i + 1]
        avg = round(sum(window) / len(window), 2)
        rolling_avgs.append(avg)

    latest_rolling = rolling_avgs[-1]

    # Weekly delta: compare first rolling avg to last rolling avg
    first_rolling = rolling_avgs[0]
    weekly_delta = round((latest_rolling or 0.0) - (first_rolling or 0.0), 2)

    # Build entries output for charting
    chart_entries = [
        {
            "logged_date": dates[i],
            "weight_kg": weights[i],
            "rolling_7d_kg": rolling_avgs[i],
        }
        for i in range(len(sorted_entries))
    ]

    return WeightTrendSummary(
        status="ok",
        entries=chart_entries,
        rolling_7d_kg=latest_rolling,
        weekly_delta_kg=weekly_delta,
        explanation=(
            f"7-day rolling average: {latest_rolling:.2f} kg. "
            f"Trend since first entry: {'+' if weekly_delta >= 0 else ''}{weekly_delta:.2f} kg."
        ),
    )


# =============================================================================
# Utility: catalog search helper (used by the API layer)
# =============================================================================

def search_food_catalog(
    query: Optional[str] = None,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Search the Indian Food Catalog by name (case-insensitive) and/or category."""
    results = INDIAN_FOOD_CATALOG

    if category:
        results = [f for f in results if f["category"].lower() == category.lower()]

    if query:
        q = query.strip().lower()
        results = [
            f for f in results
            if q in f["name"].lower() or q in f["category"].lower()
        ]

    return results
