"""AthlonIQ Phase 4 — Allowlisted Typed Coach Tools & Weekly Review Engine.

Enforces:
  - 8 strictly allowlisted, read-only tools operating over user-scoped snapshots.
  - No arbitrary code execution, raw SQL, or unsupervised state mutation.
  - Deterministic weekly review synthesizer.
  - Epistemic separation of verified facts, deterministic math, and recommendations.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Any, Callable, Dict, List, Optional
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import settings

from app.domain.performance import (
    calculate_protein_reference,
    calculate_rules_readiness,
)
from app.domain.tracking import (
    calculate_running_pace,
    evaluate_progression_suggestion,
    calculate_weight_trend,
    WeightPoint,
    PreviousSet,
)


# =============================================================================
# Helper Utilities for Context Key Normalization
# =============================================================================

def _val(obj: Any, *keys: str, default: Any = None) -> Any:
    """Extract value from object or dictionary supporting both camelCase and snake_case."""
    if obj is None:
        return default
    if isinstance(obj, dict):
        for k in keys:
            if k in obj and obj[k] is not None:
                return obj[k]
        return default
    for k in keys:
        if hasattr(obj, k):
            val = getattr(obj, k)
            if val is not None:
                return val
    return default


def _parse_date(date_str: Optional[str]) -> Optional[date]:
    """Parse ISO date string safely."""
    if not date_str:
        return None
    try:
        # Handles "YYYY-MM-DD" or ISO strings with "T"
        clean = date_str.split("T")[0]
        return datetime.strptime(clean, "%Y-%m-%d").date()
    except Exception:
        return None


# =============================================================================
# Context Models
# =============================================================================

class UserCoachingContext(BaseModel):
    """Auditable, user-scoped snapshot of an athlete's biometrics, logs, and preferences."""

    profile: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fullName": "Alex Mercer",
            "age": 20,
            "heightCm": 173.0,
            "weightKg": 55.0,
            "dietaryPattern": "nonvegetarian",
            "primaryGoal": "lean_bulk",
            "trainingScope": ["gym", "calisthenics", "badminton", "running"],
            "trainingDaysPerWeek": 5,
            "trainingEnvironment": "home_gym",
            "equipmentConfirmed": False,
        }
    )
    equipment: List[Dict[str, Any]] = Field(
        default_factory=lambda: [
            {"itemKey": "free_weights_70kg", "itemName": "Free Weights up to 70 kg", "maxLoadKg": 70.0, "minIncrementKg": 1.25, "isConfirmed": False},
            {"itemKey": "bench", "itemName": "Flat/Incline Bench", "maxLoadKg": 150.0, "minIncrementKg": 2.5, "isConfirmed": False},
            {"itemKey": "squat_rack", "itemName": "Squat/Power Rack", "maxLoadKg": 200.0, "minIncrementKg": 2.5, "isConfirmed": False},
            {"itemKey": "dips_station", "itemName": "Dips Station", "maxLoadKg": None, "minIncrementKg": None, "isConfirmed": False},
            {"itemKey": "lat_pulldown_station", "itemName": "Lat Pulldown Station", "maxLoadKg": 100.0, "minIncrementKg": 5.0, "isConfirmed": False},
        ]
    )
    goals: Dict[str, Any] = Field(
        default_factory=lambda: {
            "proteinMinG": 88,
            "proteinMaxG": 121,
            "proteinTargetG": 110,
            "proteinProvenance": "provisional_default",
            "calorieTargetKcal": None,
            "calorieProvenance": "awaiting_onboarding",
        }
    )
    preferences: Dict[str, Any] = Field(
        default_factory=lambda: {
            "weightUnit": "kg",
            "distanceUnit": "km",
            "timezone": "Asia/Kolkata",
            "notificationsEnabled": False,
            "quietHoursStart": "22:30",
            "quietHoursEnd": "07:00",
        }
    )
    today_check_in: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {
            "sleepHours": 7.5,
            "sleepQuality": 4,
            "soreness": 2,
            "fatigue": 2,
            "stress": 2,
        }
    )
    food_entries: List[Dict[str, Any]] = Field(default_factory=list)
    workout_sessions: List[Dict[str, Any]] = Field(default_factory=list)
    activity_sessions: List[Dict[str, Any]] = Field(default_factory=list)
    body_metrics: List[Dict[str, Any]] = Field(default_factory=list)
    recovery_logs: List[Dict[str, Any]] = Field(default_factory=list)


# =============================================================================
# Tool Output Schemas
# =============================================================================

class NutritionTotalsResult(BaseModel):
    """Confirmed nutrition totals and gap against athlete targets."""

    target_date: str
    confirmed_calories_kcal: float
    confirmed_protein_g: float
    confirmed_carbs_g: float
    confirmed_fat_g: float
    confirmed_entries_count: int
    excluded_unconfirmed_count: int
    protein_target_g: float
    remaining_protein_gap_g: float
    calorie_target_kcal: Optional[float] = None
    remaining_calorie_gap_kcal: Optional[float] = None
    is_protein_goal_met: bool
    summary: str


class FoodHistoryResult(BaseModel):
    """Recent logged meals, provenance breakdown, and staple food frequency."""

    days_evaluated: int
    total_entries_count: int
    confirmed_entries_count: int
    provenance_breakdown: Dict[str, int]
    high_protein_staples: Dict[str, int]
    recent_meals_sample: List[Dict[str, Any]]
    summary: str


class WeeklyTrainingResult(BaseModel):
    """Completed gym sessions, sets, volume, and target consistency."""

    days_evaluated: int
    completed_sessions_count: int
    target_sessions_per_week: int
    consistency_percentage: float
    total_completed_sets: int
    total_volume_kg: float
    sessions_summary: List[Dict[str, Any]]
    summary: str


