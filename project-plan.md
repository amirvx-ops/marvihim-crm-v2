# תוכנית פרויקט: מערכת CRM לסוכנות ביטוח מרוויחים
## הוראות עבודה ל-Claude Code + המלצות אדריכליות

---

## חלק א': ממצאי המחקר

### 1. מצב הדאטאבייס הנוכחי (Supabase)

**פרויקט:** `Surense - leads & updates` (ID: `fcrutegzkseyoobyrdxp`)

**טבלאות קיימות:**

| טבלה | שורות | תפקיד |
|-------|--------|--------|
| `customers` | 1,586 | פרטי לקוח - ת.ז., שם, טלפון, שנת לידה, מצב משפחתי, בן/בת זוג, surense_customer_id |
| `leads` | 1,009 | לידים - customer_id, partner_id, source, main_status, clearing_status, notes, surense_lead_id |
| `meetings` | 0 | פגישות - lead_id, תאריך, סוכן, סטטוס, סיכום |
| `transactions` | 0 | עסקאות - lead_id, customer_id, קטגוריה, סוג מוצר, חברת ביטוח, סכום פרמיה, מספר פוליסה |
| `partners` | 14 | שותפים/מקורות - שם, parent_id, email |

**שותפים קיימים:** MARVIHIM, FIBO, TaxPro, ALLJOBS, alljobs, HIGHTAX, TAXUP, אקסלנס, החזר-טק, יש לי זכות, סוכן שטח א, קבוצת פתרון, קו זכות, plus-finance

**סטטוסים נוכחיים ב-leads:**
- `main_status`: "New", "סגור (לא זכאי)"
- `clearing_status`: "Not Started"

### 2. פערים קריטיים בדאטאבייס

בהשוואה למה שהעובדים צריכים בגוגל שיטס, חסרים שדות משמעותיים:

**שדות חסרים ב-`leads`:**
- `assigned_to` - למי מוקצה הליד (עדי/לידור/אסף)
- `sub_status` - סטטוס משני (לתהליכי עבודה מורכבים)
- `salary_range` - טווח שכר (קריטי לזכאות פנסיונית)
- `has_pension` / `has_life_insurance` / `has_mortgage` - דגלים לסיווג
- `clearing_ordered_date` - תאריך הזמנת מסלקה
- `clearing_received_date` - תאריך קבלת מסלקה
- `har_insurance_ordered_date` - תאריך הזמנת הר ביטוח
- `har_insurance_received_date` - תאריך קבלת הר ביטוח
- `contact_attempts` - ניסיונות התקשרות
- `last_contact_date` - תאריך התקשרות אחרון
- `priority` - עדיפות טיפול
- `created_at` - תאריך יצירת הליד (חסר!)

**שדות חסרים ב-`customers`:**
- `email` - מייל
- `city` / `address` - כתובת
- `employer` - מעסיק
- `salary` - שכר

**שדות חסרים ב-`meetings`:**
- `meeting_type` - סוג פגישה (טלפון/זום/פרונטלי)
- `created_by` - מי יצר
- `reminder_date` - תזכורת

**טבלה חסרה: `activity_log`** - לוג פעילות לכל עדכון (מי, מתי, מה השתנה)

### 3. ניתוח גוגל שיטס (בהתבסס על מסמכי האפיון)

**גיליון עדי (מעקב לידים):**
- בנוי כגיליון מרכזי עם עמודות: שם, ת.ז., טלפון, מקור, סטטוס, מסלקה, הר ביטוח, הערות
- עדי עובדת על פילטור מהיר, צביעה לפי סטטוס, עדכון מהיר של שדות
- גיליון פעיל (עודכן היום!)

**גיליון לידור (תיאום פגישות):**
- גליונות חודשיים: "לידים מסלקה ינואר", "לידים מסלקה פברואר", "לידים מסלקה מרץ"
- מבנה: שם, תאריך פגישה, סוג פגישה, סטטוס תיאום, הערות
- מחולק לחודשים (לא ליד מרכזי אחד)

