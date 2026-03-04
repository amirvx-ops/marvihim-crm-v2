-- Migration: Triggers for updated_at auto-update and activity logging

-- =============================================================
-- Trigger: Auto-update updated_at on leads and customers
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leads_updated_at ON leads;
CREATE TRIGGER trigger_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- Trigger: Log status changes to activity_log
-- =============================================================
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log main_status changes
    IF OLD.main_status IS DISTINCT FROM NEW.main_status THEN
        INSERT INTO activity_log (entity_type, entity_id, action, field_changed, old_value, new_value, performed_by)
        VALUES ('lead', NEW.id, 'status_change', 'main_status', OLD.main_status, NEW.main_status, COALESCE(NEW.assigned_to, 'system'));
    END IF;
    
    -- Log clearing_status changes
    IF OLD.clearing_status IS DISTINCT FROM NEW.clearing_status THEN
        INSERT INTO activity_log (entity_type, entity_id, action, field_changed, old_value, new_value, performed_by)
        VALUES ('lead', NEW.id, 'status_change', 'clearing_status', OLD.clearing_status, NEW.clearing_status, COALESCE(NEW.assigned_to, 'system'));
    END IF;
    
    -- Log assignment changes
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        INSERT INTO activity_log (entity_type, entity_id, action, field_changed, old_value, new_value, performed_by)
        VALUES ('lead', NEW.id, 'assigned', 'assigned_to', OLD.assigned_to, NEW.assigned_to, COALESCE(NEW.assigned_to, 'system'));
    END IF;

    -- Log priority changes
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        INSERT INTO activity_log (entity_type, entity_id, action, field_changed, old_value, new_value, performed_by)
        VALUES ('lead', NEW.id, 'update', 'priority', OLD.priority, NEW.priority, COALESCE(NEW.assigned_to, 'system'));
    END IF;

    -- Log notes changes
    IF OLD.notes IS DISTINCT FROM NEW.notes AND NEW.notes IS NOT NULL THEN
        INSERT INTO activity_log (entity_type, entity_id, action, field_changed, old_value, new_value, performed_by)
        VALUES ('lead', NEW.id, 'note_added', 'notes', NULL, NEW.notes, COALESCE(NEW.assigned_to, 'system'));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lead_status_change ON leads;
CREATE TRIGGER trigger_lead_status_change
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_status_change();

-- =============================================================
-- Trigger: Log new lead creation
-- =============================================================
CREATE OR REPLACE FUNCTION log_lead_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_log (entity_type, entity_id, action, field_changed, new_value, performed_by)
    VALUES ('lead', NEW.id, 'create', 'lead', NEW.main_status, 'system');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lead_creation ON leads;
CREATE TRIGGER trigger_lead_creation
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_creation();

-- =============================================================
-- Function: Helper to notify n8n via pg_notify (for webhooks)
-- =============================================================
CREATE OR REPLACE FUNCTION notify_lead_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('lead_changes', json_build_object(
        'operation', TG_OP,
        'lead_id', NEW.id,
        'main_status', NEW.main_status,
        'assigned_to', NEW.assigned_to,
        'surense_lead_id', NEW.surense_lead_id
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_lead_change ON leads;
CREATE TRIGGER trigger_notify_lead_change
    AFTER INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION notify_lead_change();