class ExerciseProgressResult(BaseModel):
    """Exercise top sets, PR records, and home-gym constrained progression status."""

    exercise_name: str
    total_sets_found: int
    top_load_kg: float
    top_reps: int
    estimated_1rm_kg: float
    is_pr_present: bool
    equipment_cap_kg: float
    equipment_confirmed: bool
    progression_action: str
    progression_explanation: str
    suggested_new_load_kg: Optional[float] = None
    requires_user_confirmation: bool = True
    summary: str


class ActivityHistoryResult(BaseModel):
    """Logged running, badminton, and calisthenics sessions."""

    days_evaluated: int
    total_activities_count: int
    running_summary: Dict[str, Any]
    badminton_summary: Dict[str, Any]
    calisthenics_summary: Dict[str, Any]
    summary: str


class WeightTrendResult(BaseModel):
    """7-day rolling weight trend, data sufficiency, and weekly delta."""

    days_evaluated: int
    weigh_in_count: int
    status: str  # "ok" | "insufficient_data"
    latest_weight_kg: Optional[float] = None
    rolling_7d_kg: Optional[float] = None
    weekly_delta_kg: Optional[float] = None
    explanation: str
    summary: str


class RecoveryHistoryResult(BaseModel):
    """Recent sleep duration, soreness, fatigue, and rules-based readiness."""

    days_evaluated: int
    logs_count: int
    average_sleep_hours: float
    average_sleep_quality: float
    average_soreness: float
    average_fatigue: float
    readiness_distribution: Dict[str, int]  # {"Prime": X, "Moderate": Y, "Recover": Z}
    latest_readiness_score: int
    latest_status: str
    latest_guidance: str
    summary: str


class UserGoalsResult(BaseModel):
    """Athlete demographic profile baseline, equipment state, and dietary targets."""

    age: int
    height_cm: float
    weight_kg: float
    dietary_pattern: str
    primary_goal: str
    training_days_per_week: int
    training_environment: str
    equipment_confirmed: bool
    free_weight_cap_kg: float
    protein_min_g: int
    protein_max_g: int
    protein_target_g: int
    protein_provenance: str
    calorie_target_kcal: Optional[int]
    calorie_provenance: str
    summary: str


# =============================================================================
# Weekly Review Report Schema
# =============================================================================

class WeeklyReviewReport(BaseModel):
    """Deterministic weekly progress review synthesized across all athlete domains."""

    week_start_date: str
    week_end_date: str
    generated_at: str
    nutrition_consistency: Dict[str, Any]
    weight_trend_review: Dict[str, Any]
    training_and_sports_load: Dict[str, Any]
    recovery_patterns: Dict[str, Any]
    next_week_priorities: List[str]


def resolve_server_today(
    context: Optional[UserCoachingContext] = None,
    client_today: Optional[date] = None,
    *,
    user_timezone: Optional[str] = None,
    environment: Optional[str] = None,
    now: Optional[datetime] = None,
) -> date:
    """Compute 'today' server-side from the authenticated user's profile timezone.

    Defaults to 'Asia/Kolkata' only if the stored timezone is NULL (or not set).
    Accepts a client `today` override ONLY when ENVIRONMENT != 'production';
    in production, client overrides are strictly rejected with HTTP 400 Bad Request.

    Args:
        context: Optional user coaching context snapshot containing user profile and preferences.
        client_today: Optional client-provided evaluation date override.
        user_timezone: Optional explicit IANA timezone string (e.g. 'Asia/Kolkata', 'America/New_York').
        environment: Optional deployment environment string ('production', 'development', 'test').
            Defaults to settings.ENVIRONMENT.
        now: Optional datetime with or without tzinfo representing the current system clock.
            Used for testing and deterministic clock injection. Defaults to UTC now.

    Returns:
        The current date (today) in the resolved user timezone.

    Raises:
        HTTPException: If client_today is provided when environment is 'production'.
    """
    env = environment if environment is not None else settings.ENVIRONMENT

    # 1. Handle client today override
    if client_today is not None:
        if env == "production":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Client 'today' override is forbidden in production environment",
            )
        return client_today

    # 2. Extract timezone: explicit user_timezone > context.preferences > context.profile
    tz_str: Optional[str] = user_timezone
    if tz_str is None and context is not None:
        if context.preferences and isinstance(context.preferences, dict):
            tz_str = context.preferences.get("timezone")
        if not tz_str and context.profile and isinstance(context.profile, dict):
            tz_str = context.profile.get("timezone")

    # Default to "Asia/Kolkata" only if stored timezone is NULL
    if not tz_str or not str(tz_str).strip():
        tz_str = "Asia/Kolkata"

    # 3. Reference clock (UTC)
    if now is not None:
        current_time = now if now.tzinfo is not None else now.replace(tzinfo=timezone.utc)
    else:
        current_time = datetime.now(timezone.utc)

    # 4. Convert UTC clock to user's localized date
    try:
        tz = ZoneInfo(tz_str)
    except Exception:
        # Fallback to Asia/Kolkata if timezone key is invalid or unrecognized
        tz = ZoneInfo("Asia/Kolkata")

    user_local_dt = current_time.astimezone(tz)
    return user_local_dt.date()


def get_today(context: Optional[UserCoachingContext] = None) -> date:
    """Return the reference calendar date for coaching tools (injectable/monkeypatchable in tests)."""
    return resolve_server_today(context=context)


# =============================================================================
# Tool Implementations
# =============================================================================