**גיליון אסף (תיעוד לקוחות):**
- יחסית חדש (נוצר ינואר 2026)
- מעקב תוצאות פגישות, סטטוס עסקאות, מוצרים שנמכרו

---

## חלק ב': המלצה אדריכלית - למה דווקא NocoDB + Appsmith

### האלטרנטיבה שאני ממליץ: NocoDB כשכבת "גוגל שיטס" על Supabase

**הבעיה עם Appsmith בלבד:**
Appsmith מעולה לבניית ממשקים, אבל ה-Table Widget שלו הוא **לא גוגל שיטס**. הוא דורש לחיצה כפולה לעריכה, שמירה מפורשת, ואין בו את הגמישות של גיליון אלקטרוני (גרירה, העתקה, פילטרים חופשיים, צביעה מותנית). העובדים **ירגישו את ההבדל**.

**הפתרון המומלץ: ארכיטקטורה היברידית**

```
┌─────────────────────────────────────────────────────────┐
│                    NocoDB (Cloud/Self-hosted)            │
│  ↕ מתחבר ישירות ל-PostgreSQL של Supabase                  │
│  = ממשק גיליון אלקטרוני לעדי, לידור, אסף               │
│  + Views מותאמים לכל עובד                                │
│  + פילטרים, מיונים, צביעה מותנית                         │
│  + Kanban view לניהול סטטוסים                            │
│  + Gallery view לכרטיסי לקוח                             │
│  + Forms לקלט חדש                                        │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│              Supabase (PostgreSQL)                       │
│  = Single Source of Truth                                │
│  + Realtime subscriptions                                │
│  + Row Level Security                                    │
│  + Triggers → n8n webhooks                               │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│              Appsmith                                    │
│  = דשבורדים לאמיר (BI + Performance)                     │
│  = פורטל שותפים (צפייה בלבד)                             │
│  = ממשקי ניהול מתקדמים                                   │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│          n8n (Automations)                               │
│  + Webhook על כל UPDATE ב-Supabase                       │
│  → Zapier MCP → Surense sync                            │
│  + ולידציות, התראות, אוטומציות                           │
└─────────────────────────────────────────────────────────┘
```

**למה NocoDB?**
1. **מרגיש כמו גוגל שיטס** - עריכה ישירה בתאים, גרירת עמודות, פילטרים, מיונים
2. **מתחבר ישירות ל-Supabase PostgreSQL** - אותו DB, ללא סנכרון
3. **Views שונים לכל עובד** - עדי רואה טבלה אחת, לידור אחרת, אסף שלישית
4. **Kanban** - מושלם לניהול סטטוסים (שורנס-סטייל)
5. **Forms** - טפסים לקלט שלא דורשים בנייה
6. **API** - כל שינוי זמין ב-API (לחיבור עם n8n)
7. **חינם (Self-hosted)** או זול מאוד (Cloud)

**אם בכל זאת רוצים Appsmith בלבד** - זה אפשרי, אבל יצטרך יותר התאמה. ראה חלק ג' למימוש בשתי הגישות.

---

## חלק ג': הוראות מפורטות ל-Claude Code

### שלב 0: הגדרת סביבה (5 דקות)

```
# הנחות: Claude Code מחובר ל-Git repo של Appsmith
# Supabase project ID: fcrutegzkseyoobyrdxp

# ודא שיש גישה ל-Supabase CLI או MCP
```

### שלב 1: מיגרציות Database (20 דקות)

**הוראות ל-Claude Code:**

