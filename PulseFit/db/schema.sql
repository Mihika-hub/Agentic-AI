-- PulseFit database schema. Safe to run many times.

CREATE TABLE IF NOT EXISTS users (
  id                    SERIAL PRIMARY KEY,
  email                 TEXT NOT NULL UNIQUE,
  password_hash         TEXT NOT NULL,
  full_name             TEXT NOT NULL,
  weekly_goal_workouts  INTEGER NOT NULL DEFAULT 4 CHECK (weekly_goal_workouts BETWEEN 1 AND 14),
  weekly_goal_minutes   INTEGER NOT NULL DEFAULT 180 CHECK (weekly_goal_minutes BETWEEN 10 AND 2000),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercises (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  muscle_group  TEXT NOT NULL CHECK (muscle_group IN ('Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio')),
  sets          INTEGER NOT NULL CHECK (sets BETWEEN 1 AND 20),
  reps          TEXT NOT NULL,
  difficulty    TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  rest_seconds  INTEGER NOT NULL CHECK (rest_seconds BETWEEN 0 AND 600),
  description   TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS workouts (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  workout_date      DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  duration_minutes  INTEGER CHECK (duration_minutes >= 0),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id           SERIAL PRIMARY KEY,
  workout_id   INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id  INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (workout_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id                   SERIAL PRIMARY KEY,
  workout_exercise_id  INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number           INTEGER NOT NULL CHECK (set_number >= 1),
  completed            BOOLEAN NOT NULL DEFAULT false,
  completed_at         TIMESTAMPTZ,
  UNIQUE (workout_exercise_id, set_number)
);

CREATE TABLE IF NOT EXISTS classes (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL UNIQUE,
  coach_name        TEXT NOT NULL,
  start_time        TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER NOT NULL CHECK (duration_minutes > 0),
  capacity          INTEGER NOT NULL CHECK (capacity > 0),
  intensity         TEXT NOT NULL CHECK (intensity IN ('Low', 'Medium', 'High'))
);

CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group        ON exercises (muscle_group);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date            ON workouts (user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_workouts_user_status_date     ON workouts (user_id, status, workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout     ON workout_exercises (workout_id, order_index);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise    ON workout_exercises (exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_exercise ON workout_sets (workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_classes_start_time            ON classes (start_time);

-- At most one unfinished workout per user per day ("today's workout").
CREATE UNIQUE INDEX IF NOT EXISTS ux_workouts_one_open_per_day
  ON workouts (user_id, workout_date) WHERE status <> 'completed';
