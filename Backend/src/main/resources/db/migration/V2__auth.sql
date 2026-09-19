ALTER TABLE projects ADD COLUMN invite_code VARCHAR(8);
UPDATE projects SET invite_code = upper(substr(md5(random()::text), 1, 6)) WHERE invite_code IS NULL;
ALTER TABLE projects ALTER COLUMN invite_code SET NOT NULL;
ALTER TABLE projects ADD CONSTRAINT projects_invite_code_key UNIQUE (invite_code);