```
בצע את המיגרציות הבאות ב-Supabase (project: fcrutegzkseyoobyrdxp).
בצע אותן בסדר, כל מיגרציה בנפרד.

מיגרציה 1: הוספת שדות ל-leads
---
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sub_status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS salary_range TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_pension BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_life_insurance BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_mortgage BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS clearing_ordered_date TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS clearing_received_date TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS har_insurance_ordered_date TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS har_insurance_received_date TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meeting_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meeting_scheduled_date TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meeting_result TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS products_sold TEXT[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_premium NUMERIC;

-- Enum-like constraints
ALTER TABLE leads ADD CONSTRAINT chk_priority CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent'));
ALTER TABLE leads ADD CONSTRAINT chk_assigned_to CHECK (assigned_to IN ('עדי', 'לידור', 'אסף', NULL));

מיגרציה 2: הוספת שדות ל-customers
---
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS employer TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS salary NUMERIC;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_refund_company TEXT;

מיגרציה 3: טבלת activity_log
---
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'lead', 'customer', 'meeting', 'transaction'
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'status_change', 'note_added'
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    performed_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

מיגרציה 4: עדכון main_status enum
---
-- הוספת סטטוסים נוספים שחסרים
COMMENT ON COLUMN leads.main_status IS 'סטטוסים אפשריים: New, בטיפול, ממתין למסלקה, ממתין להר ביטוח, מוכן לפגישה, תואמה פגישה, בוצעה פגישה, הצעה נשלחה, נסגרה עסקה, סגור (לא זכאי), סגור (לא מעוניין), סגור (אחר)';

מיגרציה 5: Trigger לעדכון updated_at
---
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

מיגרציה 6: Views לעובדים
---
-- View לעדי: כל הלידים עם פרטי לקוח
CREATE OR REPLACE VIEW adi_leads_view AS
SELECT 
    l.id as lead_id,
    c.full_name,
    c.identity_number,
    c.phone,
    c.email,
    c.birth_year,
    c.marital_status,
    c.salary,
    p.name as partner_name,
    l.source,
    l.main_status,
    l.sub_status,
    l.clearing_status,
    l.clearing_ordered_date,
    l.clearing_received_date,
    l.har_insurance_ordered_date,
    l.har_insurance_received_date,
    l.assigned_to,
    l.priority,
    l.contact_attempts,
    l.last_contact_date,
    l.notes,
    l.next_action,
    l.next_action_date,
    l.created_at,
    l.updated_at,
    l.surense_lead_id,
    c.surens_customer_id
FROM leads l
LEFT JOIN customers c ON l.customer_id = c.id
LEFT JOIN partners p ON l.partner_id = p.id
ORDER BY l.updated_at DESC;

-- View ללידור: לידים שצריכים תיאום פגישה
CREATE OR REPLACE VIEW lidor_meetings_view AS
SELECT 
    l.id as lead_id,
    c.full_name,
    c.phone,
    c.email,
    p.name as partner_name,
    l.main_status,
    l.clearing_status,
    l.clearing_received_date,
    l.meeting_type,
    l.meeting_scheduled_date,
    l.assigned_to,
    l.priority,
    l.contact_attempts,
    l.last_contact_date,
    l.notes,
    l.next_action,
    l.next_action_date,
    l.created_at
FROM leads l
LEFT JOIN customers c ON l.customer_id = c.id
LEFT JOIN partners p ON l.partner_id = p.id
WHERE l.main_status IN ('מוכן לפגישה', 'תואמה פגישה', 'ממתין למסלקה', 'ממתין להר ביטוח', 'בטיפול')
ORDER BY l.priority DESC, l.next_action_date ASC;

-- View לאסף: לידים עם פגישות מתואמות + היסטוריה
CREATE OR REPLACE VIEW asaf_sales_view AS
SELECT 
    l.id as lead_id,
    c.full_name,
    c.identity_number,
    c.phone,
    c.email,
    c.birth_year,
    c.salary,
    c.marital_status,
    p.name as partner_name,
    l.main_status,
    l.clearing_status,
    l.has_pension,
    l.has_life_insurance,
    l.has_mortgage,
    l.meeting_type,
    l.meeting_scheduled_date,
    l.meeting_result,
    l.products_sold,
    l.total_premium,
    l.notes,
    l.created_at,
    l.updated_at,
    l.surense_lead_id,
    c.surens_customer_id
FROM leads l
LEFT JOIN customers c ON l.customer_id = c.id
LEFT JOIN partners p ON l.partner_id = p.id
WHERE l.assigned_to = 'אסף'
    OR l.main_status IN ('תואמה פגישה', 'בוצעה פגישה', 'הצעה נשלחה', 'נסגרה עסקה')
ORDER BY l.meeting_scheduled_date DESC NULLS LAST;

-- View לדשבורד אמיר
CREATE OR REPLACE VIEW dashboard_overview AS
SELECT 
    p.name as partner_name,
    l.main_status,
    l.assigned_to,
    l.priority,
    COUNT(*) as lead_count,
    COUNT(CASE WHEN l.main_status = 'נסגרה עסקה' THEN 1 END) as closed_deals,
    SUM(CASE WHEN l.main_status = 'נסגרה עסקה' THEN l.total_premium ELSE 0 END) as total_premium,
    DATE_TRUNC('month', l.created_at) as month
FROM leads l
LEFT JOIN partners p ON l.partner_id = p.id
GROUP BY p.name, l.main_status, l.assigned_to, l.priority, DATE_TRUNC('month', l.created_at);
```