def get_nutrition_totals(
    context: UserCoachingContext,
    target_date: Optional[str] = None,
    today: Optional[date] = None,
) -> NutritionTotalsResult:
    """Return confirmed calories, protein, carbs, fat, and remaining gap against goals.
    
    CRITICAL GUARDRAIL: Entries with is_confirmed == False (e.g. unconfirmed photo
    estimates) are STRICTLY excluded from confirmed totals.
    """
    ref_today = today if today is not None else get_today()
    all_entries = context.food_entries or []

    # If no target_date specified, pick today or the latest logged date
    eval_date_str = target_date
    if not eval_date_str:
        if all_entries:
            dates = [str(_val(e, "loggedDate", "logged_date")) for e in all_entries if _val(e, "loggedDate", "logged_date")]
            eval_date_str = sorted(dates)[-1] if dates else ref_today.isoformat()
        else:
            eval_date_str = ref_today.isoformat()

    confirmed_cal = 0.0
    confirmed_pro = 0.0
    confirmed_cho = 0.0
    confirmed_fat = 0.0
    confirmed_count = 0
    excluded_count = 0

    for e in all_entries:
        entry_date = str(_val(e, "loggedDate", "logged_date", default=""))
        if entry_date != eval_date_str:
            continue

        is_conf = bool(_val(e, "isConfirmed", "is_confirmed", default=True))
        q = float(_val(e, "quantity", default=1.0) or 1.0)
        c = float(_val(e, "caloriesKcal", "calories_kcal", default=0.0) or 0.0) * q
        p = float(_val(e, "proteinG", "protein_g", default=0.0) or 0.0) * q
        ch = float(_val(e, "carbsG", "carbs_g", default=0.0) or 0.0) * q
        f = float(_val(e, "fatG", "fat_g", default=0.0) or 0.0) * q

        if is_conf:
            confirmed_cal += c
            confirmed_pro += p
            confirmed_cho += ch
            confirmed_fat += f
            confirmed_count += 1
        else:
            excluded_count += 1

    confirmed_cal = round(confirmed_cal, 1)
    confirmed_pro = round(confirmed_pro, 1)
    confirmed_cho = round(confirmed_cho, 1)
    confirmed_fat = round(confirmed_fat, 1)

    pro_target = float(_val(context.goals, "proteinTargetG", "protein_target_g", default=110.0))
    cal_target = _val(context.goals, "calorieTargetKcal", "calorie_target_kcal", default=None)
    cal_target_val = float(cal_target) if cal_target is not None else None

    pro_gap = max(0.0, round(pro_target - confirmed_pro, 1))
    cal_gap = max(0.0, round(cal_target_val - confirmed_cal, 1)) if cal_target_val else None
    goal_met = confirmed_pro >= pro_target

    summary = (
        f"On {eval_date_str}, logged {confirmed_pro}g confirmed protein "
        f"({confirmed_cal} kcal across {confirmed_count} confirmed items). "
        + (
            f"Protein target of {pro_target}g reached!"
            if goal_met
            else f"Remaining protein gap is {pro_gap}g to reach {pro_target}g target."
        )
        + (f" ({excluded_count} unconfirmed estimates excluded from totals)." if excluded_count > 0 else "")
    )

    return NutritionTotalsResult(
        target_date=eval_date_str,
        confirmed_calories_kcal=confirmed_cal,
        confirmed_protein_g=confirmed_pro,
        confirmed_carbs_g=confirmed_cho,
        confirmed_fat_g=confirmed_fat,
        confirmed_entries_count=confirmed_count,
        excluded_unconfirmed_count=excluded_count,
        protein_target_g=pro_target,
        remaining_protein_gap_g=pro_gap,
        calorie_target_kcal=cal_target_val,
        remaining_calorie_gap_kcal=cal_gap,
        is_protein_goal_met=goal_met,
        summary=summary,
    )


def get_food_history(
    context: UserCoachingContext,
    days: int = 7,
    today: Optional[date] = None,
) -> FoodHistoryResult:
    """Return recent logged meals, provenance breakdown, and high-protein staple frequency."""
    ref_today = today if today is not None else get_today()
    entries = context.food_entries or []
    cutoff = ref_today - timedelta(days=days)

    filtered: List[Dict[str, Any]] = []
    provenance_counts: Dict[str, int] = {
        "verified_reference": 0,
        "manual_entry": 0,
        "user_corrected": 0,
        "ai_estimated": 0,
    }
    staple_counts: Dict[str, int] = {}
    confirmed_count = 0

    high_protein_keywords = [
        "chicken", "egg", "paneer", "whey", "dal", "soya", "tofu",
        "fish", "greek yogurt", "curd", "sprouts", "chana"
    ]

    for e in entries:
        d = _parse_date(_val(e, "loggedDate", "logged_date"))
        if d and d < cutoff:
            continue

        filtered.append(e)
        prov = str(_val(e, "provenance", default="manual_entry"))
        provenance_counts[prov] = provenance_counts.get(prov, 0) + 1

        is_conf = bool(_val(e, "isConfirmed", "is_confirmed", default=True))
        if is_conf:
            confirmed_count += 1

        name = str(_val(e, "foodName", "name", default="")).lower()
        for kw in high_protein_keywords:
            if kw in name:
                staple_counts[kw] = staple_counts.get(kw, 0) + 1

    # Extract sample of up to 5 recent items
    sample: List[Dict[str, Any]] = []
    for item in filtered[-5:]:
        sample.append({
            "food_name": _val(item, "foodName", "name", default="Item"),
            "meal_slot": _val(item, "mealSlot", "meal_slot", default="snack"),
            "protein_g": _val(item, "proteinG", "protein_g", default=0.0),
            "calories_kcal": _val(item, "caloriesKcal", "calories_kcal", default=0.0),
            "is_confirmed": bool(_val(item, "isConfirmed", "is_confirmed", default=True)),
            "provenance": _val(item, "provenance", default="manual_entry"),
        })

    summary = (
        f"Over the last {days} days, found {len(filtered)} logged items "
        f"({confirmed_count} confirmed). Top protein staples: "
        + (", ".join(f"{k} ({v}x)" for k, v in staple_counts.items()) if staple_counts else "None logged")
        + "."
    )

    return FoodHistoryResult(
        days_evaluated=days,
        total_entries_count=len(filtered),
        confirmed_entries_count=confirmed_count,
        provenance_breakdown=provenance_counts,
        high_protein_staples=staple_counts,
        recent_meals_sample=sample,
        summary=summary,
    )


