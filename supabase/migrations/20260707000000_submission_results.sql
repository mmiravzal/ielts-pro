-- Adds a jsonb column to store per-question breakdown of student answers.
-- Each entry: { questionIndex, questionType, question, studentAnswer, correctAnswer, isCorrect, points, maxPoints }

alter table public.submissions add column if not exists results jsonb;
