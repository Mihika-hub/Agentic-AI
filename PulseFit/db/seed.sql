-- PulseFit sample data. Safe to run many times: rows are matched by their unique
-- name/title and updated in place, so nothing is ever duplicated.

INSERT INTO exercises (name, muscle_group, sets, reps, difficulty, rest_seconds, description) VALUES
  -- Chest
  ('Barbell Bench Press',     'Chest',  4, '6-8',       'Advanced',     120, 'Flat bench, bar to mid-chest, drive up with feet planted and shoulder blades pinned.'),
  ('Incline Dumbbell Press',  'Chest',  3, '8-10',      'Intermediate',  90, 'Bench at 30 degrees. Press up and slightly in, lower slowly to a deep stretch.'),
  ('Tempo Push-Ups',          'Chest',  3, '12-15',     'Beginner',      60, 'Three seconds down, one second up. Keep a straight line from head to heels.'),
  ('Cable Chest Fly',         'Chest',  3, '12',        'Intermediate',  60, 'Soft elbows, hug a big tree and squeeze the chest at the middle.'),
  ('Weighted Dips',           'Chest',  3, '8-10',      'Advanced',      90, 'Lean forward slightly to bias the chest. Lower until shoulders are just below elbows.'),
  -- Back
  ('Conventional Deadlift',   'Back',   5, '5',         'Advanced',     180, 'Bar over mid-foot, brace hard, push the floor away and lock out with the glutes.'),
  ('Weighted Pull-Ups',       'Back',   4, '6-8',       'Advanced',     120, 'Full hang to chin over bar. Add load with a belt once bodyweight reps feel easy.'),
  ('Seated Cable Row',        'Back',   3, '10-12',     'Beginner',      75, 'Chest tall, pull the handle to your belly and squeeze shoulder blades together.'),
  ('Lat Pulldown',            'Back',   3, '10-12',     'Beginner',      75, 'Pull the bar to your upper chest, elbows driving down toward your back pockets.'),
  ('Bent-Over Barbell Row',   'Back',   4, '8',         'Intermediate',  90, 'Hinge to about 45 degrees and row the bar to your lower ribs without jerking.'),
  -- Legs
  ('Back Squat',              'Legs',   5, '5',         'Advanced',     180, 'Bar on upper back, sit down between your heels, knees track over toes.'),
  ('Romanian Deadlift',       'Legs',   4, '8',         'Intermediate', 120, 'Soft knees, push hips back until you feel the hamstrings, then stand tall.'),
  ('Walking Lunges',          'Legs',   3, '12 / leg',  'Beginner',      60, 'Long steps, back knee kisses the floor, push through the front heel.'),
  ('Leg Press',               'Legs',   4, '10-12',     'Beginner',      90, 'Feet shoulder width, lower until knees reach 90 degrees, do not lock out hard.'),
  ('Bulgarian Split Squat',   'Legs',   3, '10 / leg',  'Intermediate',  75, 'Rear foot on a bench, drop straight down, keep the torso proud.'),
  -- Arms
  ('Incline Dumbbell Curl',   'Arms',   3, '10-12',     'Beginner',      60, 'Lie back on an incline bench so the arms hang behind you for a big biceps stretch.'),
  ('EZ-Bar Skull Crushers',   'Arms',   3, '10',        'Intermediate',  75, 'Lower the bar to your forehead with elbows pointing up, then extend.'),
  ('Hammer Curls',            'Arms',   3, '12',        'Beginner',      60, 'Neutral grip, curl without swinging to build forearms and brachialis.'),
  ('Close-Grip Bench Press',  'Arms',   4, '8',         'Advanced',      90, 'Hands shoulder width, elbows tucked, press with the triceps.'),
  ('Cable Triceps Pushdown',  'Arms',   3, '12-15',     'Beginner',      45, 'Elbows glued to your sides, push the rope down and spread it at the bottom.'),
  -- Core
  ('Plank Hold',              'Core',   3, '60 sec',    'Beginner',      45, 'Forearms down, squeeze glutes and pull belly button in. Do not let hips sag.'),
  ('Hanging Leg Raises',      'Core',   3, '10-12',     'Intermediate',  60, 'Hang from a bar and lift straight legs to hip height without swinging.'),
  ('Ab Wheel Rollouts',       'Core',   3, '8-10',      'Advanced',      75, 'Roll out as far as you can keep a flat back, then pull back with the abs.'),
  ('Dead Bug',                'Core',   3, '10 / side', 'Beginner',      45, 'Lower back pressed down, extend the opposite arm and leg slowly.'),
  ('Cable Woodchopper',       'Core',   3, '12 / side', 'Intermediate',  60, 'Rotate through the torso from high to low with straight arms.'),
  -- Cardio
  ('Rower Intervals',         'Cardio', 8, '250 m',     'Intermediate',  60, 'Hard 250 m pieces. Legs, then body, then arms on every stroke.'),
  ('Sled Push Sprints',       'Cardio', 6, '20 m',      'Advanced',      90, 'Low body angle, short powerful steps, drive through the balls of your feet.'),
  ('Jump Rope Rounds',        'Cardio', 5, '90 sec',    'Beginner',      45, 'Light bounces on the balls of your feet, wrists do the turning.'),
  ('Assault Bike Sprints',    'Cardio', 8, '20 sec',    'Advanced',      70, 'All-out 20 second efforts. Push and pull with arms and legs together.'),
  ('Incline Treadmill Walk',  'Cardio', 3, '8 min',     'Beginner',      60, '10 to 12 percent incline at a brisk pace. No holding the rails.')