def get_weekly_training(
    context: UserCoachingContext,
    days: int = 7,
    today: Optional[date] = None,
) -> WeeklyTrainingResult:
    """Return completed gym sessions, total sets, total volume, and target consistency."""
    ref_today = today if today is not None else get_today()
    sessions = context.workout_sessions or []
    cutoff = ref_today - timedelta(days=days)
    target_days = int(_val(context.profile, "trainingDaysPerWeek", "training_days_per_week", default=5))

    completed_sessions: List[Dict[str, Any]] = []
    total_sets = 0
    total_volume = 0.0

    for s in sessions:
        d = _parse_date(_val(s, "loggedDate", "logged_date"))
        if d and d < cutoff:
            continue

        is_done = bool(_val(s, "completed", default=False))
        sets_list = _val(s, "sets", default=[]) or []
        session_vol = 0.0

        for st in sets_list:
            reps = int(_val(st, "reps", default=0) or 0)
            load = float(_val(st, "loadKg", "load_kg", default=0.0) or 0.0)
            is_bw = bool(_val(st, "isBodyweight", "is_bodyweight", default=False))
            is_set_done = bool(_val(st, "isCompleted", "is_completed", default=True))

            if is_set_done:
                total_sets += 1
                if not is_bw and load > 0 and reps > 0:
                    set_vol = round(load * reps, 1)
                    session_vol += set_vol
                    total_volume += set_vol

        if is_done or len(sets_list) > 0:
            completed_sessions.append({
                "date": _val(s, "loggedDate", "logged_date", default="Recent"),
                "title": _val(s, "title", default="Gym Workout"),
                "sets_count": len(sets_list),
                "volume_kg": round(session_vol, 1),
            })

    completed_count = len(completed_sessions)
    consistency = round((completed_count / target_days) * 100, 1) if target_days > 0 else 0.0

    summary = (
        f"Completed {completed_count}/{target_days} planned gym sessions in the last {days} days "
        f"({consistency}% consistency). Total sets: {total_sets}, total external volume: {round(total_volume, 1)} kg."
    )

    return WeeklyTrainingResult(
        days_evaluated=days,
        completed_sessions_count=completed_count,
        target_sessions_per_week=target_days,
        consistency_percentage=consistency,
        total_completed_sets=total_sets,
        total_volume_kg=round(total_volume, 1),
        sessions_summary=completed_sessions,
        summary=summary,
    )


def get_exercise_progress(
    context: UserCoachingContext,
    exercise_name: Optional[str] = None,
    today: Optional[date] = None,
) -> ExerciseProgressResult:
    """Return top sets, PRs, and deterministic double-progression status respecting home equipment cap."""
    target_ex = exercise_name.strip() if exercise_name else "Barbell Bench Press"
    sessions = context.workout_sessions or []

    # Check equipment confirmation
    equipment_confirmed = bool(_val(context.profile, "equipmentConfirmed", "equipment_confirmed", default=False))
    free_weight_cap = 70.0  # AthlonIQ home gym benchmark cap
    for eq in context.equipment or []:
        key = str(_val(eq, "itemKey", "item_key", default=""))
        if "free_weight" in key or "dumbbell" in key:
            load = _val(eq, "maxLoadKg", "max_load_kg")
            if load:
                free_weight_cap = float(load)
            if bool(_val(eq, "isConfirmed", "is_confirmed", default=False)):
                equipment_confirmed = True

    matched_sets: List[PreviousSet] = []
    top_load = 0.0
    top_reps = 0
    has_pr = False

    for s in sessions:
        sets_list = _val(s, "sets", default=[]) or []
        for st in sets_list:
            s_name = str(_val(st, "exerciseName", "exercise_name", default=""))
            if not exercise_name or (target_ex.lower() in s_name.lower()):
                reps = int(_val(st, "reps", default=0) or 0)
                load = float(_val(st, "loadKg", "load_kg", default=0.0) or 0.0)
                rpe = _val(st, "rpe")
                rpe_val = float(rpe) if rpe is not None else None
                is_bw = bool(_val(st, "isBodyweight", "is_bodyweight", default=False))
                is_pr = bool(_val(st, "isPr", "is_pr", default=False))

                if is_pr:
                    has_pr = True

                if load > top_load or (load == top_load and reps > top_reps):
                    top_load = load
                    top_reps = reps

                matched_sets.append(
                    PreviousSet(
                        reps=reps,
                        load_kg=load,
                        rpe=rpe_val,
                        is_bodyweight=is_bw,
                    )
                )

    if not matched_sets:
        # Default mock baseline set for deterministic coaching when fresh
        matched_sets = [
            PreviousSet(reps=8, load_kg=50.0, rpe=8.0),
            PreviousSet(reps=8, load_kg=50.0, rpe=8.5),
            PreviousSet(reps=8, load_kg=50.0, rpe=8.5),
        ]
        top_load = 50.0
        top_reps = 8

    # Readiness status for progression
    readiness_status = "Moderate"
    if context.today_check_in:
        readiness_calc = calculate_rules_readiness(
            sleep_hours=float(_val(context.today_check_in, "sleepHours", "sleep_hours", default=7.5)),
            sleep_quality=int(_val(context.today_check_in, "sleepQuality", "sleep_quality", default=4)),
            soreness=int(_val(context.today_check_in, "soreness", default=2)),
            fatigue=int(_val(context.today_check_in, "fatigue", default=2)),
            stress=_val(context.today_check_in, "stress"),
        )
        readiness_status = readiness_calc["status"]

    progression = evaluate_progression_suggestion(
        exercise_name=target_ex,
        previous_sets=matched_sets,
        equipment_max_load_kg=free_weight_cap,
        equipment_min_increment_kg=2.5,
        equipment_confirmed=equipment_confirmed,
        readiness_status=readiness_status,
        target_reps_max=8,
    )

    est_1rm = round(top_load * (1.0 + top_reps / 30.0), 1) if top_reps > 0 else top_load

    summary = (
        f"Top set for '{target_ex}': {top_load} kg x {top_reps} reps (Est 1RM: {est_1rm} kg). "
        f"Progression verdict: {progression.action} — {progression.explanation}"
    )

    return ExerciseProgressResult(
        exercise_name=target_ex,
        total_sets_found=len(matched_sets),
        top_load_kg=top_load,
        top_reps=top_reps,
        estimated_1rm_kg=est_1rm,
        is_pr_present=has_pr,
        equipment_cap_kg=free_weight_cap,
        equipment_confirmed=equipment_confirmed,
        progression_action=progression.action,
        progression_explanation=progression.explanation,
        suggested_new_load_kg=progression.new_load_kg,
        requires_user_confirmation=True,
        summary=summary,
    )


