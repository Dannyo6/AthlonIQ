import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { WorkoutSession, ExerciseSet } from "@/types";

export const ExerciseSetDbRowSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  exercise_name: z.string(),
  equipment_key: z.string().nullable().default(null),
  set_order: z.coerce.number().int().min(0),
  reps: z.coerce.number().int().min(0),
  load_kg: z.coerce.number().min(0).default(0),
  is_bodyweight: z.boolean().default(false),
  rpe: z.coerce.number().min(1).max(10).nullable().default(null),
  rir: z.coerce.number().int().min(0).max(10).nullable().default(null),
  is_completed: z.boolean().default(true),
  is_pr: z.boolean().default(false),
  notes: z.string().nullable().default(null),
});

export const WorkoutSessionDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  logged_date: z.string(),
  title: z.string(),
  template_id: z.string().uuid().nullable().default(null),
  duration_minutes: z.coerce.number().int().nullable().default(null),
  session_rpe: z.coerce.number().min(1).max(10).nullable().default(null),
  completed: z.boolean().default(true),
  notes: z.string().nullable().default(null),
});

export function mapDbSetToDomain(row: z.infer<typeof ExerciseSetDbRowSchema>): ExerciseSet {
  return {
    id: row.id,
    exerciseName: row.exercise_name,
    equipmentKey: row.equipment_key,
    setOrder: row.set_order,
    reps: row.reps,
    loadKg: row.load_kg,
    isBodyweight: row.is_bodyweight,
    rpe: row.rpe,
    rir: row.rir,
    isCompleted: row.is_completed,
    isPr: row.is_pr,
    notes: row.notes ?? undefined,
  };
}

export const workoutSessionsRepo = {
  async fetchSessions(userId: string): Promise<WorkoutSession[]> {
    const { data: sessionRows, error: sErr } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false });

    if (sErr) {
      throw new Error(`[workoutSessionsRepo] Error fetching sessions: ${sErr.message}`);
    }
    if (!sessionRows || sessionRows.length === 0) return [];

    const sessionIds = sessionRows.map((s) => s.id);
    const { data: setRows, error: setsErr } = await supabase
      .from("exercise_sets")
      .select("*")
      .eq("user_id", userId)
      .in("session_id", sessionIds)
      .order("set_order", { ascending: true });

    if (setsErr) {
      throw new Error(`[workoutSessionsRepo] Error fetching exercise sets: ${setsErr.message}`);
    }

    const setsBySession: Record<string, ExerciseSet[]> = {};
    (setRows || []).forEach((row) => {
      const validated = ExerciseSetDbRowSchema.parse(row);
      setsBySession[validated.session_id] = setsBySession[validated.session_id] || [];
      setsBySession[validated.session_id].push(mapDbSetToDomain(validated));
    });

    return sessionRows.map((row) => {
      const validated = WorkoutSessionDbRowSchema.parse(row);
      return {
        id: validated.id,
        loggedDate: validated.logged_date,
        title: validated.title,
        templateId: validated.template_id,
        durationMinutes: validated.duration_minutes,
        sessionRpe: validated.session_rpe,
        completed: validated.completed,
        notes: validated.notes ?? undefined,
        sets: setsBySession[validated.id] || [],
      };
    });
  },

  async saveSession(userId: string, session: WorkoutSession): Promise<WorkoutSession> {
    const sessionPayload = {
      ...(session.id && !session.id.startsWith("wk-") ? { id: session.id } : {}),
      user_id: userId,
      logged_date: session.loggedDate,
      title: session.title,
      template_id: session.templateId && !session.templateId.startsWith("tpl-") ? session.templateId : null,
      duration_minutes: session.durationMinutes ?? null,
      session_rpe: session.sessionRpe ?? null,
      completed: session.completed,
      notes: session.notes ?? null,
    };

    const { data: savedSessionRow, error: sErr } = await supabase
      .from("workout_sessions")
      .upsert(sessionPayload)
      .select()
      .single();

    if (sErr) {
      throw new Error(`[workoutSessionsRepo] Error saving session: ${sErr.message}`);
    }

    const validatedSession = WorkoutSessionDbRowSchema.parse(savedSessionRow);
    const assignedSessionId = validatedSession.id;

    // Delete existing sets for this session to ensure clean sync
    await supabase.from("exercise_sets").delete().eq("session_id", assignedSessionId).eq("user_id", userId);

    const savedSets: ExerciseSet[] = [];
    if (session.sets && session.sets.length > 0) {
      const setsPayload = session.sets.map((set, idx) => ({
        session_id: assignedSessionId,
        user_id: userId,
        exercise_name: set.exerciseName,
        equipment_key: set.equipmentKey || null,
        set_order: set.setOrder !== undefined ? set.setOrder : idx + 1,
        reps: set.reps,
        load_kg: set.loadKg,
        is_bodyweight: !!set.isBodyweight,
        rpe: set.rpe || null,
        rir: set.rir !== undefined ? set.rir : null,
        is_completed: set.isCompleted !== false,
        is_pr: !!set.isPr,
        notes: set.notes || null,
      }));

      const { data: setRows, error: setsErr } = await supabase
        .from("exercise_sets")
        .insert(setsPayload)
        .select();

      if (setsErr) {
        throw new Error(`[workoutSessionsRepo] Error inserting sets: ${setsErr.message}`);
      }

      (setRows || []).forEach((row) => {
        savedSets.push(mapDbSetToDomain(ExerciseSetDbRowSchema.parse(row)));
      });
    }

    return {
      id: assignedSessionId,
      loggedDate: validatedSession.logged_date,
      title: validatedSession.title,
      templateId: validatedSession.template_id,
      durationMinutes: validatedSession.duration_minutes,
      sessionRpe: validatedSession.session_rpe,
      completed: validatedSession.completed,
      notes: validatedSession.notes ?? undefined,
      sets: savedSets,
    };
  },

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const { error } = await supabase
      .from("workout_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`[workoutSessionsRepo] Error deleting session: ${error.message}`);
    }
  },
};
