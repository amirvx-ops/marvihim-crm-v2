-- Migration: Create activity_log table for tracking all changes
-- Run with: supabase apply_migration or via SQL editor

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,          -- 'lead', 'customer', 'meeting', 'transaction'
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,                -- 'create', 'update', 'status_change', 'note_added', 'assigned'
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    performed_by TEXT NOT NULL,          -- worker name: עדי, לידור, אסף, אמיר, system
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_performer ON activity_log(performed_by);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (adjust per your auth setup)
CREATE POLICY "activity_log_all" ON activity_log FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE activity_log IS 'Tracks every change made to leads, customers, meetings, and transactions';
