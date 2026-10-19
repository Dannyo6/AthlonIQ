"""AthlonIQ Phase 4 — AI Coach, 8 Typed Allowlisted Tools & Weekly Review Tests.

Tests:
  - 8 allowlisted typed tools operating over user-scoped snapshots.
  - Strict exclusion of unconfirmed food entries from daily totals.
  - Deterministic weekly review synthesizer (nutrition, weight trend, sports load, recovery, priorities).
  - Medical safety escalation guardrail on concerning symptoms.
  - Provider-independent CoachService offline deterministic fallback.
  - Auth protection (401 Unauthorized gating) on all coaching endpoints.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.domain.coach_tools import (
    UserCoachingContext,
    get_nutrition_totals,
    get_food_history,
    get_weekly_training,
    get_exercise_progress,
    get_activity_history,
    get_weight_trend,
    get_recovery_history,
    get_user_goals,
    generate_weekly_review,
    ALLOWLISTED_TOOLS,
    TOOL_METADATA_LIST,
)
from app.services.coach_adapter import CoachService


# =============================================================================
# Mock Context Fixture
# =============================================================================

@pytest.fixture
def athlete_context() -> UserCoachingContext:
    """Standard realistic athlete context for Alex Mercer (20yo, 55kg, lean bulk)."""
    return UserCoachingContext(
        profile={
            "fullName": "Alex Mercer",
            "age": 20,
            "heightCm": 173.0,
            "weightKg": 55.0,
            "dietaryPattern": "nonvegetarian",
            "primaryGoal": "lean_bulk",
            "trainingDaysPerWeek": 5,
            "trainingEnvironment": "home_gym",
            "equipmentConfirmed": True,
        },
        equipment=[
            {"itemKey": "free_weights_70kg", "itemName": "Free Weights up to 70 kg", "maxLoadKg": 70.0, "minIncrementKg": 1.25, "isConfirmed": True},
            {"itemKey": "bench", "itemName": "Flat/Incline Bench", "maxLoadKg": 150.0, "minIncrementKg": 2.5, "isConfirmed": True},
        ],
        goals={
            "proteinMinG": 88,
            "proteinMaxG": 121,
            "proteinTargetG": 110,
            "proteinProvenance": "provisional_default",
            "calorieTargetKcal": 2400,
            "calorieProvenance": "calculated_estimate",
        },
        today_check_in={
            "sleepHours": 8.0,
            "sleepQuality": 4,
            "soreness": 2,
            "fatigue": 2,
            "stress": 2,
        },
        food_entries=[
            # Confirmed item 1
            {
                "loggedDate": "2026-10-19",
                "mealSlot": "lunch",
                "foodName": "Cooked Chicken Breast",
                "quantity": 1.5,
                "caloriesKcal": 165.0,
                "proteinG": 31.0,
                "carbsG": 0.0,
                "fatG": 3.6,
                "isConfirmed": True,
                "provenance": "verified_reference",
            },
            # Confirmed item 2
            {
                "loggedDate": "2026-10-19",
                "mealSlot": "lunch",
                "foodName": "Cooked Steamed Rice",
                "quantity": 2.0,
                "caloriesKcal": 195.0,
                "proteinG": 4.0,
                "carbsG": 43.0,
                "fatG": 0.5,
                "isConfirmed": True,
                "provenance": "verified_reference",
            },
            # UNCONFIRMED item — MUST be excluded from confirmed totals!
            {
                "loggedDate": "2026-10-19",
                "mealSlot": "snack",
                "foodName": "AI Estimated Protein Shake",
                "quantity": 1.0,
                "caloriesKcal": 300.0,
                "proteinG": 30.0,
                "carbsG": 10.0,
                "fatG": 3.0,
                "isConfirmed": False,
                "is_confirmed": False,
                "provenance": "ai_estimated",
            },
        ],
        workout_sessions=[
            {
                "loggedDate": "2026-10-18",
                "title": "Push A (Chest & Triceps)",
                "completed": True,
                "sets": [
                    {"exerciseName": "Barbell Bench Press", "reps": 8, "loadKg": 50.0, "rpe": 8.0, "isCompleted": True, "isPr": False, "isBodyweight": False},
                    {"exerciseName": "Barbell Bench Press", "reps": 8, "loadKg": 50.0, "rpe": 8.0, "isCompleted": True, "isPr": False, "isBodyweight": False},
                    {"exerciseName": "Barbell Bench Press", "reps": 8, "loadKg": 50.0, "rpe": 8.5, "isCompleted": True, "isPr": False, "isBodyweight": False},
                ],
            }
        ],
        activity_sessions=[
            {
                "loggedDate": "2026-10-17",
                "activityType": "running",
                "durationMinutes": 27.5,
                "distanceKm": 5.0,
                "paceFormatted": "5:30 /km",
            },
            {
                "loggedDate": "2026-10-18",
                "activityType": "badminton",
                "durationMinutes": 60.0,
                "matchFormat": "doubles",
                "perceivedEffort": 8,
            },
            {
                "loggedDate": "2026-10-19",
                "activityType": "calisthenics",
                "durationMinutes": 30.0,
                "skillName": "Pull-ups & Dips",
                "setsCount": 4,
            },
        ],
        body_metrics=[
            {"loggedDate": "2026-10-15", "weightKg": 54.8},
            {"loggedDate": "2026-10-17", "weightKg": 55.0},
            {"loggedDate": "2026-10-19", "weightKg": 55.2},
        ],
        recovery_logs=[
            {"loggedDate": "2026-10-17", "sleepHours": 7.5, "sleepQuality": 4, "soreness": 2, "fatigue": 2},
            {"loggedDate": "2026-10-18", "sleepHours": 7.0, "sleepQuality": 3, "soreness": 3, "fatigue": 3},
            {"loggedDate": "2026-10-19", "sleepHours": 8.0, "sleepQuality": 4, "soreness": 2, "fatigue": 2},
        ],
    )


# =============================================================================
# Unit Tests: 8 Allowlisted Typed Tools
# =============================================================================

def test_tool_get_nutrition_totals_excludes_unconfirmed(athlete_context: UserCoachingContext) -> None:
    """Verify tool 1 calculates confirmed totals strictly and excludes unconfirmed entries."""
    res = get_nutrition_totals(athlete_context, target_date="2026-10-19")

    # 1.5 * 31.0 + 2.0 * 4.0 = 46.5 + 8.0 = 54.5g
    assert res.confirmed_protein_g == 54.5
    # 1.5 * 165.0 + 2.0 * 195.0 = 247.5 + 390.0 = 637.5 kcal
    assert res.confirmed_calories_kcal == 637.5
    assert res.confirmed_entries_count == 2
    assert res.excluded_unconfirmed_count == 1  # Unconfirmed AI estimate excluded!

    # Target is 110g -> Gap = 110 - 54.5 = 55.5g
    assert res.protein_target_g == 110.0
    assert res.remaining_protein_gap_g == 55.5
    assert res.is_protein_goal_met is False


def test_tool_get_food_history(athlete_context: UserCoachingContext) -> None:
    """Verify tool 2 identifies high-protein staples and provenance breakdown."""
    res = get_food_history(athlete_context, days=7)
    assert res.total_entries_count == 3
    assert res.confirmed_entries_count == 2
    assert "chicken" in res.high_protein_staples
    assert res.provenance_breakdown["verified_reference"] == 2
    assert res.provenance_breakdown["ai_estimated"] == 1


def test_tool_get_weekly_training(athlete_context: UserCoachingContext) -> None:
    """Verify tool 3 computes gym sessions, total sets, and volume."""
    res = get_weekly_training(athlete_context, days=7)
    assert res.completed_sessions_count == 1
    assert res.target_sessions_per_week == 5
    assert res.total_completed_sets == 3
    # 3 sets of 50kg * 8 reps = 1200 kg
    assert res.total_volume_kg == 1200.0
    assert res.consistency_percentage == 20.0


def test_tool_get_exercise_progress(athlete_context: UserCoachingContext) -> None:
    """Verify tool 4 evaluates PRs and double-progression with 70kg equipment cap."""
    res = get_exercise_progress(athlete_context, exercise_name="Barbell Bench Press")
    assert res.exercise_name == "Barbell Bench Press"
    assert res.top_load_kg == 50.0
    assert res.top_reps == 8
    assert res.equipment_cap_kg == 70.0
    assert res.equipment_confirmed is True
    # All 3 sets hit 8 reps at <= 8.5 RPE with 50kg (< 70kg cap) -> increase_load
    assert res.progression_action == "increase_load"
    assert res.suggested_new_load_kg == 52.5
    assert res.requires_user_confirmation is True


def test_tool_get_activity_history(athlete_context: UserCoachingContext) -> None:
    """Verify tool 5 tallies running pace, badminton, and calisthenics."""
    res = get_activity_history(athlete_context, days=14)
    assert res.running_summary["session_count"] == 1
    assert res.running_summary["total_distance_km"] == 5.0
    assert res.running_summary["recent_runs"][0]["pace"] == "5:30 /km"
    assert res.badminton_summary["session_count"] == 1
    assert res.badminton_summary["total_duration_min"] == 60.0
    assert res.calisthenics_summary["session_count"] == 1


def test_tool_get_weight_trend(athlete_context: UserCoachingContext) -> None:
    """Verify tool 6 calculates 7-day rolling average when >= 3 entries exist."""
    res = get_weight_trend(athlete_context, days=14)
    assert res.weigh_in_count == 3
    assert res.status == "ok"
    assert res.latest_weight_kg == 55.2
    assert res.rolling_7d_kg is not None
    assert res.weekly_delta_kg is not None


def test_tool_get_weight_trend_insufficient_data() -> None:
    """Verify tool 6 enforces the < 3 weigh-ins gate with explicit explanation."""
    ctx = UserCoachingContext(body_metrics=[{"loggedDate": "2026-10-19", "weightKg": 55.0}])
    res = get_weight_trend(ctx, days=14)
    assert res.status == "insufficient_data"
    assert res.rolling_7d_kg is None
    assert "At least 3 weigh-ins" in res.explanation


def test_tool_get_recovery_history(athlete_context: UserCoachingContext) -> None:
    """Verify tool 7 aggregates sleep, soreness, and readiness classifications."""
    res = get_recovery_history(athlete_context, days=7)
    assert res.logs_count == 3
    assert res.average_sleep_hours > 7.0
    assert "Prime" in res.readiness_distribution or "Moderate" in res.readiness_distribution
    assert res.latest_readiness_score > 0


def test_tool_get_user_goals(athlete_context: UserCoachingContext) -> None:
    """Verify tool 8 returns baseline demographics and 88-121g protein reference."""
    res = get_user_goals(athlete_context)
    assert res.age == 20
    assert res.height_cm == 173.0
    assert res.weight_kg == 55.0
    assert res.dietary_pattern == "nonvegetarian"
    assert res.protein_min_g == 88
    assert res.protein_max_g == 121
    assert res.protein_target_g == 110
    assert res.free_weight_cap_kg == 70.0


# =============================================================================
# Unit Tests: Weekly Review Synthesizer
# =============================================================================

def test_generate_weekly_review(athlete_context: UserCoachingContext) -> None:
    """Verify deterministic weekly review generates 5 structured domains and 3 priorities."""
    report = generate_weekly_review(athlete_context)
    assert report.week_start_date is not None
    assert report.week_end_date is not None

    # Domain 1: Nutrition consistency
    assert "days_logging_food" in report.nutrition_consistency
    assert report.nutrition_consistency["protein_target_band"] == "88–121 g"

    # Domain 2: Weight trend review
    assert report.weight_trend_review["status"] == "ok"
    assert "Single-day weight shifts" in report.weight_trend_review["disclaimer"]

    # Domain 3: Training & sports load
    assert report.training_and_sports_load["gym_sessions_completed"] == 1
    assert report.training_and_sports_load["badminton_sessions"] == 1
    assert report.training_and_sports_load["running_sessions"] == 1

    # Domain 4: Recovery patterns
    assert "average_sleep_hours" in report.recovery_patterns

    # Domain 5: Exactly 3 priorities
    assert len(report.next_week_priorities) == 3


# =============================================================================
# Unit Tests: CoachService & Medical Safety Guardrail
# =============================================================================

@pytest.mark.asyncio
async def test_coach_service_medical_safety_guardrail() -> None:
    """Verify immediate safety escalation when prompt mentions acute symptoms."""
    service = CoachService(api_key="")  # Offline mode

    prompts = [
        "I feel sharp chest pain while benching today.",
        "Experiencing dizziness and fainted after running.",
        "I have severe sharp joint and spinal injury pain.",
    ]

    for p in prompts:
        resp = await service.chat(message=p)
        assert "MEDICAL SAFETY WARNING" in resp.reply_markdown
        assert resp.tools_used == []
        assert len(resp.recommendations) > 0
        assert any("physician" in r.lower() or "physiotherapist" in r.lower() for r in resp.recommendations)
        assert resp.proposed_action is None


@pytest.mark.asyncio
async def test_coach_service_offline_synthesis_protein(athlete_context: UserCoachingContext) -> None:
    """Verify offline synthesizer answers protein questions with epistemic separation."""
    service = CoachService(api_key="")  # Offline mode

    resp = await service.chat(
        message="Did I eat enough protein yesterday?",
        context=athlete_context,
    )

    assert "get_nutrition_totals" in resp.tools_used
    assert len(resp.facts_from_tools) > 0
    assert len(resp.app_calculations) > 0
    assert len(resp.recommendations) > 0
    assert resp.proposed_action is not None
    assert resp.proposed_action.type == "log_meal"
    assert "chicken" in resp.proposed_action.summary.lower() or "protein" in resp.proposed_action.summary.lower()


# =============================================================================
# Integration Tests: Coaching Endpoints
# =============================================================================

@pytest.mark.asyncio
async def test_coaching_endpoints_unauthorized() -> None:
    """Verify all Phase 4 endpoints strictly require Bearer authorization."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r1 = await client.post("/api/v1/coaching/chat", json={"message": "Hello coach"})
        assert r1.status_code == 401

        r2 = await client.post("/api/v1/coaching/weekly-review", json={})
        assert r2.status_code == 401

        r3 = await client.get("/api/v1/coaching/tools")
        assert r3.status_code == 401