### שלב 2: גישה A - NocoDB (המומלצת) (30 דקות)

```
הגדרת NocoDB מחובר ל-Supabase:

1. התקן NocoDB (Cloud או Docker):
   docker run -d --name nocodb \
     -p 8080:8080 \
     nocodb/nocodb:latest

2. חבר ל-Supabase PostgreSQL:
   - Connection string: postgresql://postgres.[project-ref]:[password]@db.fcrutegzkseyoobyrdxp.supabase.co:5432/postgres
   - ב-NocoDB: Create Base → Connect to External Database → PostgreSQL

3. צור את ה-Views הבאים:

VIEW: "עדי - מעקב לידים"
- Source: adi_leads_view (או leads + customers JOIN)
- Visible columns: שם מלא, ת.ז., טלפון, מקור, סטטוס ראשי, סטטוס מסלקה, הר ביטוח, הערות, עדיפות, תאריך פעולה הבא
- Default sort: updated_at DESC
- Conditional coloring:
  - ירוק: main_status = 'נסגרה עסקה'
  - כתום: priority = 'High'
  - אדום: priority = 'Urgent'
  - אפור: main_status LIKE 'סגור%'
- Filters: main_status NOT IN ('סגור (לא זכאי)', 'סגור (לא מעוניין)', 'סגור (אחר)')
- Editable columns: כל השדות חוץ מ-surense_lead_id, surens_customer_id

VIEW: "לידור - תיאום פגישות"  
- Source: lidor_meetings_view
- Visible columns: שם, טלפון, מקור, סטטוס, סוג פגישה, תאריך פגישה, ניסיונות התקשרות, הערות
- Default sort: priority DESC, next_action_date ASC
- Kanban view: group by main_status
- Conditional coloring:
  - כתום: contact_attempts >= 3 (הרבה ניסיונות)
  - אדום: next_action_date < TODAY (פג תוקף)

VIEW: "אסף - מכירות"
- Source: asaf_sales_view  
- Visible columns: שם, ת.ז., טלפון, שכר, מצב משפחתי, פנסיה, ביטוח חיים, משכנתא, סוג פגישה, תאריך פגישה, תוצאה, מוצרים, פרמיה
- Gallery view: כרטיס לקוח עם כל הפרטים
- Form view: "דיווח פגישה" - לעדכון תוצאות

VIEW: "כל הלידים" (admin)
- Source: leads + customers full join
- All columns visible
- Group by: partner_name
```

### שלב 2: גישה B - Appsmith בלבד (45 דקות)

