-- Supabase migration for TODO_LIST app
-- Create the tasks table used by the app

DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    raw_input TEXT,
    energy_mode TEXT NOT NULL CHECK (energy_mode IN ('high_brain', 'routine', 'fried')),
    urls TEXT[] NOT NULL DEFAULT '{}',
    ai_daily_research JSONB DEFAULT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    due_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    emoji TEXT NOT NULL DEFAULT '🧠',
    images TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON tasks FOR DELETE USING (true);

COMMENT ON COLUMN tasks.energy_mode IS 'Filters the cognitive load: high_brain (🧠), routine (☕), fried (🥱)';
COMMENT ON COLUMN tasks.priority IS 'Priority flags: high (red), medium (yellow), low (green)';
COMMENT ON COLUMN tasks.ai_daily_research IS 'Stores Google Search-grounded updates: { "summary": "...", "urls": ["..."] }';
COMMENT ON COLUMN tasks.images IS 'Stores base64 encoded images uploaded by the user';
