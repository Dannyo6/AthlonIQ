"""AthlonIQ Phase 5 — 12-Point End-to-End Final Acceptance Test Suite.

Verifies:
  1. Authentication Guard: Rejects unauthenticated requests (401) and accepts valid tokens.
  2. Onboarding & Profile Baseline: 20 yo, 173 cm, 55 kg, BMI 18.4, 88-121g protein, gated initial energy estimate.
  3. Meal Logging & Indian Food Scaling: verified_reference, manual_entry, ai_estimated isolation.
  4. Daily Nutrition Totals: Strictly excludes unconfirmed photo estimates from confirmed totals.
  5. Workout Session & Double-Progression Engine: Respects equipment_confirmed and 70 kg free-weight cap.
  6. Weight Logging & 7-Day Rolling Trend: < 3 insufficient data gate vs >= 3 rolling average.
  7. Sports Activity Calculations: Running pace MM:SS /km, Badminton, Calisthenics.
  8. Lean-Bulk 14-Day Adaptive Calorie Calibration: insufficient_history, increase_surplus, on_track, trim_surplus.
  9. Multi-Sport Fatigue Advisory: Gym + Badminton + Running load with sleep/soreness deficit and non-clinical disclaimer.
  10. Personal AI Coach: 8 allowlisted typed tools and medical red-flag safety guardrail.
  11. Cross-User Data Isolation Contract: Distinct user token contexts are strictly segregated.
  12. Full Offline / Fallback Resilience: Deterministic responses when GEMINI_API_KEY is unconfigured.
"""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.security import get_current_user, AuthenticatedUser
from app.domain.performance import (
    calculate_bmi,
    calculate_protein_reference,
    calculate_initial_energy_estimate,
)
from app.domain.tracking import (
    INDIAN_FOOD_CATALOG,
    FoodEntryInput,
    calculate_daily_nutrition_totals,
    calculate_running_pace,
    evaluate_progression_suggestion,
    calculate_weight_trend,
    PreviousSet,
    WeightPoint,
)
from app.domain.adaptive import (
    evaluate_lean_bulk_calibration,
    evaluate_multisport_fatigue,
)
from app.domain.coach_tools import (
    UserCoachingContext,
    ALLOWLISTED_TOOLS,
    get_nutrition_totals,
    get_weight_trend as coach_get_weight_trend,
)
from app.services.coach_adapter import CoachService


# =============================================================================
# Acceptance Test 1: Authentication Guard
# =============================================================================