```
הוראות ל-Claude Code לבניית Appsmith:

=== PAGE 1: עדי - מעקב לידים ===

1. צור Datasource חדש:
   - Type: PostgreSQL
   - Connection: Supabase connection string
   - Name: "SupabaseDB"

2. צור Query: "fetch_adi_leads"
   SELECT * FROM adi_leads_view
   WHERE ({{!Select_Status.selectedOptionValue}} OR main_status = {{Select_Status.selectedOptionValue}})
     AND ({{!Select_Partner.selectedOptionValue}} OR partner_name = {{Select_Partner.selectedOptionValue}})
     AND ({{!Input_Search.text}} OR full_name ILIKE {{'%' + Input_Search.text + '%'}} 
          OR identity_number ILIKE {{'%' + Input_Search.text + '%'}}
          OR phone ILIKE {{'%' + Input_Search.text + '%'}})
   ORDER BY 
     CASE WHEN {{Select_Sort.selectedOptionValue}} = 'updated' THEN updated_at END DESC,
     CASE WHEN {{Select_Sort.selectedOptionValue}} = 'priority' THEN 
       CASE priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Normal' THEN 3 WHEN 'Low' THEN 4 END
     END ASC,
     CASE WHEN {{Select_Sort.selectedOptionValue}} = 'created' THEN created_at END DESC
   LIMIT 100 OFFSET {{(Table_Leads.pageNo - 1) * 100}};

3. צור Query: "update_lead"
   UPDATE leads SET
     main_status = {{Table_Leads.updatedRow.main_status}},
     sub_status = {{Table_Leads.updatedRow.sub_status}},
     clearing_status = {{Table_Leads.updatedRow.clearing_status}},
     priority = {{Table_Leads.updatedRow.priority}},
     assigned_to = {{Table_Leads.updatedRow.assigned_to}},
     notes = {{Table_Leads.updatedRow.notes}},
     next_action = {{Table_Leads.updatedRow.next_action}},
     next_action_date = {{Table_Leads.updatedRow.next_action_date}},
     contact_attempts = {{Table_Leads.updatedRow.contact_attempts}},
     last_contact_date = {{Table_Leads.updatedRow.last_contact_date}}
   WHERE id = {{Table_Leads.updatedRow.lead_id}};

4. Layout:
   - Top bar (RTL): 
     - Input widget "Input_Search" (placeholder: "חיפוש לפי שם/ת.ז./טלפון")
     - Select widget "Select_Status" (options from DISTINCT main_status)
     - Select widget "Select_Partner" (options from partners table)
     - Select widget "Select_Sort" (options: עדכון אחרון, עדיפות, תאריך יצירה)
   
   - Main area:
     - Table widget "Table_Leads":
       - Data: {{fetch_adi_leads.data}}
       - Update mode: Single row
       - Editable columns: main_status (Select), clearing_status (Select), 
         priority (Select), assigned_to (Select), notes (Text), 
         next_action (Text), next_action_date (DatePicker)
       - Column types:
         - main_status: Select (options: New, בטיפול, ממתין למסלקה, ממתין להר ביטוח, 
           מוכן לפגישה, תואמה פגישה, בוצעה פגישה, הצעה נשלחה, נסגרה עסקה, 
           סגור (לא זכאי), סגור (לא מעוניין), סגור (אחר))
         - priority: Select (options: Low, Normal, High, Urgent)
         - assigned_to: Select (options: עדי, לידור, אסף)
       - onSave: run update_lead then fetch_adi_leads
       - Server side pagination: enabled
       - Row coloring (use JS):
         {{currentRow.priority === 'Urgent' ? '#FFEBEE' : 
           currentRow.priority === 'High' ? '#FFF3E0' : 
           currentRow.main_status.startsWith('סגור') ? '#F5F5F5' :
           currentRow.main_status === 'נסגרה עסקה' ? '#E8F5E9' : ''}}
   
   - Right panel (Detail view on row select):
     - Customer details card
     - Activity log (from activity_log table)
     - Quick action buttons: "עדכן סטטוס", "הוסף הערה", "שלח ללידור"

=== PAGE 2: לידור - תיאום פגישות ===

דומה לעדי, עם שינויים:
- Query source: lidor_meetings_view
- עמודות מרכזיות: שם, טלפון, סטטוס, סוג פגישה, תאריך מתוכנן, ניסיונות
- Quick actions: "תואמה פגישה", "לא ענה", "לא מעוניין"
- Calendar widget: הצגת פגישות מתואמות בלוח שנה
- Counter widgets: כמה פגישות היום, השבוע, החודש

=== PAGE 3: אסף - מכירות ===

- Query source: asaf_sales_view
- עמודות: שם, פרטי לקוח, סטטוס, פרטי פגישה, מוצרים, פרמיה
- Detail modal: כרטיס לקוח מלא עם היסטוריית מסלקה
- Form: "דיווח פגישה חדשה" - meeting_result, products_sold, total_premium, notes
- Stats bar: סה"כ פרמיה החודש, אחוז המרה, ממוצע לפגישה

=== PAGE 4: דשבורד אמיר ===

1. Stats widgets (top row):
   - כרטיסים: סה"כ לידים, לידים חדשים החודש, עסקאות סגורות, סה"כ פרמיה

2. Charts:
   - Pie chart: חלוקת לידים לפי סטטוס
   - Bar chart: לידים לפי מקור/שותף
   - Line chart: מגמת לידים חודשית
   - Bar chart: ביצועי עובדים (כמות טיפול, אחוז המרה)
   - Funnel: New → בטיפול → פגישה → עסקה

3. Tables:
   - "לידים שדורשים תשומת לב" (ישנים, priority גבוה)
   - "עסקאות אחרונות"
   - "ביצועי שותפים"

=== PAGE 5: פורטל שותפים ===

- Read-only view
- Filter by partner (based on login)
- Columns: שם לקוח (חלקי), סטטוס, תאריך עדכון
- Stats: כמה לידים הפנו, כמה נסגרו, אחוז המרה
```