@pytest.mark.asyncio
async def test_coaching_chat_endpoint_authenticated(athlete_context: UserCoachingContext) -> None:
    """Verify POST /api/v1/coaching/chat with Bearer token succeeds and returns CoachTurnResponse."""
    headers = {"Authorization": "Bearer test-token-athlete-test"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/coaching/chat",
            json={
                "message": "What should I train today, given my recent activity and recovery?",
                "context": athlete_context.model_dump(),
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        coach_data = data["data"]
        assert len(coach_data["tools_used"]) >= 2
        assert "get_recovery_history" in coach_data["tools_used"]
        assert len(coach_data["facts_from_tools"]) > 0
        assert len(coach_data["app_calculations"]) > 0
        assert len(coach_data["recommendations"]) > 0


@pytest.mark.asyncio
async def test_coaching_weekly_review_endpoint_authenticated(athlete_context: UserCoachingContext) -> None:
    """Verify POST /api/v1/coaching/weekly-review returns structured report."""
    headers = {"Authorization": "Bearer test-token-athlete-test"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/coaching/weekly-review",
            json={"context": athlete_context.model_dump()},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        report = data["data"]
        assert "nutrition_consistency" in report
        assert "weight_trend_review" in report
        assert "training_and_sports_load" in report
        assert "recovery_patterns" in report
        assert len(report["next_week_priorities"]) == 3


@pytest.mark.asyncio
async def test_coaching_tools_endpoint_authenticated() -> None:
    """Verify GET /api/v1/coaching/tools returns all 8 allowlisted tool metadata."""
    headers = {"Authorization": "Bearer test-token-athlete-test"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/coaching/tools", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        tools = data["data"]
        assert len(tools) == 8
        tool_names = [t["name"] for t in tools]
        for expected in ALLOWLISTED_TOOLS:
            assert expected in tool_names
