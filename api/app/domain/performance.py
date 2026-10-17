"""Core deterministic domain calculations for AthlonIQ OS.

Enforces strictly deterministic math, auditable provenance, and rules-based readiness.
Zero fabricated or hardcoded wearable biometric telemetry.
"""

from typing import Any, Dict, List, Optional


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


def calculate_bmi(weight_kg: float, height_cm: float) -> Dict[str, Any]:
    """Calculate Body Mass Index (BMI) deterministically.

    For 55.0 kg and 173.0 cm: 55 / (1.73^2) = 18.376... -> 18.4 kg/m^2.
    """
    if height_cm <= 0 or weight_kg <= 0:
        raise ValueError("Weight and height must be strictly positive numbers.")

    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m**2), 1)

    if bmi < 18.5:
        category = "underweight"
    elif bmi < 25.0:
        category = "normal_weight"
    elif bmi < 30.0:
        category = "overweight"
    else:
        category = "obese"

    return {
        "bmi": bmi,
        "category": category,
        "provenance": "calculated_estimate",
        "disclaimer": "BMI is a population-level screening metric only and does not distinguish fat-free mass from adiposity.",
    }


def calculate_protein_reference(
    weight_kg: float,
    custom_target_g: Optional[int] = None,
) -> Dict[str, Any]:
    """Calculate evidence-based daily protein reference intake (1.6 - 2.2 g/kg).

    For 55.0 kg:
    - Minimum (1.6 g/kg): 88 g
    - Maximum (2.2 g/kg): 121 g
    - Default Target (2.0 g/kg): 110 g
    """
    if weight_kg <= 0:
        raise ValueError("Weight must be strictly positive.")

    protein_min_g = int(round(weight_kg * 1.6))
    protein_max_g = int(round(weight_kg * 2.2))

    if custom_target_g is not None:
        protein_target_g = max(protein_min_g, min(protein_max_g, custom_target_g))
        provenance = "user_confirmed"
    else:
        protein_target_g = int(round(weight_kg * 2.0))
        provenance = "provisional_default"

    return {
        "protein_min_g": protein_min_g,
        "protein_max_g": protein_max_g,
        "protein_target_g": protein_target_g,
        "unit": "g/day",
        "provenance": provenance,
        "rationale": "Evidence-based resistance training range (1.6–2.2 g/kg/day) for muscle protein synthesis and lean bulk accrual.",
    }