ON CONFLICT (name) DO UPDATE SET
  muscle_group = EXCLUDED.muscle_group,
  sets         = EXCLUDED.sets,
  reps         = EXCLUDED.reps,
  difficulty   = EXCLUDED.difficulty,
  rest_seconds = EXCLUDED.rest_seconds,
  description  = EXCLUDED.description;

-- Ten classes spread across the current week (Monday start). Re-running this
-- file moves them into whatever week it is run in.
INSERT INTO classes (title, coach_name, start_time, duration_minutes, capacity, intensity) VALUES
  ('Sunrise HIIT Burn',     'Maya Chen',     date_trunc('week', now()) + interval '0 days 06:30', 45, 20, 'High'),
  ('Lunchtime Yoga Flow',   'Priya Nair',    date_trunc('week', now()) + interval '0 days 12:15', 50, 18, 'Low'),
  ('Climb & Sprint Spin',   'Jonas Berg',    date_trunc('week', now()) + interval '1 days 07:00', 45, 24, 'High'),
  ('Boxing Fundamentals',   'Marcus Cole',   date_trunc('week', now()) + interval '1 days 18:30', 60, 16, 'Medium'),
  ('Strength Foundations',  'Sofia Alvarez', date_trunc('week', now()) + interval '2 days 17:45', 55, 14, 'Medium'),
  ('Power Vinyasa Yoga',    'Lena Ortiz',    date_trunc('week', now()) + interval '3 days 07:00', 60, 18, 'Medium'),
  ('Tabata HIIT Inferno',   'Maya Chen',     date_trunc('week', now()) + interval '3 days 18:00', 30, 20, 'High'),
  ('Rhythm Ride Spin',      'Jonas Berg',    date_trunc('week', now()) + interval '4 days 06:30', 45, 24, 'Medium'),
  ('Heavy Bag Boxing',      'Marcus Cole',   date_trunc('week', now()) + interval '5 days 09:00', 45, 16, 'High'),
  ('Slow Flow & Breath',    'Lena Ortiz',    date_trunc('week', now()) + interval '6 days 10:30', 75, 18, 'Low')
ON CONFLICT (title) DO UPDATE SET
  coach_name       = EXCLUDED.coach_name,
  start_time       = EXCLUDED.start_time,
  duration_minutes = EXCLUDED.duration_minutes,
  capacity         = EXCLUDED.capacity,
  intensity        = EXCLUDED.intensity;
