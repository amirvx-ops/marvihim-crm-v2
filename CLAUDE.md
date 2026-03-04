# Insurance Agency CRM - Claude Code Master Instructions

## Project Context
Building a CRM system for "Marvihim" (מרוויחים) insurance agency. Replacing Google Sheets with Appsmith UI connected to Supabase PostgreSQL. All UI in Hebrew (RTL).

## Tech Stack
- **Database**: Supabase PostgreSQL (project: `fcrutegzkseyoobyrdxp`)
- **Frontend**: Appsmith (connected via Git)
- **Automations**: n8n (webhooks from Supabase)
- **CRM Sync**: Surense via Zapier MCP

## Database Schema (current + new columns from migration 04)

### customers (1,586 rows)
id, identity_number, full_name, phone, mobile, birth_year, marital_status, spouse_id, email, city, address, employer, salary, tax_refund_company, surens_customer_id, created_at, updated_at

### leads (1,009 rows)
**Original:** id, customer_id, partner_id, source, main_status, clearing_status, notes, surense_lead_id, assigned_to, sub_status, salary_range, has_pension, has_life_insurance, has_mortgage, clearing_ordered_date, clearing_received_date, har_insurance_ordered_date, har_insurance_received_date, contact_attempts, last_contact_date, priority, created_at, next_action, next_action_date, meeting_type, meeting_scheduled_date, meeting_result, products_sold, total_premium, updated_at

**NEW from migration 04 (matching Google Sheets):**
- phoenix_agent (text) — "ליד לפניקס" from Adi's sheet
- harel_agent (text) — "ליד הראל" from Adi's sheet  
- internal_lead (boolean) — "ליד פנימי" from Adi's sheet
- agent_appointment_amount (numeric) — "מינוי סוכן" from Adi's sheet
- closing_amount (numeric) — "סכום סגירה" numeric part
- closing_status (text) — "סכום סגירה" text part (לא נסגר, לא עונה, ?)
- has_har_bituach (text) — "כולל הר ביטוח?" from Lidor's sheet
- assigned_agent (text) — "מטפל" from Lidor's sheet (גאמביז, נופר, רמי)
- meeting_time (text) — "שעה" from Lidor's sheet
- lead_passed (boolean) — "הליד עבר?" from Lidor's sheet
- deal_closed (text) — "נסגרה עסקה" from Lidor's sheet
- pension_premium (numeric) — "פרמיה פנסיה" from Asaf's sheet
- pension_accumulation (numeric) — "צבירה פנסיה" from Asaf's sheet
- gemel_hishtalmut_accumulation (numeric) — "צבירה גמל השתלמות" from Asaf's sheet
- total_amount (numeric) — "סכום כולל" from Asaf's sheet

### partners (14 rows)
id, name, parent_id, contact_email, created_at
Names: MARVIHIM, FIBO, TaxPro, ALLJOBS, HIGHTAX, TAXUP, אקסלנס, החזר-טק, יש לי זכות, סוכן שטח א, קבוצת פתרון, קו זכות, plus-finance

### meetings (0 rows), transactions (0 rows), activity_log (new)

## Stakeholder Workflow Mapping (from actual Google Sheets)

### עדי (Adi) — Lead Manager
Sheet columns: תאריך, שם לקוח, ת.ז., מקור ליד, ליד לפניקס, ליד פנימי, ליד הראל, מינוי סוכן, סכום סגירה
- Works with monthly tabs (07/23 through 03/26)
- Free text everywhere (no dropdowns in original)
- Tracks per insurance company: הפניקס agents (אריה, שיראל, יקיר, לירי) and הראל agents (לינוי, רפאל, ליאור, טל, סיון, בר, לוי, אוריאל, לירן)
- Summary at bottom: total leads, closings, amounts

### לידור (Lidor) — Meeting Coordinator  
Sheet columns: תאריך, שם, ת.ז., כולל הר ביטוח?, מקור, מטפל, תאריך פגישה, שעה, הליד עבר?, נסגרה עסקה
- "מטפל" = agent: גאמביז, נופר, רמי (NOT עדי/לידור/אסף)
- Side summary tables: per agent performance + per source company
- Tracks commission: ₪20 per lead passed, ₪50 per closing

### אסף (Asaf) — Insurance Agent
Sheet columns: תאריך, שם, ת.ז., נייד, מקור הגעה, סכום כולל, סטטוס, הערות, פרמיה פנסיה, צבירה פנסיה, צבירה גמל השתלמות
- Statuses: נויד, מעקב, ביקש מועד אחר, לא רלוונטי, לא מעוניין, אין מענה, סוכן, ניתנה הצעה, לא ניתן לשפר, בתהליך הכנת מסמכים
- "מקור הגעה": תיאום פגישות לידור, תיק קיים, בדיקת מסלקה, תיק קיים / אמיר
- Heavy notes column with detailed pension analysis

## Execution Order
1. `migrations/04_sheets_columns.sql` — Add columns matching Google Sheets
2. `migrations/05_updated_views.sql` — Create views for each worker
3. `migrations/01_activity_log.sql` — Activity log table
4. `migrations/03_triggers.sql` — Auto-update triggers
5. Build Appsmith pages per `appsmith-pages/` specs (01→02→03→04)
6. Configure Surense sync per `docs/surense-sync.md`

## Design Standards
- Direction: RTL
- Language: Hebrew for all UI
- Colors: Blue #1976D2, Green #4CAF50, Orange #FF9800, Red #F44336
- Date format: DD/MM/YYYY
- Tables: spreadsheet-like, inline editing, server-side pagination, CSV export
- FREE TEXT fields where the original sheet had free text (don't force dropdowns!)
- Row coloring based on status/amounts (see page specs)