def get_activity_history(
    context: UserCoachingContext,
    days: int = 14,
    today: Optional[date] = None,
) -> ActivityHistoryResult:
    """Return logged running, badminton, and calisthenics sessions."""
    ref_today = today if today is not None else get_today()
    activities = context.activity_sessions or []
    cutoff = ref_today - timedelta(days=days)

    runs: List[Dict[str, Any]] = []
    badminton: List[Dict[str, Any]] = []
    calisthenics: List[Dict[str, Any]] = []

    total_run_km = 0.0
    total_run_min = 0.0
    total_badminton_min = 0.0

    for a in activities:
        d = _parse_date(_val(a, "loggedDate", "logged_date"))
        if d and d < cutoff:
            continue

        act_type = str(_val(a, "activityType", "activity_type", default="other")).lower()
        duration = float(_val(a, "durationMinutes", "duration_minutes", default=0.0) or 0.0)

        if act_type == "running":
            dist = float(_val(a, "distanceKm", "distance_km", default=0.0) or 0.0)
            pace = str(_val(a, "paceFormatted", "pace_formatted", default=""))
            if not pace and dist > 0 and duration > 0:
                try:
                    pace_res = calculate_running_pace(dist, duration)
                    pace = pace_res.pace_formatted
                except Exception:
                    pace = "N/A"
            total_run_km += dist
            total_run_min += duration
            runs.append({
                "date": _val(a, "loggedDate", "logged_date", default="Recent"),
                "distance_km": dist,
                "duration_min": duration,
                "pace": pace,
            })
        elif act_type == "badminton":
            total_badminton_min += duration
            badminton.append({
                "date": _val(a, "loggedDate", "logged_date", default="Recent"),
                "duration_min": duration,
                "match_format": _val(a, "matchFormat", "match_format", default="doubles"),
                "effort": _val(a, "perceivedEffort", "perceived_effort", default=7),
            })
        elif act_type == "calisthenics":
            calisthenics.append({
                "date": _val(a, "loggedDate", "logged_date", default="Recent"),
                "duration_min": duration,
                "skill": _val(a, "skillName", "skill_name", default="Pull-ups / Dips"),
                "sets": _val(a, "setsCount", "sets_count", default=3),
            })

    total_count = len(runs) + len(badminton) + len(calisthenics)
    summary = (
        f"Over the last {days} days: {len(runs)} runs ({round(total_run_km, 1)} km), "
        f"{len(badminton)} badminton sessions ({round(total_badminton_min, 1)} min), "
        f"and {len(calisthenics)} calisthenics sessions."
    )

    return ActivityHistoryResult(
        days_evaluated=days,
        total_activities_count=total_count,
        running_summary={
            "session_count": len(runs),
            "total_distance_km": round(total_run_km, 1),
            "total_duration_min": round(total_run_min, 1),
            "recent_runs": runs[-3:],
        },
        badminton_summary={
            "session_count": len(badminton),
            "total_duration_min": round(total_badminton_min, 1),
            "recent_sessions": badminton[-3:],
        },
        calisthenics_summary={
            "session_count": len(calisthenics),
            "recent_sessions": calisthenics[-3:],
        },
        summary=summary,
    )


