"""Core deterministic domain calculations for AthlonIQ OS."""

from typing import Dict


def calculate_one_rep_max_epley(weight_kg: float, reps: int) -> float:
    """Calculate estimated 1RM using the Epley formula: 1RM = weight * (1 + reps/30)."""
    if reps <= 0 or weight_kg <= 0:
        return 0.0
    if reps == 1:
        return round(weight_kg, 1)
    return round(weight_kg * (1.0 + reps / 30.0), 1)


def calculate_one_rep_max_brzycki(weight_kg: float, reps: int) -> float:
    """Calculate estimated 1RM using the Brzycki formula: 1RM = weight / (1.0278 - 0.0278 * reps)."""
    if reps <= 0 or weight_kg <= 0:
        return 0.0
    if reps == 1:
        return round(weight_kg, 1)
    if reps >= 37:
        return 0.0
    return round(weight_kg / (1.0278 - 0.0278 * reps), 1)


def calculate_readiness_score(
    sleep_quality_score: int,
    sleep_duration_hours: float,
    hrv_rmssd_ms: float,
    hrv_baseline_ms: float = 50.0,
    soreness_score: int = 3,
) -> int:
    """Calculate composite daily athlete readiness score (0-100).

    Weighted factors:
    - Sleep Quality & Duration: 40%
    - HRV vs Baseline Delta: 35%
    - Subjective Muscle Soreness (inverted): 25%
    """
    # Sleep factor (0-100)
    sleep_dur_score = min(100.0, (sleep_duration_hours / 8.0) * 100.0)
    sleep_component = (sleep_quality_score * 0.5) + (sleep_dur_score * 0.5)

    # HRV factor (0-100)
    if hrv_baseline_ms > 0:
        hrv_ratio = hrv_rmssd_ms / hrv_baseline_ms
        hrv_component = min(100.0, max(0.0, hrv_ratio * 75.0))
    else:
        hrv_component = 70.0

    # Soreness factor (1 = fresh -> 100%, 10 = crippled -> 10%)
    soreness_clamped = max(1, min(10, soreness_score))
    soreness_component = (11 - soreness_clamped) * 10.0

    readiness = (sleep_component * 0.40) + (hrv_component * 0.35) + (soreness_component * 0.25)
    return int(round(max(0.0, min(100.0, readiness))))


def calculate_macro_split(
    weight_kg: float,
    target_calories: int,
    protein_per_kg: float = 2.0,
    fat_pct_of_calories: float = 0.25,
) -> Dict[str, int]:
    """Calculate daily macronutrient targets in grams based on bodyweight and caloric goal."""
    protein_g = int(round(weight_kg * protein_per_kg))
    protein_cals = protein_g * 4

    fat_cals = target_calories * fat_pct_of_calories
    fat_g = int(round(fat_cals / 9.0))

    carbs_cals = max(0.0, target_calories - (protein_cals + (fat_g * 9)))
    carbs_g = int(round(carbs_cals / 4.0))

    return {
        "calories": target_calories,
        "protein_g": protein_g,
        "carbs_g": carbs_g,
        "fat_g": fat_g,
    }