### שלב 3: חיבור Surense דרך Zapier MCP (15 דקות)

```
בהתבסס על ה-Zapier MCP הזמין, יש את הפעולות הבאות של Surense:
- create_lead / update_lead / get_lead / search_leads / delete_lead
- create_customer / update_customer / get_customer / search_customers / delete_customer
- create_meeting / update_meeting / get_meeting / search_meetings / delete_meeting
- create_workflow / update_workflow
- create_activity
- create_report / send_report
- create_meeting_summary / send_meeting_summary

כל עדכון ב-Supabase צריך לזרום ל-Surense:

n8n Workflow 1: "Sync Lead Status to Surense"
- Trigger: Supabase webhook on leads UPDATE
- Filter: main_status changed
- Action: Zapier MCP → surense update_lead
  - Map: surense_lead_id → lead ID
  - Map: main_status → Surense status field

n8n Workflow 2: "Sync Meeting to Surense"  
- Trigger: Supabase webhook on meetings INSERT/UPDATE
- Action: Zapier MCP → surense create_meeting / update_meeting

n8n Workflow 3: "Sync Transaction to Surense"
- Trigger: Supabase webhook on transactions INSERT
- Action: Zapier MCP → surense create_activity + update_lead

n8n Workflow 4: "Log Activity"
- Trigger: Any INSERT/UPDATE on leads, customers, meetings
- Action: INSERT to activity_log table
```

### שלב 4: RTL ו-Hebrew Support (10 דקות)

```
ב-Appsmith:
- App Theme → Direction: RTL
- All text widgets: textAlign = "right"
- Table headers: Hebrew names with JS mapping:
  {{
    {
      full_name: "שם מלא",
      identity_number: "ת.ז.",
      phone: "טלפון",
      partner_name: "מקור",
      main_status: "סטטוס",
      clearing_status: "מסלקה",
      priority: "עדיפות",
      notes: "הערות",
      assigned_to: "אחראי",
      next_action: "פעולה הבאה",
      next_action_date: "תאריך פעולה",
      contact_attempts: "ניסיונות",
      last_contact_date: "התקשרות אחרונה",
      created_at: "נוצר",
      updated_at: "עודכן"
    }
  }}

ב-NocoDB:
- NocoDB תומך ב-Hebrew out of the box
- שנה שמות עמודות ל-Hebrew ב-UI
- RTL הוא אוטומטי בדפדפן
```

---

## חלק ד': סדר עדיפויות וזמנים

### שלב 1 (חובה, 20 דק): Database Migrations
→ בלעדיהם אי אפשר להמשיך