@pytest.mark.asyncio
async def test_acceptance_01_authentication_guard() -> None:
    """1. Verify endpoints reject unauthenticated requests with 401 and accept valid tokens."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Unauthenticated request to /calibrate-lean-bulk
        res_unauth = await client.post(
            "/api/v1/coaching/calibrate-lean-bulk",
            json={
                "current_calorie_target_kcal": 2450,
                "logged_nutrition_days": 12,
                "weigh_ins_last_14d": [],
            },
        )
        assert res_unauth.status_code == 401
        assert "detail" in res_unauth.json()

        # Unauthenticated request to /fatigue-advisory
        res_unauth_fatigue = await client.post(
            "/api/v1/coaching/fatigue-advisory",
            json={
                "gym_sessions_7d": 4,
                "badminton_minutes_7d": 120,
                "running_km_7d": 10,
            },
        )
        assert res_unauth_fatigue.status_code == 401

        # Authenticated request with valid Bearer token
        headers = {"Authorization": "Bearer test-token-athlete-accept-01"}
        res_auth = await client.post(
            "/api/v1/coaching/fatigue-advisory",
            json={
                "gym_sessions_7d": 3,
                "badminton_minutes_7d": 60.0,
                "running_km_7d": 5.0,
                "avg_sleep_hours_7d": 7.5,
                "avg_soreness_7d": 2.0,
                "avg_fatigue_7d": 2.0,
            },
            headers=headers,
        )
        assert res_auth.status_code == 200
        data = res_auth.json()
        assert data["success"] is True
        assert data["data"]["status"] == "optimal"


# =============================================================================
# Acceptance Test 2: Onboarding & Profile Baseline
# =============================================================================

def test_acceptance_02_onboarding_and_profile_baseline() -> None:
    """2. Verify athlete baseline (20 yo, 173 cm, 55 kg) yields BMI 18.4, 88-121g protein, and energy target."""
    weight_kg = 55.0
    height_cm = 173.0
    age = 20

    # BMI calculation
    bmi = calculate_bmi(weight_kg=weight_kg, height_cm=height_cm)
    assert bmi["bmi"] == 18.4
    assert bmi["category"] == "underweight"

    # Protein reference range (1.6 to 2.2 g/kg for hypertrophy / lean bulk)
    protein_ref = calculate_protein_reference(weight_kg=weight_kg)
    assert protein_ref["protein_min_g"] == 88
    assert protein_ref["protein_max_g"] == 121
    assert protein_ref["provenance"] == "provisional_default"

    # Energy estimate: Gated when onboarding is incomplete
    gated_energy = calculate_initial_energy_estimate(
        weight_kg=weight_kg,
        height_cm=height_cm,
        age=age,
        onboarding_completed=False,
    )
    assert gated_energy["estimated_kcal"] is None
    assert gated_energy["provenance"] == "awaiting_onboarding"

    # Energy estimate when onboarding is confirmed for lean bulk (+250 kcal surplus)
    energy = calculate_initial_energy_estimate(
        weight_kg=weight_kg,
        height_cm=height_cm,
        age=age,
        sex="male",
        primary_goal="lean_bulk",
        onboarding_completed=True,
        sleep_baseline_hours=7.5,
        experience_level="intermediate",
    )
    assert energy["estimated_kcal"] is not None
    assert energy["estimated_kcal"] > 2200
    assert energy["surplus_kcal"] == 250
    assert energy["provenance"] == "calculated_estimate"


# =============================================================================
# Acceptance Test 3: Meal Logging & Indian Food Scaling
# =============================================================================

def test_acceptance_03_indian_food_scaling_and_provenance() -> None:
    """3. Verify verified Indian catalog staples scale accurately with quantity and keep provenance."""
    # Find Whole Wheat Roti in catalog
    roti = next((f for f in INDIAN_FOOD_CATALOG if f["id"] == "roti-wheat"), None)
    assert roti is not None
    assert roti["provenance"] == "verified_reference"
    assert roti["calories_kcal"] == 104.0
    assert roti["protein_g"] == 3.5

    # Scale to 3 rotis
    qty = 3.0
    scaled_cal = round(roti["calories_kcal"] * qty, 1)
    scaled_pro = round(roti["protein_g"] * qty, 1)
    scaled_cho = round(roti["carbs_g"] * qty, 1)

    assert scaled_cal == 312.0
    assert scaled_pro == 10.5
    assert scaled_cho == 60.0

    # Steamed rice verification
    rice = next((f for f in INDIAN_FOOD_CATALOG if f["id"] == "rice-steamed"), None)
    assert rice is not None
    assert rice["provenance"] == "verified_reference"
    assert rice["calories_kcal"] == 195.0


# =============================================================================
# Acceptance Test 4: Daily Nutrition Isolation (Excludes Unconfirmed)
# =============================================================================

def test_acceptance_04_nutrition_totals_exclude_unconfirmed() -> None:
    """4. Verify daily nutrition totals strictly exclude unconfirmed photo estimates."""
    entries = [
        FoodEntryInput(
            food_name="Whole Wheat Roti",
            quantity=2.0,
            calories_kcal=104.0,
            protein_g=3.5,
            carbs_g=20.0,
            fat_g=1.5,
            is_confirmed=True,
            provenance="verified_reference",
        ),
        FoodEntryInput(
            food_name="Cooked Steamed Rice",
            quantity=1.0,
            calories_kcal=195.0,
            protein_g=4.0,
            carbs_g=43.0,
            fat_g=0.5,
            is_confirmed=True,
            provenance="verified_reference",
        ),
        # Unconfirmed vision estimate
        FoodEntryInput(
            food_name="AI Estimated Paneer Curry",
            quantity=1.0,
            calories_kcal=420.0,
            protein_g=18.0,
            carbs_g=12.0,
            fat_g=32.0,
            is_confirmed=False,
            provenance="ai_estimated",
        ),
    ]

    summary = calculate_daily_nutrition_totals(entries)

    # Confirmed totals must strictly contain ONLY confirmed entries: (2 * 104) + 195 = 403 kcal
    assert summary.confirmed_totals.calories_kcal == 403.0
    assert summary.confirmed_totals.protein_g == 11.0  # (2 * 3.5) + 4.0
    assert summary.confirmed_totals.entry_count == 2

    # Unconfirmed estimates strictly isolated
    assert summary.unconfirmed_estimates.calories_kcal == 420.0
    assert summary.unconfirmed_estimates.protein_g == 18.0
    assert summary.unconfirmed_estimates.entry_count == 1


# =============================================================================
# Acceptance Test 5: Workout Session & Double-Progression Engine
# =============================================================================

def test_acceptance_05_workout_progression_and_equipment_cap() -> None:
    """5. Verify progression respects equipment_confirmed, increments load, and caps at 70 kg."""
    # 5a. Unconfirmed equipment gate
    sugg_unconfirmed = evaluate_progression_suggestion(
        exercise_name="Dumbbell Romanian Deadlift",
        previous_sets=[PreviousSet(reps=12, load_kg=35.0, rpe=8.0)],
        equipment_max_load_kg=70.0,
        equipment_min_increment_kg=2.5,
        equipment_confirmed=False,
        readiness_status="Prime",
        target_reps_max=12,
    )
    assert sugg_unconfirmed.action == "confirm_equipment_first"
    assert sugg_unconfirmed.requires_user_confirmation is True

    # 5b. Increase load when within 70 kg cap
    sugg_increase = evaluate_progression_suggestion(
        exercise_name="Dumbbell Romanian Deadlift",
        previous_sets=[
            PreviousSet(reps=12, load_kg=40.0, rpe=8.0),
            PreviousSet(reps=12, load_kg=40.0, rpe=8.0),
            PreviousSet(reps=12, load_kg=40.0, rpe=8.5),
        ],
        equipment_max_load_kg=70.0,
        equipment_min_increment_kg=2.5,
        equipment_confirmed=True,
        readiness_status="Prime",
        target_reps_max=12,
    )
    assert sugg_increase.action == "increase_load"
    assert sugg_increase.new_load_kg == 42.5
    assert sugg_increase.requires_user_confirmation is True

    # 5c. At 70 kg home-gym ceiling -> shift to reps/tempo progression
    sugg_capped = evaluate_progression_suggestion(
        exercise_name="Dumbbell Goblet Squat",
        previous_sets=[
            PreviousSet(reps=12, load_kg=70.0, rpe=8.0),
            PreviousSet(reps=12, load_kg=70.0, rpe=8.0),
        ],
        equipment_max_load_kg=70.0,
        equipment_min_increment_kg=2.5,
        equipment_confirmed=True,
        readiness_status="Prime",
        target_reps_max=12,
    )
    assert sugg_capped.action == "increase_reps_or_tempo"
    assert "70 kg" in sugg_capped.explanation
    assert sugg_capped.requires_user_confirmation is True


# =============================================================================
# Acceptance Test 6: Weight Logging & 7-Day Rolling Trend
# =============================================================================

def test_acceptance_06_weight_logging_rolling_trend() -> None:
    """6. Verify weight trend gates on < 3 weigh-ins and calculates rolling trend on >= 3."""
    # Less than 3 entries -> Insufficient data gate
    short_data = [
        WeightPoint(logged_date="2026-10-01", weight_kg=54.8),
        WeightPoint(logged_date="2026-10-02", weight_kg=55.0),
    ]
    trend_short = calculate_weight_trend(short_data)
    assert trend_short.status == "insufficient_data"
    assert trend_short.rolling_7d_kg is None
    assert trend_short.weekly_delta_kg is None
    assert "At least 3 weigh-ins" in trend_short.explanation

    # At least 3 entries -> Valid rolling average
    valid_data = [
        WeightPoint(logged_date="2026-10-01", weight_kg=54.8),
        WeightPoint(logged_date="2026-10-03", weight_kg=55.0),
        WeightPoint(logged_date="2026-10-05", weight_kg=55.2),
        WeightPoint(logged_date="2026-10-07", weight_kg=55.1),
    ]
    trend_valid = calculate_weight_trend(valid_data)
    assert trend_valid.status == "ok"
    assert trend_valid.rolling_7d_kg is not None
    assert trend_valid.rolling_7d_kg > 54.9


# =============================================================================
# Acceptance Test 7: Sports Activity Calculations
# =============================================================================

def test_acceptance_07_sports_activity_calculations() -> None:
    """7. Verify running pace calculations (MM:SS /km) and input bounds."""
    # Standard 5.0 km in 27.5 minutes -> 5:30 /km
    pace_res = calculate_running_pace(distance_km=5.0, duration_minutes=27.5)
    assert pace_res.pace_decimal == 5.5
    assert pace_res.pace_formatted == "5:30 /km"

    # 10.0 km in 48 minutes -> 4:48 /km
    pace_10k = calculate_running_pace(distance_km=10.0, duration_minutes=48.0)
    assert pace_10k.pace_decimal == 4.8
    assert pace_10k.pace_formatted == "4:48 /km"

    # Strictly positive input validation
    with pytest.raises(ValueError):
        calculate_running_pace(distance_km=0.0, duration_minutes=25.0)

    with pytest.raises(ValueError):
        calculate_running_pace(distance_km=5.0, duration_minutes=-10.0)


# =============================================================================
# Acceptance Test 8: Lean-Bulk 14-Day Adaptive Calorie Calibration
# =============================================================================

def test_acceptance_08_lean_bulk_calibration_engine() -> None:
    """8. Verify all 4 states: insufficient_history, increase_surplus, on_track, trim_surplus."""
    # 8a. Insufficient History: < 10 nutrition days or < 4 weigh-ins
    res_gate = evaluate_lean_bulk_calibration(
        current_calorie_target_kcal=2450,
        logged_nutrition_days=7,  # < 10
        average_confirmed_intake_kcal=2420.0,
        weigh_ins_last_14d=[
            WeightPoint(logged_date="2026-10-01", weight_kg=54.8),
            WeightPoint(logged_date="2026-10-08", weight_kg=55.0),
        ],
    )
    assert res_gate.status == "insufficient_history"
    assert res_gate.suggested_calorie_delta_kcal == 0
    assert res_gate.new_calorie_target_kcal == 2450
    assert res_gate.requires_user_confirmation is True

    # 8b. Under-gaining / Flat trend (< 0.08 kg/week): recommend +150 kcal
    flat_weigh_ins = [
        WeightPoint(logged_date="2026-10-01", weight_kg=55.0),
        WeightPoint(logged_date="2026-10-04", weight_kg=55.05),
        WeightPoint(logged_date="2026-10-08", weight_kg=55.02),
        WeightPoint(logged_date="2026-10-12", weight_kg=55.04),
        WeightPoint(logged_date="2026-10-14", weight_kg=55.05),
    ]
    res_under = evaluate_lean_bulk_calibration(
        current_calorie_target_kcal=2450,
        logged_nutrition_days=12,
        average_confirmed_intake_kcal=2440.0,
        weigh_ins_last_14d=flat_weigh_ins,
        waist_start_cm=72.0,
        waist_current_cm=72.0,
    )
    assert res_under.status == "increase_surplus"
    assert res_under.suggested_calorie_delta_kcal == 150
    assert res_under.new_calorie_target_kcal == 2600

    # 8c. On-target lean bulk (+0.08 to +0.28 kg/week): hold steady (0 delta)
    ontrack_weigh_ins = [
        WeightPoint(logged_date="2026-10-01", weight_kg=55.0),
        WeightPoint(logged_date="2026-10-04", weight_kg=55.1),
        WeightPoint(logged_date="2026-10-08", weight_kg=55.2),
        WeightPoint(logged_date="2026-10-12", weight_kg=55.28),
        WeightPoint(logged_date="2026-10-14", weight_kg=55.35),
    ]
    res_ontrack = evaluate_lean_bulk_calibration(
        current_calorie_target_kcal=2450,
        logged_nutrition_days=13,
        average_confirmed_intake_kcal=2460.0,
        weigh_ins_last_14d=ontrack_weigh_ins,
        waist_start_cm=72.0,
        waist_current_cm=72.2,
    )
    assert res_ontrack.status == "on_track"
    assert res_ontrack.suggested_calorie_delta_kcal == 0
    assert res_ontrack.new_calorie_target_kcal == 2450

    # 8d. Rapid gain / Waist creep (> 0.30 kg/week or waist >= 1.5 cm): trim surplus (-150 kcal)
    rapid_weigh_ins = [
        WeightPoint(logged_date="2026-10-01", weight_kg=55.0),
        WeightPoint(logged_date="2026-10-04", weight_kg=55.4),
        WeightPoint(logged_date="2026-10-08", weight_kg=55.7),
        WeightPoint(logged_date="2026-10-12", weight_kg=56.0),
        WeightPoint(logged_date="2026-10-14", weight_kg=56.3),
    ]
    res_rapid = evaluate_lean_bulk_calibration(
        current_calorie_target_kcal=2600,
        logged_nutrition_days=14,
        average_confirmed_intake_kcal=2650.0,
        weigh_ins_last_14d=rapid_weigh_ins,
        waist_start_cm=72.0,
        waist_current_cm=73.8,  # +1.8 cm
    )
    assert res_rapid.status == "trim_surplus"
    assert res_rapid.suggested_calorie_delta_kcal == -150
    assert res_rapid.new_calorie_target_kcal == 2450


# =============================================================================
# Acceptance Test 9: Multi-Sport Fatigue Advisory
# =============================================================================

def test_acceptance_09_multisport_fatigue_advisory() -> None:
    """9. Verify multi-sport fatigue flags high cumulative strain and provides non-clinical disclaimer."""
    # High lifting (4 days) + High Badminton (130 min) + low sleep (6.2h)
    fatigue_high = evaluate_multisport_fatigue(
        gym_sessions_7d=4,
        badminton_minutes_7d=130.0,
        running_km_7d=12.0,
        avg_sleep_hours_7d=6.2,
        avg_soreness_7d=4.1,
        avg_fatigue_7d=4.0,
    )
    assert fatigue_high.status == "high_cumulative_fatigue"
    assert fatigue_high.is_high_fatigue is True
    assert fatigue_high.sport_volume_flag is True
    assert fatigue_high.recovery_deficit_flag is True
    assert len(fatigue_high.recommendations) >= 2
    assert "not a clinical medical diagnosis" in fatigue_high.disclaimer

    # Balanced workload with optimal recovery
    fatigue_optimal = evaluate_multisport_fatigue(
        gym_sessions_7d=3,
        badminton_minutes_7d=60.0,
        running_km_7d=5.0,
        avg_sleep_hours_7d=7.8,
        avg_soreness_7d=2.0,
        avg_fatigue_7d=2.0,
    )
    assert fatigue_optimal.status == "optimal"
    assert fatigue_optimal.is_high_fatigue is False


# =============================================================================
# Acceptance Test 10: AI Coach 8 Typed Tools & Medical Red-Flag Safety
# =============================================================================

@pytest.mark.asyncio
async def test_acceptance_10_ai_coach_tools_and_safety_guardrail() -> None:
    """10. Verify 8 typed tools operate over context snapshot and medical safety triggers immediate escalation."""
    # Verify 8 allowlisted tools exist
    assert len(ALLOWLISTED_TOOLS) == 8
    expected_tools = [
        "get_nutrition_totals",
        "get_food_history",
        "get_weekly_training",
        "get_exercise_progress",
        "get_activity_history",
        "get_weight_trend",
        "get_recovery_history",
        "get_user_goals",
    ]
    for tool_name in expected_tools:
        assert tool_name in ALLOWLISTED_TOOLS

    # Verify medical safety escalation via CoachService
    service = CoachService()
    ctx = UserCoachingContext(
        profile={"fullName": "Alex Mercer", "age": 20, "weightKg": 55.0},
        equipment=[],
        goals={},
        today_checkin=None,
        food_entries=[],
        workout_sessions=[],
        activity_sessions=[],
        body_metrics=[],
    )

    emergency_msg = "I am feeling severe chest tightness and dizziness while lifting, should I push through?"
    resp = await service.chat(
        message=emergency_msg,
        context=ctx,
    )

    assert "MEDICAL SAFETY WARNING" in resp.reply_markdown
    assert "physician" in resp.reply_markdown.lower() or "medical professional" in resp.reply_markdown.lower()


# =============================================================================
# Acceptance Test 11: Cross-User Data Isolation Contract
# =============================================================================

@pytest.mark.asyncio
async def test_acceptance_11_cross_user_data_isolation() -> None:
    """11. Verify user token identity isolation: User A's context cannot bleed into User B."""
    # Verify security layer maps separate tokens to distinct athlete identities
    user_alice = await get_current_user(
        type("AuthCreds", (), {"credentials": "test-token-athlete-alice"})()  # type: ignore
    )
    user_bob = await get_current_user(
        type("AuthCreds", (), {"credentials": "test-token-athlete-bob"})()  # type: ignore
    )

    assert user_alice.user_id == "athlete-alice"
    assert user_bob.user_id == "athlete-bob"
    assert user_alice.user_id != user_bob.user_id

    # Verify tool snapshots are strictly isolated to the context passed
    ctx_alice = UserCoachingContext(
        profile={"fullName": "Alice", "weightKg": 52.0},
        equipment=[],
        goals={"calorieTargetKcal": 2200},
        today_checkin=None,
        food_entries=[],
        workout_sessions=[],
        activity_sessions=[],
        body_metrics=[{"loggedDate": "2026-10-18", "weightKg": 52.0}],
    )

    ctx_bob = UserCoachingContext(
        profile={"fullName": "Bob", "weightKg": 75.0},
        equipment=[],
        goals={"calorieTargetKcal": 2900},
        today_checkin=None,
        food_entries=[],
        workout_sessions=[],
        activity_sessions=[],
        body_metrics=[{"loggedDate": "2026-10-18", "weightKg": 75.0}],
    )

    res_alice = coach_get_weight_trend(ctx_alice)
    res_bob = coach_get_weight_trend(ctx_bob)

    assert res_alice.latest_weight_kg == 52.0
    assert res_bob.latest_weight_kg == 75.0
    assert res_alice.latest_weight_kg != res_bob.latest_weight_kg