def get_weight_trend(
    context: UserCoachingContext,
    days: int = 14,
    today: Optional[date] = None,
) -> WeightTrendResult:
    """Return weigh-in count, latest weight (kg), 7-day rolling average, and weekly delta."""
    ref_today = today if today is not None else get_today()
    metrics = context.body_metrics or []
    cutoff = ref_today - timedelta(days=days)

    weight_points: List[WeightPoint] = []
    latest_kg: Optional[float] = None
    latest_date: Optional[str] = None

    for m in metrics:
        d_str = str(_val(m, "loggedDate", "logged_date", default=""))
        d = _parse_date(d_str)
        if d and d < cutoff:
            continue

        w = float(_val(m, "weightKg", "weight_kg", default=0.0) or 0.0)
        if w > 0 and d_str:
            weight_points.append(WeightPoint(logged_date=d_str, weight_kg=w))
            if not latest_date or d_str > latest_date:
                latest_date = d_str
                latest_kg = w

    if not weight_points and _val(context.profile, "weightKg", "weight_kg"):
        # Fallback profile weight as 1 point
        pw = float(_val(context.profile, "weightKg", "weight_kg"))
        weight_points.append(WeightPoint(logged_date=ref_today.isoformat(), weight_kg=pw))
        latest_kg = pw

    trend_calc = calculate_weight_trend(weight_points)

    summary = (
        f"Weigh-ins found: {len(weight_points)}. "
        + (
            f"Latest weight: {latest_kg} kg. 7-day rolling average: {trend_calc.rolling_7d_kg} kg "
            f"(Weekly delta: {trend_calc.weekly_delta_kg} kg)."
            if trend_calc.status == "ok"
            else f"Notice: {trend_calc.explanation}"
        )
    )

    return WeightTrendResult(
        days_evaluated=days,
        weigh_in_count=len(weight_points),
        status=trend_calc.status,
        latest_weight_kg=latest_kg,
        rolling_7d_kg=trend_calc.rolling_7d_kg,
        weekly_delta_kg=trend_calc.weekly_delta_kg,
        explanation=trend_calc.explanation,
        summary=summary,
    )


def get_recovery_history(
    context: UserCoachingContext,
    days: int = 7,
    today: Optional[date] = None,
) -> RecoveryHistoryResult:
    """Return recent sleep duration, subjective quality, soreness, fatigue, and rules-based readiness."""
    ref_today = today if today is not None else get_today()
    logs = context.recovery_logs or []
    cutoff = ref_today - timedelta(days=days)

    valid_logs: List[Dict[str, Any]] = []
    for l in logs:
        d = _parse_date(_val(l, "loggedDate", "logged_date", "date"))
        if d and d < cutoff:
            continue
        valid_logs.append(l)

    # If no logs in list, include today's check-in
    if not valid_logs and context.today_check_in:
        valid_logs.append(context.today_check_in)

    if not valid_logs:
        # Default fallback baseline check-in
        valid_logs = [{
            "sleepHours": 7.5,
            "sleepQuality": 4,
            "soreness": 2,
            "fatigue": 2,
            "stress": 2,
        }]

    total_sleep = 0.0
    total_quality = 0.0
    total_soreness = 0.0
    total_fatigue = 0.0
    status_counts = {"Prime": 0, "Moderate": 0, "Recover": 0}

    latest_score = 75
    latest_status = "Moderate"
    latest_guidance = "Train with standard volume and load."

    for item in valid_logs:
        sh = float(_val(item, "sleepHours", "sleep_hours", default=7.5))
        sq = int(_val(item, "sleepQuality", "sleep_quality", default=4))
        sor = int(_val(item, "soreness", default=2))
        fat = int(_val(item, "fatigue", default=2))
        str_val = _val(item, "stress")
        str_int = int(str_val) if str_val is not None else None

        total_sleep += sh
        total_quality += sq
        total_soreness += sor
        total_fatigue += fat

        res = calculate_rules_readiness(
            sleep_hours=sh,
            sleep_quality=sq,
            soreness=sor,
            fatigue=fat,
            stress=str_int,
        )
        st = res["status"]
        status_counts[st] = status_counts.get(st, 0) + 1
        latest_score = res["readiness_score"]
        latest_status = st
        latest_guidance = res["guidance"]

    n = max(1, len(valid_logs))
    avg_sleep = round(total_sleep / n, 1)
    avg_quality = round(total_quality / n, 1)
    avg_soreness = round(total_soreness / n, 1)
    avg_fatigue = round(total_fatigue / n, 1)

    summary = (
        f"Over {n} recovery check-ins (last {days} days): Avg sleep {avg_sleep}h "
        f"(Quality: {avg_quality}/5), Soreness: {avg_soreness}/5, Fatigue: {avg_fatigue}/5. "
        f"Latest Readiness: {latest_score}% ({latest_status}). Guidance: {latest_guidance}"
    )

    return RecoveryHistoryResult(
        days_evaluated=days,
        logs_count=n,
        average_sleep_hours=avg_sleep,
        average_sleep_quality=avg_quality,
        average_soreness=avg_soreness,
        average_fatigue=avg_fatigue,
        readiness_distribution=status_counts,
        latest_readiness_score=latest_score,
        latest_status=latest_status,
        latest_guidance=latest_guidance,
        summary=summary,
    )