### שלב 2 (חובה, 30-45 דק): ממשק עדי
→ הממשק הכי קריטי כי עדי היא צוואר הבקבוק

### שלב 3 (חובה, 20 דק): ממשק לידור
→ תיאום פגישות - תלוי בעדי

### שלב 4 (חובה, 20 דק): ממשק אסף
→ מכירות - תלוי בלידור

### שלב 5 (חשוב, 20 דק): דשבורד אמיר
→ מבט-על

### שלב 6 (חשוב, 15 דק): חיבור Surense
→ סנכרון דו-כיווני

### שלב 7 (נחמד, 10 דק): פורטל שותפים
→ צפייה חיצונית

**סה"כ: ~90 דקות (שעה וחצי)**

---

## חלק ה': הוראה ישירה ל-Claude Code (COPY-PASTE)

```markdown
# CLAUDE CODE INSTRUCTIONS - Insurance Agency CRM

## Context
You are building a CRM interface for an Israeli insurance agency on Appsmith, connected to Supabase PostgreSQL.
The Supabase project ID is: fcrutegzkseyoobyrdxp
The app should be in Hebrew, RTL layout.

## Your Tasks (in order):

### Task 1: Database Migrations
Run the following migrations on Supabase. Use the Supabase MCP tool `apply_migration` for each one.
[COPY MIGRATION SQL FROM SECTION ABOVE]

### Task 2: Build Appsmith Pages
You have access to the Appsmith repo via Git. Create/edit the following pages:

#### Page: "עדי - מעקב לידים"
- Full-width table with inline editing
- Server-side pagination, search, and filters
- Select dropdowns for status fields
- Conditional row coloring by priority/status
- Detail panel on row selection
- Hebrew column headers
- RTL layout

#### Page: "לידור - תיאום פגישות"  
- Filtered view showing only leads needing meeting scheduling
- Calendar widget for scheduled meetings
- Quick action buttons for common status updates
- Contact attempt counter

#### Page: "אסף - מכירות"
- Sales-focused view with customer details
- Meeting report form
- Monthly stats bar
- Product tracking

#### Page: "דשבורד"
- KPI cards (total leads, new this month, closed deals, total premium)
- Charts: leads by status (pie), leads by source (bar), monthly trend (line), employee performance (bar)
- Alert table: stale leads needing attention

### Task 3: Surense Sync Setup
Document the n8n workflows needed to sync data to Surense via Zapier MCP.
The available Zapier/Surense actions are:
- create/update/get/search/delete: lead, customer, meeting, workflow
- create_activity, create_report, create_meeting_summary

### Coding Standards:
- All queries use parameterized inputs (no SQL injection)
- Hebrew text in all user-facing labels
- Color scheme: Blue (#1976D2) primary, Green (#4CAF50) success, Orange (#FF9800) warning, Red (#F44336) danger
- Font: System default (supports Hebrew)
- All dates in DD/MM/YYYY format
- All phone numbers with +972 prefix option
```

---

## חלק ו': שאלות פתוחות להחלטה

1. **NocoDB vs Appsmith בלבד?** - ההמלצה שלי ברורה (NocoDB לעובדים + Appsmith לדשבורדים), אבל אתה מחליט.

2. **Self-hosted NocoDB vs Cloud?** - Cloud קל יותר להתחלה, self-hosted נותן שליטה מלאה.

3. **הגוגל שיטס** - צריך שתשתף את הגיליונות כ-"Anyone with the link can view" כדי שאוכל (או Claude Code) לחקור את המבנה המדויק ולמפות אותו. כרגע הם פרטיים (401).

4. **חיבור ל-Surense** - צריך למפות את שדות ה-Surense (status names, field IDs) כדי ליצור את ה-mapping הנכון.

5. **הרשאות** - האם כל העובדים רואים הכל? או שעדי רואה רק את שלה וכו'?

6. **היסטוריה** - האם לייבא את הנתונים ההיסטוריים מגוגל שיטס ל-Supabase?