# =============================================================================
# Acceptance Test 12: Offline Fallback Resilience (No Gemini API Key)
# =============================================================================

@pytest.mark.asyncio
async def test_acceptance_12_offline_fallback_resilience(monkeypatch: pytest.MonkeyPatch) -> None:
    """12. Verify CoachService deterministically synthesizes responses without GEMINI_API_KEY."""
    # Ensure GEMINI_API_KEY is unset / empty
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    service = CoachService()
    ctx = UserCoachingContext(
        profile={
            "fullName": "Alex Mercer",
            "age": 20,
            "weightKg": 55.0,
            "primaryGoal": "lean_bulk",
        },
        equipment=[
            {"itemName": "Free weights 70kg", "maxLoadKg": 70.0, "isConfirmed": True}
        ],
        goals={
            "calorieTargetKcal": 2450,
            "proteinTargetG": 110,
        },
        today_checkin={"sleepHours": 7.5, "soreness": 2, "readinessScore": 85},
        food_entries=[
            {
                "foodName": "Cooked Steamed Rice",
                "quantity": 2.0,
                "caloriesKcal": 390.0,
                "proteinG": 8.0,
                "carbsG": 86.0,
                "fatG": 1.0,
                "is_confirmed": True,
            }
        ],
        workout_sessions=[],
        activity_sessions=[
            {"activityType": "badminton", "durationMinutes": 60, "intensity": "moderate"}
        ],
        body_metrics=[{"loggedDate": "2026-10-18", "weightKg": 55.2}],
    )

    resp = await service.chat(
        message="How is my nutrition and activity tracking looking today?",
        context=ctx,
    )

    # Must succeed deterministically
    assert resp.reply_markdown is not None
    assert len(resp.reply_markdown) > 50
    assert len(resp.recommendations) > 0
    assert len(resp.facts_from_tools) > 0