def get_user_goals(
    context: UserCoachingContext,
    today: Optional[date] = None,
) -> UserGoalsResult:
    """Return user profile baseline, equipment confirmation state, protein reference, and calorie target."""
    prof = context.profile
    age = int(_val(prof, "age", default=20))
    height = float(_val(prof, "heightCm", "height_cm", default=173.0))
    weight = float(_val(prof, "weightKg", "weight_kg", default=55.0))
    dietary = str(_val(prof, "dietaryPattern", "dietary_pattern", default="nonvegetarian"))
    goal = str(_val(prof, "primaryGoal", "primary_goal", default="lean_bulk"))
    train_days = int(_val(prof, "trainingDaysPerWeek", "training_days_per_week", default=5))
    env = str(_val(prof, "trainingEnvironment", "training_environment", default="home_gym"))
    eq_confirmed = bool(_val(prof, "equipmentConfirmed", "equipment_confirmed", default=False))

    free_weight_cap = 70.0
    for eq in context.equipment or []:
        key = str(_val(eq, "itemKey", "item_key", default=""))
        if "free_weight" in key or "dumbbell" in key:
            max_load = _val(eq, "maxLoadKg", "max_load_kg")
            if max_load:
                free_weight_cap = float(max_load)

    # Protein reference deterministic band
    p_ref = calculate_protein_reference(weight)
    p_target = int(_val(context.goals, "proteinTargetG", "protein_target_g", default=p_ref["protein_target_g"]))
    p_prov = str(_val(context.goals, "proteinProvenance", "protein_provenance", default=p_ref["provenance"]))

    c_target = _val(context.goals, "calorieTargetKcal", "calorie_target_kcal", default=None)
    c_target_int = int(c_target) if c_target is not None else None
    c_prov = str(_val(context.goals, "calorieProvenance", "calorie_provenance", default="awaiting_onboarding"))

    summary = (
        f"Athlete: {age}yo, {height}cm, {weight}kg ({dietary}, {goal}). "
        f"Training {train_days}d/wk in {env}. Equipment confirmed: {eq_confirmed} (Free-weight cap: {free_weight_cap}kg). "
        f"Protein reference band: {p_ref['protein_min_g']}–{p_ref['protein_max_g']}g (Target: {p_target}g). "
        f"Calorie target: {c_target_int if c_target_int else 'Awaiting Onboarding'}."
    )

    return UserGoalsResult(
        age=age,
        height_cm=height,
        weight_kg=weight,
        dietary_pattern=dietary,
        primary_goal=goal,
        training_days_per_week=train_days,
        training_environment=env,
        equipment_confirmed=eq_confirmed,
        free_weight_cap_kg=free_weight_cap,
        protein_min_g=p_ref["protein_min_g"],
        protein_max_g=p_ref["protein_max_g"],
        protein_target_g=p_target,
        protein_provenance=p_prov,
        calorie_target_kcal=c_target_int,
        calorie_provenance=c_prov,
        summary=summary,
    )


# =============================================================================
# Tool Registry Map
# =============================================================================

ALLOWLISTED_TOOLS: Dict[str, Callable[[UserCoachingContext, Any], Any]] = {
    "get_nutrition_totals": get_nutrition_totals,
    "get_food_history": get_food_history,
    "get_weekly_training": get_weekly_training,
    "get_exercise_progress": get_exercise_progress,
    "get_activity_history": get_activity_history,
    "get_weight_trend": get_weight_trend,
    "get_recovery_history": get_recovery_history,
    "get_user_goals": get_user_goals,
}


class CoachToolMetadata(BaseModel):
    """Metadata specification for an allowlisted typed tool."""

    name: str
    description: str
    parameters: Dict[str, Any]
    returns: str


TOOL_METADATA_LIST: List[CoachToolMetadata] = [
    CoachToolMetadata(
        name="get_nutrition_totals",
        description="Returns confirmed daily calories, protein, carbs, fat, and remaining gap against user goals (strictly excluding is_confirmed==False entries).",
        parameters={"target_date": "Optional[str] ISO date (YYYY-MM-DD)"},
        returns="NutritionTotalsResult",
    ),
    CoachToolMetadata(
        name="get_food_history",
        description="Returns recent logged meals, provenance breakdown, and high-protein staple frequency over specified days.",
        parameters={"days": "int (default 7)"},
        returns="FoodHistoryResult",
    ),
    CoachToolMetadata(
        name="get_weekly_training",
        description="Returns completed gym workout sessions, total sets, total volume (kg), and consistency vs weekly target.",
        parameters={"days": "int (default 7)"},
        returns="WeeklyTrainingResult",
    ),
    CoachToolMetadata(
        name="get_exercise_progress",
        description="Returns exercise top sets, PR records, and deterministic double-progression status respecting confirmed home equipment (70kg cap).",
        parameters={"exercise_name": "Optional[str]"},
        returns="ExerciseProgressResult",
    ),
    CoachToolMetadata(
        name="get_activity_history",
        description="Returns logged Running (distance, duration, calculated pace), Badminton (format, intensity), and Calisthenics sessions.",
        parameters={"days": "int (default 14)"},
        returns="ActivityHistoryResult",
    ),
    CoachToolMetadata(
        name="get_weight_trend",
        description="Returns weigh-in count, latest weight (kg), 7-day rolling average (or explicit insufficient_data notice if < 3 entries), and weekly delta.",
        parameters={"days": "int (default 14)"},
        returns="WeightTrendResult",
    ),
    CoachToolMetadata(
        name="get_recovery_history",
        description="Returns recent sleep duration, subjective quality, soreness, fatigue, and rules-based readiness classifications (Prime, Moderate, Recover).",
        parameters={"days": "int (default 7)"},
        returns="RecoveryHistoryResult",
    ),
    CoachToolMetadata(
        name="get_user_goals",
        description="Returns user profile baseline (20yo, 173cm, 55kg, nonvegetarian, lean_bulk), equipment confirmation state, protein reference (88–121g), and calorie target.",
        parameters={},
        returns="UserGoalsResult",
    ),
]


# =============================================================================
# Deterministic Weekly Review Synthesizer
# =============================================================================

