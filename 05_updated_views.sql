-- Migration: REPLACE views to match actual Google Sheets structure
-- Based on analysis of Adi's, Lidor's, and Asaf's real spreadsheets

-- =============================================================
-- VIEW: עדי - מעקב לידים 
-- Matches her sheet: תאריך, שם, ת.ז., מקור, ליד לפניקס, ליד פנימי, ליד הראל, מינוי סוכן, סכום סגירה
-- =============================================================
CREATE OR REPLACE VIEW adi_leads_view AS
SELECT 
    l.id AS lead_id,
    l.customer_id,
    l.created_at AS תאריך,
    c.full_name AS שם_לקוח,
    c.identity_number AS תעודת_זהות,
    p.name AS מקור_ליד,
    l.phoenix_agent AS ליד_לפניקס,
    l.internal_lead AS ליד_פנימי,
    l.harel_agent AS ליד_הראל,
    l.agent_appointment_amount AS מינוי_סוכן,
    l.closing_amount AS סכום_סגירה,
    l.closing_status AS סטטוס_סגירה,
    l.main_status,
    l.notes AS הערות,
    l.updated_at,
    l.surense_lead_id,
    c.surens_customer_id,
    c.phone AS טלפון
FROM leads l
LEFT JOIN customers c ON l.customer_id = c.id
LEFT JOIN partners p ON l.partner_id = p.id;

-- =============================================================
-- VIEW: לידור - תיאום פגישות
-- Matches her sheet: תאריך, שם, ת.ז., כולל הר ביטוח?, מקור, מטפל, תאריך פגישה, שעה, הליד עבר?, נסגרה עסקה
-- =============================================================
CREATE OR REPLACE VIEW lidor_meetings_view AS
SELECT 
    l.id AS lead_id,
    l.created_at AS תאריך,
    c.full_name AS שם,
    c.identity_number AS תז,
    l.has_har_bituach AS כולל_הר_ביטוח,
    p.name AS מקור,
    l.assigned_agent AS מטפל,
    l.meeting_scheduled_date AS תאריך_פגישה,
    l.meeting_time AS שעה,
    l.lead_passed AS הליד_עבר,
    l.deal_closed AS נסגרה_עסקה,
    c.phone AS טלפון,
    l.notes AS הערות,
    l.main_status,
    l.updated_at
FROM leads l
LEFT JOIN customers c ON l.customer_id = c.id
LEFT JOIN partners p ON l.partner_id = p.id;

-- =============================================================
-- VIEW: אסף - מכירות / תיעוד לקוחות
-- Matches his sheet: תאריך, שם, ת.ז., נייד, מקור הגעה, סכום כולל, סטטוס, הערות, פרמיה פנסיה, צבירה פנסיה, צבירה גמל השתלמות
-- =============================================================
CREATE OR REPLACE VIEW asaf_sales_view AS
SELECT 
    l.id AS lead_id,
    l.customer_id,
    l.created_at AS תאריך,
    c.full_name AS שם_לקוח,
    c.identity_number AS תעודת_זהות,
    COALESCE(c.mobile, c.phone) AS נייד,
    p.name AS מקור_הגעה,
    l.total_amount AS סכום_כולל,
    l.main_status AS סטטוס,
    l.notes AS הערות,
    l.pension_premium AS פרמיה_פנסיה,
    l.pension_accumulation AS צבירה_פנסיה,
    l.gemel_hishtalmut_accumulation AS צבירה_גמל_השתלמות,
    l.has_pension AS יש_פנסיה,
    l.has_life_insurance AS יש_ביטוח_חיים,
    l.has_mortgage AS יש_משכנתא,
    c.salary AS שכר,
    c.marital_status AS מצב_משפחתי,
    c.employer AS מעסיק,
    c.birth_year AS שנת_לידה,
    c.email AS אימייל,
    l.meeting_scheduled_date AS תאריך_פגישה,
    l.meeting_type AS סוג_פגישה,
    l.meeting_result AS תוצאת_פגישה,
    l.updated_at,
    l.surense_lead_id,
    c.surens_customer_id
FROM leads l
LEFT JOIN customers c ON l.customer_id = c.id
LEFT JOIN partners p ON l.partner_id = p.id;

-- =============================================================
-- VIEW: דשבורד - סיכום לאמיר
-- Based on the summary tables found in Adi's & Lidor's sheets
-- =============================================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    p.name AS partner_name,
    l.main_status,
    l.assigned_agent,
    DATE_TRUNC('month', l.created_at) AS month,
    COUNT(*) AS lead_count,
    -- Adi's metrics
    COUNT(CASE WHEN l.closing_amount IS NOT NULL AND l.closing_amount > 0 THEN 1 END) AS closed_deals,
    COALESCE(SUM(l.closing_amount), 0) AS total_closing_amount,
    COALESCE(SUM(l.agent_appointment_amount), 0) AS total_agent_appointment,
    -- Lidor's metrics
    COUNT(CASE WHEN l.lead_passed = TRUE THEN 1 END) AS leads_passed,
    COUNT(CASE WHEN l.deal_closed = 'כן' THEN 1 END) AS deals_confirmed,
    -- Asaf's metrics
    COUNT(CASE WHEN l.main_status = 'נויד' THEN 1 END) AS ported_count,
    COALESCE(SUM(l.pension_premium), 0) AS total_pension_premium,
    COALESCE(SUM(l.total_amount), 0) AS total_amount
FROM leads l
LEFT JOIN partners p ON l.partner_id = p.id
GROUP BY p.name, l.main_status, l.assigned_agent, DATE_TRUNC('month', l.created_at);

-- =============================================================
-- VIEW: שותפים - פורטל חיצוני (unchanged from before)
-- =============================================================
CREATE OR REPLACE VIEW partner_portal_view AS
SELECT 
    p.name AS partner_name,
    SPLIT_PART(c.full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(c.full_name, ' ', 2), 1) || '.' AS שם_לקוח,
    CASE 
        WHEN l.closing_amount > 0 THEN 'נסגרה עסקה'
        WHEN l.closing_status = 'לא נסגר' THEN 'לא נסגר'
        WHEN l.main_status = 'New' THEN 'חדש'
        ELSE 'בטיפול'
    END AS סטטוס,
    l.created_at AS תאריך_הפניה,
    l.updated_at AS עדכון_אחרון
FROM leads l
LEFT JOIN customers c ON l.customer_id = c.id
LEFT JOIN partners p ON l.partner_id = p.id;
