"""AthlonIQ Phase 4 — Provider-Independent AI Coach Service.

Provides:
  - Scoped intent & allowlisted tool selector (retrieves minimal necessary user data)
  - Medical safety guardrail (immediate escalation for clinical symptoms)
  - Gemini 2.5 Flash synthesis with structured output schema enforcement
  - 100% offline deterministic fallback synthesizer
  - Mandatory epistemic separation: facts, calculations, recommendations, missing data, and proposed actions
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.domain.coach_tools import (
    ALLOWLISTED_TOOLS,
    UserCoachingContext,
    NutritionTotalsResult,
    FoodHistoryResult,
    WeeklyTrainingResult,
    ExerciseProgressResult,
    ActivityHistoryResult,
    WeightTrendResult,
    RecoveryHistoryResult,
    UserGoalsResult,
    get_nutrition_totals,
    get_food_history,
    get_weekly_training,
    get_exercise_progress,
    get_activity_history,
    get_weight_trend,
    get_recovery_history,
    get_user_goals,
)
from app.schemas.coaching import CoachTurnResponse, ProposedAction

logger = logging.getLogger(__name__)

# Medical symptoms that trigger immediate safety notice
MEDICAL_SAFETY_TRIGGERS = [
    "chest pain",
    "dizziness",
    "dizzy",
    "sharp joint",
    "joint pain",
    "spinal injury",
    "spine pain",
    "fainting",
    "fainted",
    "rapid weight loss",
    "unexplained weight loss",
    "blackout",
    "heart palpitation",
    "palpitations",
    "severe pain",
    "numbness",
    "pinched nerve",
]


class CoachService:
    """Personal AI Coach orchestrator enforcing allowlisted tools and epistemic separation."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL or "gemini-2.5-flash"

    # =========================================================================
    # Step 1: Medical Safety Check & Scoped Tool Selection
    # =========================================================================

    def check_medical_safety(self, message: str) -> Optional[CoachTurnResponse]:
        """Check for acute symptoms requiring immediate professional medical escalation."""
        lowered = message.lower()
        matched = [trigger for trigger in MEDICAL_SAFETY_TRIGGERS if trigger in lowered]

        if matched:
            triggers_str = ", ".join(f"'{t}'" for t in matched)
            return CoachTurnResponse(
                reply_markdown=(
                    f"⚠️ **MEDICAL SAFETY WARNING**: Your message mentions acute symptoms ({triggers_str}). "
                    "AthlonIQ AI Coach is an athletic performance optimizer, not a clinical diagnostic medical device. "
                    "**Do not attempt to train through sharp spinal or joint pain, chest tightness, or dizziness.** "
                    "Please pause training immediately and consult a qualified medical professional, sports doctor, or physiotherapist."
                ),
                tools_used=[],
                facts_from_tools=[],
                app_calculations=["Safety filter triggered: potential clinical symptom detected in user query."],
                recommendations=[
                    "Cease high-intensity exercise and heavy loading immediately.",
                    "Seek clinical evaluation from a physician or licensed physiotherapist.",
                    "Do not attempt aggressive loading or fatigue testing while symptomatic.",
                ],
                missing_or_uncertain=[
                    "Clinical physical diagnosis required. AI models cannot evaluate physiological pathology or injury severity."
                ],
                proposed_action=None,
            )
        return None

    def select_tools_for_query(self, message: str) -> List[str]:
        """Scope the user's prompt to the minimum necessary allowlisted tools."""
        msg = message.lower()
        selected: List[str] = []

        # 1. Nutrition & Protein
        if any(w in msg for w in ["protein", "calorie", "calories", "eat", "ate", "macro", "macros", "diet", "meal", "food", "dinner", "lunch", "breakfast", "snack"]):
            selected.append("get_nutrition_totals")
            selected.append("get_user_goals")
            if any(w in msg for w in ["history", "consistent", "consistency", "staple", "suggest", "practical", "idea"]):
                selected.append("get_food_history")

        # 2. Workout & Progression
        if any(w in msg for w in ["training", "workout", "gym", "volume", "session", "bench", "squat", "pr", "overload", "progression", "improved", "stronger", "lift", "exercise", "sets"]):
            if "get_weekly_training" not in selected:
                selected.append("get_weekly_training")
            if any(w in msg for w in ["bench", "squat", "exercise", "improved", "pr", "progression", "overload", "load"]):
                selected.append("get_exercise_progress")
            if "get_user_goals" not in selected:
                selected.append("get_user_goals")

        # 3. Running & Badminton & Calisthenics
        if any(w in msg for w in ["run", "running", "badminton", "calisthenics", "activity", "sport", "match", "pace", "cardio"]):
            if "get_activity_history" not in selected:
                selected.append("get_activity_history")
            if "get_weekly_training" not in selected:
                selected.append("get_weekly_training")

        # 4. Recovery & Readiness
        if any(w in msg for w in ["recovery", "sleep", "soreness", "fatigue", "readiness", "rest", "train today", "what should i train", "tired"]):
            if "get_recovery_history" not in selected:
                selected.append("get_recovery_history")
            if "get_weekly_training" not in selected:
                selected.append("get_weekly_training")
            if "get_user_goals" not in selected:
                selected.append("get_user_goals")

        # 5. Weight & Body Composition
        if any(w in msg for w in ["weight", "weigh", "scale", "trend", "rolling", "kg", "fat", "bulk", "physique"]):
            if "get_weight_trend" not in selected:
                selected.append("get_weight_trend")
            if "get_user_goals" not in selected:
                selected.append("get_user_goals")

        # 6. Weekly Summary / Review
        if any(w in msg for w in ["summarize", "summary", "week", "review", "priorities", "four weeks", "last week"]):
            for t in ["get_weekly_training", "get_nutrition_totals", "get_recovery_history", "get_weight_trend"]:
                if t not in selected:
                    selected.append(t)

        # Fallback if nothing matched
        if not selected:
            selected = ["get_user_goals", "get_recovery_history"]

        # Preserve order while deduplicating
        deduped = []
        for s in selected:
            if s in ALLOWLISTED_TOOLS and s not in deduped:
                deduped.append(s)

        return deduped

    # =========================================================================
    # Step 2: Tool Execution
    # =========================================================================

    def execute_tools(
        self, tool_names: List[str], context: UserCoachingContext
    ) -> Dict[str, Any]:
        """Execute selected allowlisted tools against user-scoped context."""
        results: Dict[str, Any] = {}
        for name in tool_names:
            tool_fn = ALLOWLISTED_TOOLS.get(name)
            if tool_fn:
                try:
                    res = tool_fn(context)
                    results[name] = res.model_dump() if hasattr(res, "model_dump") else res
                except Exception as exc:
                    logger.warning(f"Error executing tool {name}: {exc}")
                    results[name] = {"error": str(exc)}
        return results

    # =========================================================================
    # Step 3: LLM Synthesis with Deterministic Fallback
    # =========================================================================

    async def chat(
        self, message: str, context: Optional[UserCoachingContext] = None
    ) -> CoachTurnResponse:
        """Process chat turn with safety checks, tool scoping, LLM/deterministic synthesis."""
        # 1. Medical safety guardrail
        safety_response = self.check_medical_safety(message)
        if safety_response:
            return safety_response

        # Ensure active context
        ctx = context or UserCoachingContext()

        # 2. Select and execute scoped tools
        tools_to_run = self.select_tools_for_query(message)
        tool_outputs = self.execute_tools(tools_to_run, ctx)

        # 3. Attempt Gemini LLM Synthesis if key is configured
        if self.api_key:
            try:
                llm_response = await self._synthesize_with_gemini(message, tools_to_run, tool_outputs)
                if llm_response:
                    return llm_response
            except Exception as exc:
                logger.warning(f"Gemini coach synthesis failed, falling back to deterministic synthesizer: {exc}")

        # 4. Deterministic Tool-Grounded Synthesizer Fallback
        return self._synthesize_deterministically(message, tools_to_run, tool_outputs, ctx)

    async def _synthesize_with_gemini(
        self, message: str, tools_used: List[str], tool_outputs: Dict[str, Any]
    ) -> Optional[CoachTurnResponse]:
        """Synthesize response via Gemini 2.5 Flash using structured output."""
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            system_instruction = (
                "You are AthlonIQ's Personal AI Performance & Biomechanics Coach. "
                "You provide precise, evidence-grounded athletic guidance for a 20yo, 55kg, 173cm nonvegetarian athlete "
                "aiming for a lean bulk with a 5-day home gym setup (70kg free-weight cap), plus running, badminton, and calisthenics. "
                "CRITICAL PRINCIPLES:\n"
                "1. Epistemic Separation: Distinguish verified facts from logs, deterministic calculations, and recommendations.\n"
                "2. Equipment Constraints: Respect the 70kg free-weight home gym cap and whether equipment is confirmed.\n"
                "3. Provenance: Unconfirmed nutrition entries must never be treated as confirmed.\n"
                "4. You must output a JSON object adhering to this exact schema:\n"
                "{\n"
                '  "reply_markdown": "Concise coaching response in markdown",\n'
                '  "facts_from_tools": ["verified fact 1", "verified fact 2"],\n'
                '  "app_calculations": ["calculated math 1", "calculated math 2"],\n'
                '  "recommendations": ["actionable advice 1", "actionable advice 2"],\n'
                '  "missing_or_uncertain": ["missing data note or equipment unconfirmed notice"],\n'
                '  "proposed_action": null or {"type": "log_meal"|"update_protein_target"|"apply_progression", "summary": "...", "payload": {...}}\n'
                "}"
            )

            prompt = (
                f"Athlete Question: {message}\n\n"
                f"Allowlisted Tool Outputs:\n{json.dumps(tool_outputs, indent=2)}\n\n"
                "Synthesize a grounded coaching response matching the required JSON format."
            )

            response = client.models.generate_content(
                model=self.model_name,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.3,
                ),
            )

            raw_text = getattr(response, "text", "") or ""
            clean_text = raw_text.strip()
            if clean_text.startswith("```"):
                clean_text = re.sub(r"^```(?:json)?\s*", "", clean_text, flags=re.IGNORECASE)
                clean_text = re.sub(r"\s*```$", "", clean_text).strip()

            parsed = json.loads(clean_text)

            proposed = None
            if parsed.get("proposed_action"):
                p = parsed["proposed_action"]
                proposed = ProposedAction(
                    type=p.get("type", "log_meal"),
                    summary=p.get("summary", ""),
                    payload=p.get("payload", {}),
                )

            return CoachTurnResponse(
                reply_markdown=parsed.get("reply_markdown", "Coaching response generated."),
                tools_used=tools_used,
                facts_from_tools=parsed.get("facts_from_tools", []),
                app_calculations=parsed.get("app_calculations", []),
                recommendations=parsed.get("recommendations", []),
                missing_or_uncertain=parsed.get("missing_or_uncertain", []),
                proposed_action=proposed,
            )
        except Exception as exc:
            logger.warning(f"Error calling Gemini: {exc}")
            return None

    def _synthesize_deterministically(
        self,
        message: str,
        tools_used: List[str],
        tool_outputs: Dict[str, Any],
        context: UserCoachingContext,
    ) -> CoachTurnResponse:
        """Deterministic Tool-Grounded Synthesizer operating 100% offline."""
        lowered = message.lower()
        facts: List[str] = []
        calculations: List[str] = []
        recommendations: List[str] = []
        missing_or_uncertain: List[str] = []
        proposed_action: Optional[ProposedAction] = None
        reply_parts: List[str] = []

        # ---------------------------------------------------------------------
        # 1. Nutrition & Protein Synthesis
        # ---------------------------------------------------------------------
        if "get_nutrition_totals" in tool_outputs:
            nutr: Dict[str, Any] = tool_outputs["get_nutrition_totals"]
            conf_pro = nutr.get("confirmed_protein_g", 0.0)
            conf_cal = nutr.get("confirmed_calories_kcal", 0.0)
            pro_target = nutr.get("protein_target_g", 110.0)
            pro_gap = nutr.get("remaining_protein_gap_g", 0.0)
            ex_unconf = nutr.get("excluded_unconfirmed_count", 0)

            facts.append(f"Confirmed protein logged: {conf_pro} g ({conf_cal} kcal) across {nutr.get('confirmed_entries_count', 0)} confirmed entries.")
            calculations.append(f"Protein gap against {pro_target} g target: {pro_gap} g.")

            if ex_unconf > 0:
                missing_or_uncertain.append(f"{ex_unconf} unconfirmed meal photo estimates excluded from confirmed totals.")

            if "protein" in lowered or "eat" in lowered or "nutrition" in lowered:
                if nutr.get("is_protein_goal_met", False):
                    reply_parts.append(f"You have reached your protein target today with **{conf_pro} g** confirmed protein.")
                    recommendations.append("Protein target achieved for today. Focus on hydration and restful sleep.")
                else:
                    reply_parts.append(
                        f"You have logged **{conf_pro} g** of confirmed protein today. "
                        f"Your remaining gap is **{pro_gap} g** to reach your **{pro_target} g** target."
                    )
                    # Suggest practical nonvegetarian meal
                    rec_meal = "150g grilled chicken breast (46.5g protein) with 1 katori dal and 2 rotis"
                    reply_parts.append(f"\n\n**Practical Meal Idea**: {rec_meal} will cleanly close your remaining {pro_gap}g gap.")
                    recommendations.append(f"Consume a high-protein nonvegetarian meal (e.g., 150g cooked chicken breast, eggs, or paneer + dal) to close the {pro_gap}g gap.")

                    proposed_action = ProposedAction(
                        type="log_meal",
                        summary=f"Log high-protein dinner: 150g Cooked Chicken Breast + Dal + Rotis ({round(min(50.0, max(25.0, pro_gap)), 1)}g protein)",
                        payload={
                            "food_name": "Cooked Chicken Breast (150g) + Dal + Rotis",
                            "meal_slot": "dinner",
                            "quantity": 1.0,
                            "calories_kcal": 420.0,
                            "protein_g": round(min(50.0, max(25.0, pro_gap)), 1),
                            "carbs_g": 35.0,
                            "fat_g": 6.5,
                            "is_confirmed": True,
                            "provenance": "verified_reference",
                        },
                    )

        # ---------------------------------------------------------------------
        # 2. Workout & Progression Synthesis
        # ---------------------------------------------------------------------
        if "get_weekly_training" in tool_outputs:
            train: Dict[str, Any] = tool_outputs["get_weekly_training"]
            comp = train.get("completed_sessions_count", 0)
            target = train.get("target_sessions_per_week", 5)
            vol = train.get("total_volume_kg", 0.0)
            sets = train.get("total_completed_sets", 0)

            facts.append(f"Gym sessions completed: {comp}/{target} ({sets} total working sets).")
            calculations.append(f"External lifting volume accumulated: {vol} kg ({train.get('consistency_percentage', 0)}% weekly consistency).")

            if any(w in lowered for w in ["training", "workout", "progressed", "consistency", "four weeks", "summarize"]):
                reply_parts.append(
                    f"You have completed **{comp} of {target}** planned gym sessions this week, "
                    f"accumulating **{sets} sets** and **{vol} kg** of external load volume."
                )

        if "get_exercise_progress" in tool_outputs:
            ex: Dict[str, Any] = tool_outputs["get_exercise_progress"]
            ex_name = ex.get("exercise_name", "Barbell Bench Press")
            top_load = ex.get("top_load_kg", 50.0)
            top_reps = ex.get("top_reps", 8)
            action = ex.get("progression_action", "maintain")
            expl = ex.get("progression_explanation", "")
            eq_conf = ex.get("equipment_confirmed", False)

            facts.append(f"Top set for {ex_name}: {top_load} kg x {top_reps} reps (Est 1RM: {ex.get('estimated_1rm_kg')} kg).")
            calculations.append(f"Double-progression status: {action}.")

            if not eq_conf:
                missing_or_uncertain.append("Home gym equipment setup not yet verified in Profile; load progressions gated.")
                recommendations.append("Confirm your 70 kg free-weight equipment setup in Profile → Equipment to unlock verified auto-progression.")
            else:
                recommendations.append(f"Progression recommendation: {action} — {expl}")

            if "exercise" in lowered or "improved" in lowered or "bench" in lowered or "progression" in lowered:
                reply_parts.append(
                    f"\n\n**Exercise Focus ({ex_name})**: Top set logged at **{top_load} kg x {top_reps} reps**. "
                    f"{expl}"
                )
                if ex.get("suggested_new_load_kg") and eq_conf:
                    new_load = ex["suggested_new_load_kg"]
                    proposed_action = ProposedAction(
                        type="apply_progression",
                        summary=f"Increase {ex_name} working load to {new_load} kg next session",
                        payload={"exercise_name": ex_name, "new_load_kg": new_load},
                    )

        # ---------------------------------------------------------------------
        # 3. Recovery & "What should I train today" Synthesis
        # ---------------------------------------------------------------------
        if "get_recovery_history" in tool_outputs:
            rec: Dict[str, Any] = tool_outputs["get_recovery_history"]
            score = rec.get("latest_readiness_score", 75)
            status = rec.get("latest_status", "Moderate")
            sleep = rec.get("average_sleep_hours", 7.5)
            sor = rec.get("average_soreness", 2.0)

            facts.append(f"Latest readiness check-in: {score}% ({status}). Average sleep: {sleep}h (Soreness: {sor}/5).")
            calculations.append(f"Readiness classification: {status}.")

            if "what should i train" in lowered or "train today" in lowered or "recovery" in lowered:
                if status == "Prime":
                    reply_parts.append(
                        f"Your readiness score is **{score}% ({status})** with high neuromuscular recovery. "
                        "Today is optimal for primary compound lifts (e.g. Heavy Push/Pull). Aim for RPE 8.0–8.5."
                    )
                    recommendations.append("Execute planned primary compounds with standard working loads.")
                elif status == "Moderate":
                    reply_parts.append(
                        f"Your readiness score is **{score}% ({status})**. "
                        "Train with normal volume, keeping working sets strictly between RPE 7.5–8.5 and taking 2–3 minutes rest between compound sets."
                    )
                    recommendations.append("Maintain RPE 7.5–8.5; keep compound rest intervals >= 120s.")
                else:
                    reply_parts.append(
                        f"Your readiness score is **{score}% ({status})** signaling accumulated systemic fatigue. "
                        "Prioritize active recovery, mobility, or a light calisthenics session rather than heavy spine/joint loading."
                    )
                    recommendations.append("Deload working sets by 10% or substitute with mobility and light active recovery.")

        # ---------------------------------------------------------------------
        # 4. Activity History (Badminton & Running)
        # ---------------------------------------------------------------------
        if "get_activity_history" in tool_outputs:
            act: Dict[str, Any] = tool_outputs["get_activity_history"]
            b_count = act.get("badminton_summary", {}).get("session_count", 0)
            r_count = act.get("running_summary", {}).get("session_count", 0)
            r_km = act.get("running_summary", {}).get("total_distance_km", 0.0)

            facts.append(f"Sport activities: {b_count} badminton sessions, {r_count} runs ({r_km} km).")

            if ("train today" in lowered or "activity" in lowered or "badminton" in lowered) and b_count > 0:
                recommendations.append(f"Account for eccentric calf and shoulder strain from your recent {b_count} badminton session(s).")

        # ---------------------------------------------------------------------
        # 5. Weight Trend Synthesis
        # ---------------------------------------------------------------------
        if "get_weight_trend" in tool_outputs:
            wt: Dict[str, Any] = tool_outputs["get_weight_trend"]
            wt_st = wt.get("status", "insufficient_data")
            latest_w = wt.get("latest_weight_kg")
            weigh_count = wt.get("weigh_in_count", 0)

            facts.append(f"Weigh-ins logged: {weigh_count}. Latest weight: {latest_w} kg.")

            if wt_st == "insufficient_data":
                missing_or_uncertain.append("Fewer than 3 weigh-ins logged; 7-day rolling trend cannot be established.")
                calculations.append("Insufficient weigh-ins for rolling average (< 3 entries).")
                recommendations.append("Weigh in at least 3 mornings per week under fasted conditions to build a valid trend.")
            else:
                calculations.append(f"7-day rolling weight: {wt.get('rolling_7d_kg')} kg (Weekly delta: {wt.get('weekly_delta_kg')} kg).")

            if "weight" in lowered or "trend" in lowered or "bulk" in lowered:
                reply_parts.append(f"\n\n**Weight Trend**: {wt.get('explanation')}")

        # ---------------------------------------------------------------------
        # 6. User Goals Baseline
        # ---------------------------------------------------------------------
        if "get_user_goals" in tool_outputs:
            ug: Dict[str, Any] = tool_outputs["get_user_goals"]
            facts.append(f"Profile: 20yo, {ug.get('height_cm')}cm, {ug.get('weight_kg')}kg, {ug.get('dietary_pattern')}, goal: {ug.get('primary_goal')}.")
            calculations.append(f"ICMR protein reference band: {ug.get('protein_min_g')}–{ug.get('protein_max_g')} g (Target: {ug.get('protein_target_g')} g).")

        # Fallback recommendations if list is empty
        if not recommendations:
            recommendations.append("Maintain consistent training load and hit your daily protein target.")
        if not reply_parts:
            reply_parts.append(
                "I've synthesized your current logs. Your biometrics and recovery are steady. "
                "How would you like to optimize your workouts, nutrition, or recovery next?"
            )

        reply_markdown = "\n".join(reply_parts)

        return CoachTurnResponse(
            reply_markdown=reply_markdown,
            tools_used=tools_used,
            facts_from_tools=facts,
            app_calculations=calculations,
            recommendations=recommendations,
            missing_or_uncertain=missing_or_uncertain,
            proposed_action=proposed_action,
        )


coach_service = CoachService()