def calculate_initial_energy_estimate(
    weight_kg: float,
    height_cm: float,
    age: int,
    sex: Optional[str] = None,
    activity_multiplier: Optional[float] = None,
    primary_goal: str = "lean_bulk",
    onboarding_completed: bool = False,
    sleep_baseline_hours: Optional[float] = None,
    experience_level: Optional[str] = None,
    weekly_badminton_sessions: Optional[int] = None,
    weekly_running_sessions: Optional[int] = None,
) -> Dict[str, Any]:
    """Calculate initial daily energy balance and macronutrient distribution.

    Gated strictly by onboarding completion:
    - If onboarding_completed is False or essential biometrics/lifestyle baselines
      (sleep_baseline_hours, experience_level) are missing, caloric targets remain
      None with provenance = "awaiting_onboarding".
    - Once confirmed, calculates BMR via Mifflin-St Jeor, applies training activity
      multiplier, adds +250 kcal lean-bulk surplus, and outputs calibrated macros.
    """
    if not onboarding_completed or sleep_baseline_hours is None or experience_level is None:
        return {
            "estimated_kcal": None,
            "bmr_kcal": None,
            "tdee_kcal": None,
            "surplus_kcal": None,
            "provenance": "awaiting_onboarding",
            "macros": None,
            "reason": "Caloric targets are gated until onboarding biometrics, training split, and baseline sleep hours are confirmed.",
        }

    # Mifflin-St Jeor Resting Metabolic Rate (BMR)
    # Male: (10 * weight) + (6.25 * height) - (5 * age) + 5
    # Female: (10 * weight) + (6.25 * height) - (5 * age) - 161
    sex_assumed = False
    if sex and sex.lower() == "female":
        bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age) - 161.0
    elif sex and sex.lower() == "male":
        bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age) + 5.0
    else:
        # Sex omitted/unknown: default to male reference formula, explicitly noting the screening assumption
        bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age) + 5.0
        sex_assumed = True

    # Activity Multiplier determination
    # 5 days/wk resistance training + hybrid conditioning (badminton / running)
    if activity_multiplier and activity_multiplier >= 1.0:
        multiplier = activity_multiplier
    else:
        # Default active multiplier for 5 training days + hybrid sport/run sessions
        extra_sessions = (weekly_badminton_sessions or 0) + (weekly_running_sessions or 0)
        if extra_sessions >= 3:
            multiplier = 1.65  # Very active
        elif extra_sessions >= 1:
            multiplier = 1.55  # Moderately active
        else:
            multiplier = 1.45  # Standard 5-day lifting

    tdee = bmr * multiplier

    # Surplus for primary goal
    if primary_goal == "lean_bulk":
        surplus = 250  # Clean lean bulk accrual
    elif primary_goal in ("fat_loss", "cut"):
        surplus = -400
    else:
        surplus = 0

    target_kcal = int(round(tdee + surplus))

    # Deterministic Macro Distribution
    protein_info = calculate_protein_reference(weight_kg)
    protein_g = protein_info["protein_target_g"]
    protein_cals = protein_g * 4

    # 25% of energy from dietary fats for endocrine health
    fat_cals = target_kcal * 0.25
    fat_g = int(round(fat_cals / 9.0))

    # Remaining calories allocated to carbohydrates for glycogen replenishment
    carbs_cals = max(0.0, target_kcal - (protein_cals + (fat_g * 9)))
    carbs_g = int(round(carbs_cals / 4.0))

    return {
        "estimated_kcal": target_kcal,
        "bmr_kcal": int(round(bmr)),
        "tdee_kcal": int(round(tdee)),
        "surplus_kcal": surplus,
        "activity_multiplier": round(multiplier, 2),
        "sex_assumed": sex_assumed,
        "provenance": "calculated_estimate",
        "macros": {
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fat_g": fat_g,
        },
        "notes": (
            "Calibrated with Mifflin-St Jeor equation + 250 kcal lean-bulk surplus."
            + (" (Note: sex not specified; defaulted to male reference formula with screening assumption.)" if sex_assumed else "")
        ),
    }