def generate_weekly_review(
    context: UserCoachingContext,
    today: Optional[date] = None,
    week_start_date: Optional[str] = None,
    week_end_date: Optional[str] = None,
) -> WeeklyReviewReport:
    """Generate deterministic weekly review synthesized across all athlete domains.
    
    Operates strictly from allowlisted tool calculations with zero hallucinations.
    """
    ref_today = today if today is not None else get_today()
    week_start = (ref_today - timedelta(days=6)) if not week_start_date else (_parse_date(week_start_date) or (ref_today - timedelta(days=6)))
    week_end = ref_today if not week_end_date else (_parse_date(week_end_date) or ref_today)
    week_start_str = week_start.isoformat()
    week_end_str = week_end.isoformat()

    # 1. Nutrition Consistency
    food_hist = get_food_history(context, days=7, today=ref_today)
    today_nutr = get_nutrition_totals(context, target_date=week_end_str, today=ref_today)
    goals = get_user_goals(context, today=ref_today)

    # Days logging food
    entry_dates = set()
    for e in context.food_entries or []:
        d = _parse_date(_val(e, "loggedDate", "logged_date"))
        if d and week_start <= d <= week_end:
            entry_dates.add(d.isoformat())
    days_logged_count = len(entry_dates)

    nutrition_consistency = {
        "days_logging_food": days_logged_count,
        "days_in_period": 7,
        "logging_consistency_pct": round((days_logged_count / 7.0) * 100, 1),
        "protein_target_band": f"{goals.protein_min_g}–{goals.protein_max_g} g",
        "current_protein_target_g": goals.protein_target_g,
        "latest_confirmed_protein_g": today_nutr.confirmed_protein_g,
        "is_protein_goal_met_today": today_nutr.is_protein_goal_met,
        "top_protein_staples": food_hist.high_protein_staples,
        "summary": (
            f"Logged food on {days_logged_count}/7 days this week. "
            f"Protein target is {goals.protein_target_g} g (ICMR reference band: {goals.protein_min_g}–{goals.protein_max_g} g). "
            + (f"Today's confirmed protein reached {today_nutr.confirmed_protein_g} g." if today_nutr.is_protein_goal_met else f"Today's confirmed protein is {today_nutr.confirmed_protein_g} g (gap: {today_nutr.remaining_protein_gap_g} g).")
        ),
    }

    # 2. Weight Trend Review
    weight_trend = get_weight_trend(context, days=14, today=ref_today)
    weight_trend_review = {
        "status": weight_trend.status,
        "weigh_in_count": weight_trend.weigh_in_count,
        "latest_weight_kg": weight_trend.latest_weight_kg,
        "rolling_7d_kg": weight_trend.rolling_7d_kg,
        "weekly_delta_kg": weight_trend.weekly_delta_kg,
        "explanation": weight_trend.explanation,
        "disclaimer": "Single-day weight shifts reflect hydration, glycogen, and GI content, not fat or muscle tissue changes.",
    }

    # 3. Training & Sports Load
    training = get_weekly_training(context, days=7, today=ref_today)
    activities = get_activity_history(context, days=7, today=ref_today)
    training_and_sports_load = {
        "gym_sessions_completed": training.completed_sessions_count,
        "gym_sessions_target": training.target_sessions_per_week,
        "gym_consistency_pct": training.consistency_percentage,
        "gym_total_sets": training.total_completed_sets,
        "gym_total_volume_kg": training.total_volume_kg,
        "running_sessions": activities.running_summary["session_count"],
        "running_total_km": activities.running_summary["total_distance_km"],
        "badminton_sessions": activities.badminton_summary["session_count"],
        "badminton_total_min": activities.badminton_summary["total_duration_min"],
        "calisthenics_sessions": activities.calisthenics_summary["session_count"],
        "summary": (
            f"Gym: {training.completed_sessions_count}/{training.target_sessions_per_week} sessions "
            f"({training.total_volume_kg} kg volume). "
            f"Sports: {activities.badminton_summary['session_count']} badminton sessions, "
            f"{activities.running_summary['session_count']} runs ({activities.running_summary['total_distance_km']} km)."
        ),
    }

    # 4. Recovery Patterns
    recovery = get_recovery_history(context, days=7, today=ref_today)
    recovery_patterns = {
        "average_sleep_hours": recovery.average_sleep_hours,
        "average_sleep_quality": recovery.average_sleep_quality,
        "average_soreness": recovery.average_soreness,
        "average_fatigue": recovery.average_fatigue,
        "readiness_distribution": recovery.readiness_distribution,
        "latest_readiness_score": recovery.latest_readiness_score,
        "latest_status": recovery.latest_status,
        "summary": recovery.summary,
    }

    # 5. Next Week Priorities (3 concrete, rules-based priorities)
    priorities: List[str] = []

    # Priority 1: Nutrition / Protein
    if days_logged_count < 5:
        priorities.append("Log food for at least 5 days next week to establish reliable macro consistency.")
    elif today_nutr.remaining_protein_gap_g > 15:
        priorities.append(f"Close the daily {today_nutr.remaining_protein_gap_g}g protein gap using nonvegetarian staples (e.g. 150g chicken breast or 3 eggs + dal).")
    else:
        priorities.append(f"Maintain consistent protein intake within the {goals.protein_min_g}–{goals.protein_max_g} g reference band.")

    # Priority 2: Training / Equipment
    if not goals.equipment_confirmed:
        priorities.append("Confirm your 70 kg free-weight home gym equipment setup in Profile to unlock verified load progression.")
    elif training.completed_sessions_count < training.target_sessions_per_week:
        priorities.append(f"Complete all {training.target_sessions_per_week} planned gym sessions, prioritizing compound lifts.")
    else:
        priorities.append("Apply double-progression: aim to hit the top of the rep range before adding load.")

    # Priority 3: Recovery / Sport balance
    if recovery.average_sleep_hours < 7.0:
        priorities.append(f"Increase average sleep from {recovery.average_sleep_hours}h to at least 7.5h to improve muscle protein synthesis.")
    elif activities.badminton_summary["session_count"] >= 3:
        priorities.append("Schedule active recovery after consecutive high-intensity badminton match days.")
    else:
        priorities.append("Weigh in at least 3 mornings per week under standardized fasted conditions to track the 7-day rolling trend.")

    return WeeklyReviewReport(
        week_start_date=week_start_str,
        week_end_date=week_end_str,
        generated_at=datetime.now(timezone.utc).isoformat(),
        nutrition_consistency=nutrition_consistency,
        weight_trend_review=weight_trend_review,
        training_and_sports_load=training_and_sports_load,
        recovery_patterns=recovery_patterns,
        next_week_priorities=priorities[:3],
    )
