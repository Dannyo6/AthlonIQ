-- ==============================================================================
-- AthlonIQ — Database Development Seed Data
-- ==============================================================================

-- 1. Standard Global Exercise Catalog
INSERT INTO public.exercises (name, category, primary_muscle, secondary_muscles, instructions, is_custom)
VALUES
    ('Barbell Back Squat', 'barbell', 'Quadriceps', ARRAY['Glutes', 'Hamstrings', 'Lower Back'], 'Maintain brace, break at knees and hips simultaneously, descend below parallel.', false),
    ('Conventional Deadlift', 'barbell', 'Hamstrings', ARRAY['Glutes', 'Erector Spinae', 'Lats', 'Forearms'], 'Hinge at the hips, keep bar close to shins, drive through the floor.', false),
    ('Barbell Bench Press', 'barbell', 'Chest', ARRAY['Triceps', 'Anterior Deltoids'], 'Retract scapulae, touch lower sternum, drive upward with leg drive.', false),
    ('Overhead Press', 'barbell', 'Shoulders', ARRAY['Triceps', 'Upper Chest', 'Core'], 'Strict press overhead from front rack position without leg drive.', false),
    ('Pull-Up', 'bodyweight', 'Lats', ARRAY['Biceps', 'Rhomboids', 'Forearms'], 'Full hang to chin over bar with controlled eccentric tempo.', false),
    ('Barbell Pendlay Row', 'barbell', 'Lats', ARRAY['Rhomboids', 'Biceps', 'Rear Deltoids'], 'Reset from floor on each repetition, explosive pull to lower sternum.', false),
    ('Romanian Deadlift', 'barbell', 'Hamstrings', ARRAY['Glutes', 'Lower Back'], 'Hinge hips backwards with slight knee bend until deep hamstring stretch.', false),
    ('Incline Dumbbell Press', 'dumbbell', 'Upper Chest', ARRAY['Triceps', 'Anterior Deltoids'], '30-degree incline angle, full stretch at bottom, strong contraction at top.', false),
    ('Dumbbell Lateral Raise', 'dumbbell', 'Side Deltoids', ARRAY['Traps'], 'Raise arms in scapular plane with slight forward tilt, lead with elbows.', false),
    ('Leg Press (45-degree)', 'machine', 'Quadriceps', ARRAY['Glutes'], 'Feet shoulder-width on platform, control descent without lumbar rounding.', false),
    ('Seated Cable Row', 'cable', 'Mid Back', ARRAY['Biceps', 'Lats'], 'Neutral grip, drive elbows past torso with chest held high.', false),
    ('Triceps Rope Pushdown', 'cable', 'Triceps', ARRAY[]::TEXT[], 'Elbows pinned to sides, flare rope outwards at peak contraction.', false),
    ('Incline Dumbbell Bicep Curl', 'dumbbell', 'Biceps', ARRAY['Forearms'], 'Sit on 60-degree incline for maximum bicep long-head stretch.', false),
    ('Hanging Leg Raise', 'bodyweight', 'Abdominals', ARRAY['Hip Flexors'], 'Controlled posterior pelvic tilt, raise toes toward bar without swinging.', false),
    ('Zone 2 Incline Treadmill Walk', 'cardio', 'Cardiovascular', ARRAY['Calves'], '12% incline at 5.0 km/h maintaining conversational heart rate.', false)
ON CONFLICT (name) DO NOTHING;