def calculate_rules_readiness(
    sleep_hours: float,
    sleep_quality: int,
    soreness: int,
    fatigue: int,
    stress: Optional[int] = None,
) -> Dict[str, Any]:
    """Calculate daily readiness score (0-100) strictly from user-reported check-in inputs.

    No fabricated wearable telemetry (HRV, nocturnal pulse, sleep stages).
    All deductions and bonuses are mathematically explicit and auditable.
    """
    triggers: List[str] = []
    base_score = 70.0

    # 1. Sleep Duration Rules
    if sleep_hours >= 8.0:
        base_score += 15.0
        triggers.append(f"Optimal sleep duration ({sleep_hours:.1f}h >= 8h): +15")
    elif sleep_hours >= 7.0:
        base_score += 5.0
        triggers.append(f"Adequate sleep duration ({sleep_hours:.1f}h): +5")
    elif sleep_hours >= 6.0:
        base_score -= 10.0
        triggers.append(f"Suboptimal sleep duration ({sleep_hours:.1f}h < 7h): -10")
    else:
        base_score -= 25.0
        triggers.append(f"Sleep deficit warning ({sleep_hours:.1f}h < 6h): -25")

    # 2. Subjective Sleep Quality (1-5)
    quality_clamped = max(1, min(5, int(sleep_quality)))
    if quality_clamped == 5:
        base_score += 10.0
        triggers.append("Restorative sleep quality (5/5): +10")
    elif quality_clamped == 4:
        base_score += 5.0
        triggers.append("Good sleep quality (4/5): +5")
    elif quality_clamped == 3:
        triggers.append("Average sleep quality (3/5): 0")
    elif quality_clamped == 2:
        base_score -= 10.0
        triggers.append("Poor sleep quality (2/5): -10")
    else:
        base_score -= 20.0
        triggers.append("Severely disturbed sleep quality (1/5): -20")

    # 3. Muscle Soreness (1-5, where 1=Fresh, 5=Crippling)
    soreness_clamped = max(1, min(5, int(soreness)))
    if soreness_clamped == 1:
        base_score += 5.0
        triggers.append("Zero muscle soreness (1/5): +5")
    elif soreness_clamped == 2:
        triggers.append("Minimal muscle soreness (2/5): 0")
    elif soreness_clamped == 3:
        base_score -= 5.0
        triggers.append("Moderate muscle soreness (3/5): -5")
    elif soreness_clamped == 4:
        base_score -= 15.0
        triggers.append("Elevated muscle soreness (4/5): -15")
    else:
        base_score -= 25.0
        triggers.append("Severe muscle soreness / strain (5/5): -25")

    # 4. Systemic Fatigue (1-5, where 1=Energized, 5=Exhausted)
    fatigue_clamped = max(1, min(5, int(fatigue)))
    if fatigue_clamped == 1:
        base_score += 5.0
        triggers.append("Fully energized (1/5): +5")
    elif fatigue_clamped == 2:
        triggers.append("Normal fatigue baseline (2/5): 0")
    elif fatigue_clamped == 3:
        base_score -= 5.0
        triggers.append("Mild systemic fatigue (3/5): -5")
    elif fatigue_clamped == 4:
        base_score -= 15.0
        triggers.append("Elevated systemic fatigue (4/5): -15")
    else:
        base_score -= 25.0
        triggers.append("Severe systemic exhaustion (5/5): -25")

    # 5. Optional Life / Work Stress (1-5, where 1=Calm, 5=Severe)
    if stress is not None:
        stress_clamped = max(1, min(5, int(stress)))
        if stress_clamped == 1:
            base_score += 5.0
            triggers.append("Low life/work stress (1/5): +5")
        elif stress_clamped == 2:
            triggers.append("Baseline stress level (2/5): 0")
        elif stress_clamped == 3:
            base_score -= 5.0
            triggers.append("Moderate stress load (3/5): -5")
        elif stress_clamped == 4:
            base_score -= 10.0
            triggers.append("High mental stress (4/5): -10")
        else:
            base_score -= 15.0
            triggers.append("Extreme acute stress (5/5): -15")

    final_score = int(round(max(0.0, min(100.0, base_score))))

    if final_score >= 80:
        status = "Prime"
        guidance = "Physiological reserve is high. Green light for progressive overload or high-intensity conditioning."
    elif final_score >= 55:
        status = "Moderate"
        guidance = "Moderate readiness. Execute planned workout volume at target RPE, avoiding excessive failure sets."
    else:
        status = "Recover"
        guidance = "Recovery deficit detected. Prioritize active recovery, mobility, or reducing set volume by 30-50%."

    return {
        "readiness_score": final_score,
        "status": status,
        "guidance": guidance,
        "triggers": triggers,
        "provenance": "calculated_estimate",
    }


def calculate_readiness_score(
    sleep_quality_score: int,
    sleep_duration_hours: float,
    soreness_score: int = 2,
    fatigue_score: int = 2,
    stress_score: Optional[int] = None,
    **kwargs: Any,
) -> int:
    """Legacy backward-compatible wrapper delegating to deterministic rules engine."""
    # Map 1-100 quality score to 1-5
    quality_1_to_5 = max(1, min(5, int(round((sleep_quality_score / 100.0) * 4.0)) + 1))
    soreness_1_to_5 = max(1, min(5, int(round((soreness_score / 10.0) * 4.0)) + 1))
    res = calculate_rules_readiness(
        sleep_hours=sleep_duration_hours,
        sleep_quality=quality_1_to_5,
        soreness=soreness_1_to_5,
        fatigue=fatigue_score,
        stress=stress_score,
    )
    return res["readiness_score"]


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
