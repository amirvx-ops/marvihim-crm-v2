-- Migration: Add columns discovered from actual Google Sheets analysis
-- These fields exist in the real workflows but are missing from the DB

-- =============================================================
-- LEADS: Fields from Adi's sheet (per-insurance-company tracking)
-- =============================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phoenix_agent TEXT;         -- "ליד לפניקס" - שם סוכן בהפניקס (עבר לאריה, עבר לשיראל...)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS harel_agent TEXT;           -- "ליד הראל" - שם סוכן בהראל (עבר ללינוי, עבר לרפאל...)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS internal_lead BOOLEAN DEFAULT FALSE; -- "ליד פנימי" - סימון / 
ALTER TABLE leads ADD COLUMN IF NOT EXISTS agent_appointment_amount NUMERIC;    -- "מינוי סוכן" - סכום מינוי סוכן
ALTER TABLE leads ADD COLUMN IF NOT EXISTS closing_amount NUMERIC;              -- "סכום סגירה" - סכום סגירה מספרי
ALTER TABLE leads ADD COLUMN IF NOT EXISTS closing_status TEXT;                  -- "סכום סגירה" - טקסט חופשי (לא נסגר, לא עונה, ?)

-- =============================================================
-- LEADS: Fields from Lidor's sheet (meeting coordination)
-- =============================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_har_bituach TEXT;       -- "כולל הר ביטוח?" - כן/לא/לא עולה/תעדכן בתז
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_agent TEXT;        -- "מטפל" - שם הסוכן (גאמביז, נופר, רמי, אסף)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meeting_time TEXT;          -- "שעה" - שעת הפגישה (09:00, 13:25...)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_passed BOOLEAN;       -- "הליד עבר?" - כן/לא
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_closed TEXT;           -- "נסגרה עסקה" - כן/לא/טקסט חופשי

-- =============================================================
-- LEADS: Fields from Asaf's sheet (sales & pension details)
-- =============================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pension_premium NUMERIC;     -- "פרמיה פנסיה"
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pension_accumulation NUMERIC; -- "צבירה פנסיה" 
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gemel_hishtalmut_accumulation NUMERIC; -- "צבירה גמל השתלמות"
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_amount NUMERIC;        -- "סכום כולל" (מגיליון אסף)

-- =============================================================
-- LEADS: Update main_status to reflect ACTUAL statuses from sheets
-- =============================================================
COMMENT ON COLUMN leads.main_status IS 
'סטטוסים מגיליון אסף: נויד, מעקב, ביקש מועד אחר, לא רלוונטי, לא מעוניין, אין מענה, סוכן, ניתנה הצעה, בתהליך הכנת מסמכים, לא ניתן לשפר.
סטטוסים כלליים: New, בטיפול, סגור';

-- =============================================================
-- CUSTOMERS: Missing from sheets
-- =============================================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile TEXT;  -- "נייד" (שדה נפרד מ-phone)

-- =============================================================
-- Create indexes for new query patterns
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON leads(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_leads_phoenix_agent ON leads(phoenix_agent) WHERE phoenix_agent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_harel_agent ON leads(harel_agent) WHERE harel_agent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_deal_closed ON leads(deal_closed) WHERE deal_closed IS NOT NULL;
