-- Add coverletter to ai_feature enum so the 자소서 Workshop can log
-- AI critique calls into ai_interactions for quota counting + analytics.
ALTER TYPE ai_feature ADD VALUE IF NOT EXISTS 'coverletter';
