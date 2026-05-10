-- Add bugfix and project to ai_feature enum
ALTER TYPE ai_feature ADD VALUE IF NOT EXISTS 'bugfix';
ALTER TYPE ai_feature ADD VALUE IF NOT EXISTS 'project';
